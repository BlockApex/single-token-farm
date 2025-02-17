/* Define all interested events that will trigger DB actions
 * and all their type interfaces
 * All other events will be discarded
 */
type NftCollection = {
  type: "NFTContract";
  account_id: string;
};

type NonFungibleTokenId = [NftCollection, string];

export const CREATE_STAKING_PRGRAM = "create_staking_program";
export type CreateStakingProgramData = {
  collection_address: string;
  collection_owner: string;
  token_address: string;
  collection_rps: { [key: string]: string };
  min_staking_period: string;
  early_withdraw_penalty: string;
  round_interval: string;
};

export const UPDATE_STAKING_PROGRAM = "update_staking_program";
export type UpdateStakingProgramData = {
  collection_address: string;
  early_withdraw_penalty: string | null;
  min_staking_period: string | null;
};

export const STAKE_NFT = "stake_nft";
export type StakeNftData = {
  token_id: NonFungibleTokenId;
  owner_id: string;
  staked_timestamp: string;
};

export const UNSTAKE_NFT = "unstake_nft";
export type UnstakeNftData = {
  token_id: NonFungibleTokenId;
  withdrawn_balance: { [key: string]: string };
};

export const WITHDRAW_REWARD = "withdraw_reward";
export type WithdrawRewardData = {
  collection: NftCollection;
  owner_id: string;
  token_id: string;
  amount: string;
};
