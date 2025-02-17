import { utils, providers } from "near-api-js";
import type { CodeResult } from "near-api-js/lib/providers/provider";
import { Transaction } from "@near/ts";

export const AttachedGas = "300000000000000";

const refreshPage = (transactions) => {
  const newUrl =
    window.location.origin +
    window.location.pathname +
    "?transactionHashes=" +
    transactions;

  window.location.href = newUrl;
};

export const executeMultipleTransactions = async (
  transactions: Transaction[],
  wallet: any
) => {
  try {
    const result = await wallet.signAndSendTransactions({ transactions });

    refreshPage(result.map(({ transaction }) => transaction.hash).join(","));
  } catch (e) {
    console.warn(e);
  }
};

export const getTransaction = (
  signerId: string,
  receiverId: string,
  method: string,
  args: any,
  amount?: string
): Transaction => {
  return {
    signerId,
    receiverId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: method,
          args,
          gas: AttachedGas,
          deposit: amount ? utils.format.parseNearAmount(amount)! : "1",
        },
      },
    ],
  };
};

export const getSingleTransaction = (
  signerId: string,
  receiverId: string,
  actions: any[],
  amount?: string
): Transaction => {
  return {
    signerId,
    receiverId,
    actions,
  };
};

export const viewFunction = async (
  selector,
  contractId,
  methodName,
  args = {}
) => {
  const { network } = selector.options;

  const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

  const serializedArgs = window.btoa(JSON.stringify(args));

  const res = await provider.query<CodeResult>({
    request_type: "call_function",
    account_id: contractId,
    method_name: methodName,
    args_base64: serializedArgs,
    finality: "optimistic",
  });

  return (
    res &&
    res.result.length > 0 &&
    JSON.parse(Buffer.from(res.result).toString())
  );
};

export const getTokenStorage = async (connection, account, token) => {
  try {
    return await viewFunction(connection, token, "storage_balance_of", {
      account_id: account,
    });
  } catch (e) {
    return;
  }
};
