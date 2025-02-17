import actions from "./actions";
import { providers } from "near-api-js";

export interface TransactionPayload {
  status: Status;
  transaction: Transaction;
  receipts_outcome: ReceiptOutcome[];
}

interface Transaction {
  actions: Action[];
  hash: string;
  nonce: number;
  public_key: string;
  receiver_id: string;
  signature: string;
  signer_id: string;
}

interface Action {
  FunctionCall: FunctionCall;
}

interface FunctionCall {
  args: string;
  deposit: string;
  gas: number;
  method_name: string;
}

interface ReceiptOutcome {
  id: string;
  block_hash: string;
  outcome: Outcome;
}

interface Outcome {
  executor_id: string;
  gas_burnt: number;
  logs: string[];
  receipt_ids: string[];
  status: Status;
  tokens_burnt: string;
}

interface Status {
  SuccessValue?: string;
  SuccessReceiptId?: string;
  Failure?: string;
}

const rpcProviders = {
  testnet: "https://archival-rpc.testnet.near.org",
  mainnet: "https://archival-rpc.mainnet.near.org",
};

export const provider = new providers.JsonRpcProvider(
  rpcProviders[import.meta.env.VITE_NEAR_NETWORK]
);

export const getTransactionState = async (txHash: string, accountId: string) =>
  await provider.txStatus(txHash, accountId);

export const getTransactionsStatus = (receiptsOutcome: ReceiptOutcome[]) =>
  receiptsOutcome.every(
    ({ outcome }) => !Object.keys(outcome.status).includes("Failure")
  )
    ? "success"
    : "error";

export const getTransactionsAction = (
  transactions: Partial<TransactionPayload>[]
) => {
  return transactions
    .map((payload) => {
      const action = actions.find(({ check }) =>
        check(payload as TransactionPayload)
      );

      if (!action) {
        return;
      }

      const status = getTransactionsStatus(payload?.receipts_outcome!);

      return {
        status,
        message: action[status],
        transactionHash: payload.transaction?.hash,
      };
    })
    .filter((item) => item)[0];
};



export const getTxRec = async (tx:string , accountId:string) => {
  try {
    const res: any = await getTransactionState(tx, accountId!);
    const outcomes = res.receipts_outcome;

    let firstError: string = "";

    for (const outcome of outcomes) {
      const status = outcome.outcome.status;

      if (status && status.Failure) {
        // Drill down to get the specific execution error message
        const errorMessage = status.Failure?.ActionError?.kind?.FunctionCallError?.ExecutionError;

        if (errorMessage) {
          firstError = `Transaction with receipt ID ${outcome.id} failed with error: ${errorMessage}`;
        } else {
          firstError = `Transaction with receipt ID ${outcome.id} failed with an unknown error.`;
        }
        break; // Stop after finding the first error
      }
    }
    return firstError;
  } catch (error) {
    console.error("Error fetching transaction state:", error);
  }
};
