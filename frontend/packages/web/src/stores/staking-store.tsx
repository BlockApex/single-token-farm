import create from "zustand";
import { Transaction } from "@near/ts";
import toast from "react-hot-toast";
import {
  getTransaction,
  getTokenStorage,
  executeMultipleTransactions,
} from "@/tools";
import type { WalletSelector } from "@near-wallet-selector/core";

export const useStaking = create<{
  stakeXToken: (
    amount: string,
    accountId: string,
    connection: WalletSelector
  ) => Promise<void>;
  burnXToken: (
    amount: string,
    accountId: string,
    connection: WalletSelector
  ) => Promise<void>;
}>(() => ({
  /** @description - stakes tokens into the contract and sends the deposit to pay storage fees */
  async stakeXToken(amount, accountId, connection) {
    const transactions: Transaction[] = [];

    try {
      const stakingStorage = await getTokenStorage(
        connection,
        accountId,
        import.meta.env.VITE_STAKING_CONTRACT
      );

      if (!stakingStorage) {
        transactions.push(
          getTransaction(
            accountId,
            import.meta.env.VITE_STAKING_CONTRACT,
            "storage_deposit",
            {
              account_id: accountId,
              registration_only: false,
            },
            "0.25"
          )
        );
      }

      transactions.push(
        getTransaction(
          accountId,
          import.meta.env.VITE_BASE_TOKEN,
          "ft_transfer_call",
          {
            receiver_id: import.meta.env.VITE_STAKING_CONTRACT,
            amount,
            memo: null,
            msg: "mint",
          }
        )
      );

      const wallet = await connection.wallet();

      await executeMultipleTransactions(transactions, wallet);
    } catch (error) {
      return console.error(toast.error(`Stake Error: ${error}`));
    }
  },
  /** @description - unstakes tokens from the contract to the user wallet */
  async burnXToken(amount, accountId, connection) {
    const transactions: Transaction[] = [];
    try {
      const stakingStorage = await getTokenStorage(
        connection,
        accountId,
        import.meta.env.VITE_STAKING_CONTRACT
      );

      if (!stakingStorage) {
        transactions.push(
          getTransaction(
            accountId,
            import.meta.env.VITE_STAKING_CONTRACT,
            "storage_deposit",
            {
              account_id: accountId,
              registration_only: false,
            },
            "0.25"
          )
        );
      }

      transactions.push(
        getTransaction(
          accountId,
          import.meta.env.VITE_STAKING_CONTRACT,
          "burn_x_token",
          {
            quantity_to_burn: amount,
          }
        )
      );

      const wallet = await connection.wallet();

      await executeMultipleTransactions(transactions, wallet);

      toast.success("Staking Complete");
    } catch (error) {
      return console.error(toast.error(`Stake Error: ${error}`));
    }
  },
}));
