import create from "zustand";
import toast from "react-hot-toast";
import { getTransaction, executeMultipleTransactions } from "@/tools";
import type { WalletSelector } from "@near-wallet-selector/core";
import { utils } from "near-api-js";
import { Transaction } from "@near/ts";
import Big from "big.js";

export const useTokenLauncher = create<{
  createToken: (
    deployCost: string,
    accountId: string,
    prefix: string,
    args: any,
    connection: WalletSelector,
    contract: string,
    amount: string
  ) => Promise<void>;
}>(() => ({
  /** @description - stakes tokens into the contract and sends the deposit to pay storage fees */
  async createToken(
    deployCost,
    accountId,
    prefix,
    args,
    connection,
    contract,
    amount
  ) {
    try {
      const transactions: Transaction[] = [];

      const launcherContract = import.meta.env.VITE_TOKEN_LAUNCHER_CONTRACT;

      const nearDeployCost = utils.format.formatNearAmount(deployCost);

      const nearDeployCostFormatterd = Number(nearDeployCost)
        .toFixed(2)
        .toString();

      const charsAvailable = 63 - launcherContract.length;

      const validPrefix = prefix
        .replace(/[^a-zA-Z0-9w]/g, "")
        .slice(0, charsAvailable)
        .toLowerCase();

      const contract_account = validPrefix + "." + launcherContract;

      transactions.push(
        getTransaction(
          accountId!,
          launcherContract,
          "deploy_new_contract",
          {
            contract_to_be_deployed: contract,
            deploy_prefix: validPrefix,
            args: args,
          },
          nearDeployCostFormatterd
        )
      );

      transactions.push(
        getTransaction(
          accountId,
          contract_account,
          "storage_deposit",
          {
            account_id: contract_account,
            registration_only: true,
          },
          "0.05"
        )
      );

      const wallet = await connection.wallet();

      await executeMultipleTransactions(transactions, wallet);
    } catch (error) {
      return console.error(toast.error(`Token Launcher Error: ${error}`));
    }
  },
}));
