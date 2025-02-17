import create from "zustand";
import {
  viewFunction,
  getTransaction,
  getSingleTransaction,
  executeMultipleTransactions,
} from "@/tools";
import { Token, Transaction } from "@near/ts";
import type { WalletSelector } from "@near-wallet-selector/core";
import { utils } from "near-api-js";
import Big from "big.js";
import { viewMethod } from "@/helper/near";

export const useNftStaking = create<{
  loading: boolean;
  tokens: Token[];
  fetchUserTokens: (
    connection: WalletSelector,
    account: string,
    collection: string
  ) => Promise<void>;
  stake: (
    connection: WalletSelector,
    account: string,
    collection: string,
    tokens: string[]
  ) => Promise<void>;
  unstake: (
    connection: WalletSelector,
    account: string,
    tokens: Token[],
    collection: string
  ) => Promise<void>;
  getTokenStorage: (
    connection: WalletSelector,
    account: string,
    token: string
  ) => Promise<any>;
  getMinStorageCost: (
    connection: WalletSelector,
    token: string
  ) => Promise<any>;
  claimRewards: (
    connection: WalletSelector,
    account: string,
    tokens: Token[],
    collection: string
  ) => Promise<any>;
}>((set, get) => ({
  tokens: [],
  loading: false,

  fetchUserTokens: async (connection, account, collection) => {
    set({
      loading: true,
    });

    try {
      const staked = await viewFunction(
        connection,
        import.meta.env.VITE_NFT_STAKING_CONTRACT,
        "view_staked",
        {
          account_id: account,
          collection: {
            type: "NFTContract",
            account_id: collection,
          },
        }
      );

      const tokens: Token[] = [];
      const promises: unknown[] = [];
      for (let i = 0; i < staked.length; i++) {
        promises.push(
          // eslint-disable-next-line no-async-promise-executor
          new Promise(async (resolve, _reject) => {
            const balancePromise = viewFunction(
              connection,
              import.meta.env.VITE_NFT_STAKING_CONTRACT,
              "view_staked_nft_balance",
              {
                nft_id: [
                  {
                    type: "NFTContract",
                    account_id: collection,
                  },
                  staked[i],
                ],
              }
            );
            //staked_timestamp
            const stakedNftPromise = viewFunction(
              connection,
              import.meta.env.VITE_NFT_STAKING_CONTRACT,
              "view_staked_nft",
              {
                nft_id: [
                  {
                    type: "NFTContract",
                    account_id: collection,
                  },
                  staked[i],
                ],
              }
            );

            const tokenPromise = viewFunction(
              connection,
              collection,
              "nft_token",
              {
                token_id: staked[i],
              }
            );
            const result = await Promise.all([
              balancePromise,
              stakedNftPromise,
              tokenPromise,
            ]);
            const balance = result[0];
            const { staked_timestamp } = result[1];
            const token = result[2];

            resolve(
              tokens.push({ ...token, balance, stakedAt: staked_timestamp })
            );
          })
        );
      }
      await Promise.all(promises);
      /*   console.log({
        staked,
        connection,
        account,
        collection,
        tokens,
      }); */

      set({
        tokens,
      });
    } catch (e) {
      console.warn(e);

      set({
        tokens: [],
      });
    } finally {
      set({
        loading: false,
      });
    }
  },

  stake: async (connection, account, collection, tokens) => {
    const wallet = await connection.wallet();

    const transactions: Transaction[] = [];

    const stakingStorage = await get().getTokenStorage(
      connection,
      account,
      import.meta.env.VITE_NFT_STAKING_CONTRACT
    );

    if (
      !stakingStorage ||
      new Big(stakingStorage?.available).lte("100000000000000000000000")
    ) {
      transactions.push(
        getTransaction(
          account,
          import.meta.env.VITE_NFT_STAKING_CONTRACT,
          "storage_deposit",
          {
            account_id: account,
            registration_only: false,
          },
          "0.25"
        )
      );
    }

    tokens.forEach((tokenId) => {
      let approval_id: number | null = null;
      //TODO: temporary fix for neartopia
      if (
        collection.includes("neartopia") ||
        collection.includes("secretskelliessociety")
      ) {
        approval_id = 0;
      }
      transactions.push(
        getTransaction(account, collection, "nft_transfer_call", {
          receiver_id: import.meta.env.VITE_NFT_STAKING_CONTRACT,
          token_id: tokenId,
          approval_id: approval_id,
          memo: null,
          msg: JSON.stringify({
            type: "Stake",
          }),
        })
      );
    });

    await executeMultipleTransactions(transactions, wallet);
  },

  unstake: async (connection, account, tokens, collection) => {
    const wallet = await connection.wallet();

    const transactions: any = [];

    tokens.forEach(({ token_id }) => {
      transactions.push(
        getTransaction(
          account,
          import.meta.env.VITE_NFT_STAKING_CONTRACT,
          "unstake",
          {
            token_id: [
              {
                type: "NFTContract",
                account_id: collection,
              },
              token_id,
            ],
          }
        )
      );
    });

    const balances = tokens.reduce<string[]>((current, { balance }) => {
      for (const key in balance) {
        if (balance[key] === "0" || current.includes(key)) {
          continue;
        }

        current.push(key);
      }

      return current;
    }, []);

    for (const key of balances) {
      const storage = await get().getTokenStorage(connection, account, key);
      const storageMin = await get().getMinStorageCost(connection, key);
      const nearStorageCost = utils.format.formatNearAmount(storageMin?.min);

      if (!storage) {
        transactions.push(
          getTransaction(
            account,
            key,
            "storage_deposit",
            {
              account_id: account,
              registration_only: false,
            },
            nearStorageCost
          )
        );
      }

      transactions.push(
        getTransaction(
          account,
          import.meta.env.VITE_NFT_STAKING_CONTRACT,
          "withdraw_reward",
          {
            collection: {
              type: "NFTContract",
              account_id: collection,
            },
            token_id: key,
          }
        )
      );
    }

    await executeMultipleTransactions(transactions, wallet);
  },

  claimRewards: async (connection, account, tokens, collection) => {
    const wallet = await connection.wallet();

    const transactions: any = [];

    const remainStorage: {
      total: string;
      available: string;
    } | null = await viewMethod(
      import.meta.env.VITE_NFT_STAKING_CONTRACT,
      "storage_balance_of",
      {
        account_id: account,
      }
    );
    //TODO: Temporary fix for claim deposit
    if (
      remainStorage != null &&
      new Big(remainStorage?.available).lte("50000000000000000000000")
    ) {
      transactions.push(
        getTransaction(
          account,
          import.meta.env.VITE_NFT_STAKING_CONTRACT,
          "storage_deposit",
          {
            account_id: account,
            registration_only: false,
          },
          "0.0023"
        )
      );
    }
    const chunkSize = 25;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const args = tokens.slice(i, i + chunkSize).map(({ token_id }) => ({
        type: "FunctionCall",
        params: {
          methodName: "claim_reward",
          args: {
            collection: {
              type: "NFTContract",
              account_id: collection,
            },
            token_id: [
              {
                type: "NFTContract",
                account_id: collection,
              },
              token_id,
            ],
          },
          gas: "12000000000000",
          deposit: "1",
        },
      }));
      transactions.push({
        receiverId: import.meta.env.VITE_NFT_STAKING_CONTRACT,
        actions: args,
        singerId: account,
      });
    }
    /* tokens.forEach(({ token_id }) => {
      transactions.push(
        getTransaction(
          account,
          import.meta.env.VITE_NFT_STAKING_CONTRACT,
          "claim_reward",
          {
            collection: {
              type: "NFTContract",
              account_id: collection,
            },
            token_id: [
              {
                type: "NFTContract",
                account_id: collection,
              },
              token_id,
            ],
          }
        )
      );
    }); */

    const balances = tokens.reduce<string[]>((current, { balance }) => {
      for (const key in balance) {
        if (balance[key] === "0" || current.includes(key)) {
          continue;
        }

        current.push(key);
      }

      return current;
    }, []);

    for (const key of balances) {
      const storage = await get().getTokenStorage(connection, account, key);
      const storageMin = await get().getMinStorageCost(connection, key);
      const nearStorageCost = utils.format.formatNearAmount(storageMin?.min);

      if (!storage) {
        transactions.push(
          getTransaction(
            account,
            key,
            "storage_deposit",
            {
              account_id: account,
              registration_only: false,
            },
            nearStorageCost
          )
        );
      }

      transactions.push(
        getTransaction(
          account,
          import.meta.env.VITE_NFT_STAKING_CONTRACT,
          "withdraw_reward",
          {
            collection: {
              type: "NFTContract",
              account_id: collection,
            },
            token_id: key,
          }
        )
      );
    }
    executeMultipleTransactions(transactions, wallet);
  },

  getTokenStorage: async (connection, account, token) => {
    try {
      return await viewFunction(connection, token, "storage_balance_of", {
        account_id: account,
      });
    } catch (e) {
      return;
    }
  },

  getMinStorageCost: async (connection, token) => {
    try {
      return await viewFunction(connection, token, "storage_balance_bounds");
    } catch (e) {
      return;
    }
  },
}));