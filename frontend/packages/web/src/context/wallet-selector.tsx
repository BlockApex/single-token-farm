import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import type { AccountView } from "near-api-js/lib/providers/provider";
import { map, distinctUntilChanged } from "rxjs";
import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector, AccountState, Network } from "@near-wallet-selector/core";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupBitgetWallet } from "@near-wallet-selector/bitget-wallet";
import { setupCoin98Wallet } from "@near-wallet-selector/coin98-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet";
import { setupNeth } from "@near-wallet-selector/neth";
/* import { setupNightlyConnect } from "@near-wallet-selector/nightly-connect"; */
import { tokenMetadata } from "@/interfaces";
import { viewFunction } from "@/tools";
import { providers } from "near-api-js";
import { rpcUrl } from "@/utils/config";

interface TokenInterface {
  balance?: string | number;
  metadata?: tokenMetadata;
}
interface WalletSelectorContextValue {
  selector: WalletSelector;
  accounts: AccountState[];
  accountId: string | null;
  showModal: boolean;
  token: TokenInterface | undefined;
  xToken: TokenInterface | undefined;
  signOut: () => Promise<void>;
  toggleModal: () => void;
  viewMethod: any;
  callMethod: any;
  callMethodMulti: any;
  callMethodMultiActions: any;
}

export type Account = AccountView & {
  account_id: string;
};

const WalletSelectorContext =
  React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC<
  PropsWithChildren<Record<any, any>>
