import Big from "big.js";
import toast from "react-hot-toast";
import create from "zustand";

import {
  viewFunction,
  getTransaction,
  getTokenStorage,
  executeMultipleTransactions,
} from "@/tools";
import { Transaction } from "@near/ts";
import type { WalletSelector } from "@near-wallet-selector/core";

export const useLaunchpadStore = create<{
  buyTickets(
    amount: number | string,
    priceToken: string,
    listingId: string,
    accountId: string,
    connection: WalletSelector
  ): Promise<void>;
  withdrawAllocations(
    listingId: string,
    project_token: string,
    accountId: string,
    connection: WalletSelector
  ): Promise<void>;
  increaseMembership(
    desiredLevel: number,
    accountId: string,
    connection: WalletSelector
  ): Promise<void>;
  decreaseMembership(
    desiredLevel: number,
    accountId: string,
    connection: WalletSelector
  ): Promise<void>;
}>((_) => ({
  async withdrawAllocations(listing_id, project_token, accountId, connection) {
    try {
      const transactions: Transaction[] = [];

      const projectTokenStorageBalance = await getTokenStorage(
        connection,
        accountId,
        project_token
      );

      if (!projectTokenStorageBalance) {
        transactions.push(
          getTransaction(
            accountId,
            project_token,
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
          import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
          "withdraw_allocations",
          {
            listing_id,
          }
        )
      );

      const wallet = await connection.wallet();

      await executeMultipleTransactions(transactions, wallet);
    } catch (error) {
      console.warn(error);
    }
  },

  async buyTickets(amount, priceToken, listingId, accountId, connection) {
    try {
      const transactions: Transaction[] = [];

      const launchpadStorage = await getTokenStorage(
        connection,
        accountId,
        import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT
      );

      if (!launchpadStorage) {
        transactions.push(
          getTransaction(
            accountId,
            import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
            "storage_deposit",
            {
              account_id: accountId,
              registration_only: true,
            },
            "0.45"
          )
        );
      }

      transactions.push(
        getTransaction(accountId, priceToken, "ft_transfer_call", {
          receiver_id: import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
          amount,
          memo: null,
          msg: JSON.stringify({
            type: "BuyAllocation",
            listing_id: listingId,
          }),
        })
      );

      const wallet = await connection.wallet();

      await executeMultipleTransactions(transactions, wallet);
    } catch (error) {
      console.warn(error);
    }
  },
  async increaseMembership(desiredLevel, accountId, connection) {
    try {
      const transactions: Transaction[] = [];

      const { tiers_minimum_tokens } = await viewFunction(
        connection,
        import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
        "view_contract_settings"
      );

      const investor = await viewFunction(
        connection,
        import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
        "view_investor",
        {
          account_id: accountId,
        }
      );

      const minTokens = tiers_minimum_tokens[desiredLevel - 1];

      if (!investor) {
        transactions.push(
          getTransaction(
            accountId,
            import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
            "storage_deposit",
            {
              account_id: accountId,
              registration_only: false,
            },
            "0.25"
          )
        );
      }

      const { staked_token = "0" } = investor || {};

      transactions.push(
        getTransaction(
          accountId,
          import.meta.env.VITE_STAKING_CONTRACT,
          "ft_transfer_call",
          {
            receiver_id: import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
            amount: new Big(minTokens).sub(new Big(staked_token)).toString(),
            memo: null,
            msg: JSON.stringify({
              type: "VerifyAccount",
              membership_tier: desiredLevel.toString(),
            }),
          }
        )
      );

      const wallet = await connection.wallet();

      await executeMultipleTransactions(transactions, wallet);
    } catch (error) {
      console.warn(error);
    }
  },
  async decreaseMembership(desiredLevel, accountId, connection) {
    try {
      const transactions: Transaction[] = [];

      const stakingStorageBalance = await getTokenStorage(
        connection,
        accountId,
        import.meta.env.VITE_STAKING_CONTRACT
      );

      if (!stakingStorageBalance) {
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

      const { tiers_minimum_tokens } = await viewFunction(
        connection,
        import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
        "view_contract_settings"
      );

      const { staked_token } = await viewFunction(
        connection,
        import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
        "view_investor",
        {
          account_id: accountId,
        }
      );

      const minTokens = tiers_minimum_tokens[desiredLevel - 1];

      transactions.push(
        getTransaction(
          accountId,
          import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
          "decrease_membership_tier",
          {
            withdraw_amount: new Big(staked_token)
              .sub(new Big(minTokens))
              .toString(),
          }
        )
      );

      const wallet = await connection.wallet();

      await executeMultipleTransactions(transactions, wallet);
    } catch (error) {
      console.warn(error);
    }
  },
}));
