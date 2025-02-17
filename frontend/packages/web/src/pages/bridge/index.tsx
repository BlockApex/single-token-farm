import PageContainer from "@/components/PageContainer"; 
import React, { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletSelector } from "@/context/wallet-selector";
import { ethers } from "ethers";
import { Button, TopCard } from "@/components";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { useForm } from "react-hook-form";
import { FormLabel, Input, Text } from "@chakra-ui/react";
import bridgeAbi from "@/contracts/Bridge.json";
import { JUMP_TOKEN, MANTLE_BRIDGE_ADDRESS } from "@/env/contract";
import toast from "react-hot-toast";
import {
  Action,
  FinalExecutionOutcome,
  WalletSelector,
} from "@near-wallet-selector/core";
import { getTransactionState } from "@/tools";
import { KeyPair } from "near-api-js";
import { RPC_URL } from "@/context/evm-context";
export default function index() {
  const { accountId, selector, token } = useWalletSelector();
  const [inputTransactionHash, setInputTransactionHash] = useState("");
  const [signature, setSignature] = useState<undefined | string>(undefined);
  const [bridgeAmount, setBridgeAmount] = useState<undefined | string>(
    undefined
  );
  const [bridgeTransactionId, setBridgeTransactionId] = useState<
    undefined | string
  >(undefined);

  //check the transaction object is void or FinalExecutionOutcome
  function isFinalTransactionOutcome(
    transaction: any
  ): transaction is FinalExecutionOutcome {
    return transaction.status !== undefined;
  }

  return (
    <PageContainer>
      <TopCard
        bigText="Jump to Mantle"
        bottomDescription="Bridge your assets to Mantle Blockchain!"
        gradientText="Jump Bridge"
        jumpLogo
      />
      <div className="flex flex-col items-center justify-center w-full">
        <Button
          onClick={async () => {
            const app = "https://jump-bridge.vercel.app/";

            window.open(app, "_blank");
          }}
        >
          Open Bridge
        </Button>
      </div>
    </PageContainer>
  );
}

export function toFixedDown(num, fixed) {
  var re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
  return num.toString().match(re)[0];
}

async function getAccessKey(accountId: string, selector: WalletSelector) {
  const wallet = await selector.wallet();
  console.log(wallet.id);
  if (!wallet) return;
  const walletId = wallet.id;
  if (!walletId) return;

  switch (walletId) {
    case "near-wallet": {
      const privateKey = localStorage.getItem(
        "near-api-js:keystore:" + accountId + ":mainnet"
      );
      if (!privateKey) return;
      const keyPair = KeyPair.fromString(privateKey);
      const publicKey = keyPair.getPublicKey().toString();
      return {
        accountId: accountId,
        publicKey: publicKey,
        privateKey: privateKey,
      };
    }
    case "meteor-wallet": {
      const privateKey = localStorage.getItem(
        "_meteor_wallet" + accountId + ":mainnet"
      );
      if (!privateKey) return;
      const keyPair = KeyPair.fromString(privateKey);
      const publicKey = keyPair.getPublicKey().toString();
      return {
        accountId: accountId,
        publicKey: publicKey,
        privateKey: privateKey,
      };
    }
    case "here-wallet": {
      const hereKeyStore = JSON.parse(
        localStorage.getItem("herewallet:keystore") || "{}"
      );
      const privateKey = hereKeyStore.mainnet.accounts[accountId];
      if (!privateKey) return;
      const keyPair = KeyPair.fromString(privateKey);
      const publicKey = keyPair.getPublicKey().toString();
      return {
        accountId: accountId,
        publicKey: publicKey,
        privateKey: privateKey,
      };
    }
    case "sender": {
      toast.error("Sender Wallet is not supported");
      return;
    }
    default:
      {
        toast.error("Wallet is not supported");
      }
      break;
  }
}

export async function checkIsValidPubKey(
  networkId: "testnet" | "mainnet",
  accountId: string,
  pubkey: string
): Promise<Boolean> {
  function isSuccess(
    json: any
  ): json is { result: { access_key: { permission: string } } } {
    return json.result !== undefined && json.result.error === undefined;
  }

  const res = await fetch(`https://rpc.${networkId}.near.org/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "dontcare",
      method: "query",
      params: {
        request_type: "view_access_key",
        finality: "final",
        account_id: accountId,
        public_key: pubkey,
      },
    }),
  });

  const json = (await res.json()) as unknown as
    | { result: { access_key: { permission: string } } }
    | { error: { message: string } };

  if (isSuccess(json)) {
    return true;
  }

  return false;
}