> = ({ children }) => {
  const [accountId, setAccountId] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [accounts, setAccounts] = useState<AccountState[]>([]);
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [token, setToken] = useState<TokenInterface>();
  const [xToken, setXToken] = useState<TokenInterface>();
  const [loaded, setLoaded] = useState(false);

  const toggleModal = () => setShowModal(!showModal);

  const signOut = async () => {
    if (!selector) {
      return;
    }

    const wallet = await selector.wallet();

    wallet.signOut();
  };

  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      // network: import.meta.env.VITE_NEAR_NETWORK || "testnet",
      network: {
        networkId: import.meta.env.VITE_NEAR_NETWORK || "testnet",
        nodeUrl: rpcUrl,
      } as Network,
      debug: false,
      modules: [
        setupMyNearWallet(),
        // setupMeteorWallet(),
        // setupHereWallet(),
        // setupSender(),
        // setupNightly(),
        // setupBitgetWallet(),
        // setupLedger({}),
        // setupCoin98Wallet(),
        // setupNeth(),
        // setupNearMobileWallet(),
      ],
    });

    const state = _selector.store.getState();

    setAccounts(state.accounts);
    setSelector(_selector);

    const tokenMetadata = await viewFunction(
      _selector,
      import.meta.env.VITE_BASE_TOKEN,
      "ft_metadata"
    );

    setToken({
      metadata: tokenMetadata,
      ...(token || undefined),
    });

    const xTokenMetadata = await viewFunction(
      _selector,
      import.meta.env.VITE_STAKING_CONTRACT,
      "ft_metadata"
    );

    setXToken({
      metadata: xTokenMetadata,
      ...(token || undefined),
    });

    setLoaded(true);
  }, []);

  useEffect(() => {
    init().catch((err) => {
      console.error(err , "HELLO NEAR WALLET SELECTOR");
      alert("Failed to initialize wallet selector");
    });
  }, [init]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    const subscription = selector.store.observable
      .pipe(
        map(({ accounts }) => accounts),
        distinctUntilChanged()
      )
      .subscribe((nextAccounts) => {
        setAccounts(nextAccounts);
        setShowModal(false);
      });

    return () => subscription.unsubscribe();
  }, [selector]);

  useEffect(() => {
    const newAccount =
      accounts.find((account) => account.active)?.accountId || "";

    setAccountId(newAccount);
  }, [accounts]);

  useEffect(() => {
    if (!accountId || !loaded) {
      return;
    }

    (async () => {
      const tokenBalance = await viewFunction(
        selector,
        import.meta.env.VITE_BASE_TOKEN,
        "ft_balance_of",
        {
          account_id: accountId,
        }
      );

      setToken({
        balance: tokenBalance,
        ...(token || null),
      });

      const xTokenBalance = await viewFunction(
        selector,
        import.meta.env.VITE_STAKING_CONTRACT,
        "ft_balance_of",
        {
          account_id: accountId,
        }
      );

      setXToken({
        balance: xTokenBalance,
        ...(xToken || null),
      });
    })();
  }, [accountId, loaded]);

  if (!selector) {
    return null;
  }

  async function viewMethod(contractId, methodName, args) {
    const { network } = (selector as any).options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
    const res = await provider.query({
      request_type: "call_function",
      account_id: contractId,
      method_name: methodName,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });

    return JSON.parse(Buffer.from((res as any).result).toString());
  }
  async function callMethod(
    contractId,
    methodName,
    args,
    gas,
    amount,
    callBackUrl
  ) {
    if (!accountId) {
      // toast.warn("Please connect wallet");
      throw new Error("ERR_NOT_SIGNED_IN");
    }
    const { contract } = (selector as any).store.getState();
    const wallet = await (selector as any).wallet();

    const transactions: any[] = [];
    transactions.push({
      signerId: accountId,
      receiverId: contractId || contract.contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: methodName || "add_message",
            args: args || { message: "Hello World" },
            gas: gas ? gas : "250000000000000",
            deposit: amount ? amount.toString() : "1",
          },
        },
      ],
    });

    const res = await wallet
      .signAndSendTransactions({
        transactions,
        callbackUrl: callBackUrl || "",
      })
      .catch((err) => {
        throw err;
      });
    return res;
  }
  async function callMethodMultiActions(contractId, actions, callBackUrl) {
    if (!accountId) {
      // toast.warn("Please connect wallet");
      throw new Error("ERR_NOT_SIGNED_IN");
    }
    const { contract } = (selector as any).store.getState();
    const wallet = await (selector as any).wallet();

    const transactions: any[] = [];
    transactions.push({
      signerId: accountId,
      receiverId: contractId || contract.contractId,
      actions: actions,
    });

    const res = await wallet
      .signAndSendTransactions({
        transactions,
        callbackUrl: callBackUrl || "",
      })
      .catch((err) => {
        throw err;
      });
    return res;
  }
  async function callMethodMulti(params, metadata, callbackUrl) {
    if (!accountId) {
      // toast.warn("Please connect wallet");
      throw new Error("ERR_NOT_SIGNED_IN");
    }
    const { contract } = (selector as any).store.getState();
    const wallet = await (selector as any).wallet();

    const transactions: any = [];
    for (const param of params) {
      transactions.push({
        signerId: accountId,
        receiverId: param.contractId || contract.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: param.methodName || "add_message",
              args: param.args || { message: "Hello World" },
              gas: param.gas ? param.gas : "250000000000000",
              deposit: param.amount ? param.amount.toString() : "0",
            },
          },
        ],
      });
    }

    const res = await wallet
      .signAndSendTransactions({
        transactions,
        metadata: JSON.stringify(metadata),
        callbackUrl: callbackUrl || "",
      })
      .catch((err) => {
        throw err;
      });
    return res;
  }

  return (
    <WalletSelectorContext.Provider
      value={{
        selector,
        accounts,
        accountId,
        showModal,
        signOut,
        toggleModal,
        token,
        xToken,
        viewMethod,
        callMethod,
        callMethodMulti,
        callMethodMultiActions,
      }}
    >
      {children}
    </WalletSelectorContext.Provider>
  );
};

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);

  if (!context) {
    throw new Error(
      "useWalletSelector must be used within a WalletSelectorContextProvider"
    );
  }

  return context;
}
