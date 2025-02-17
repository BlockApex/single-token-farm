import { ID } from "@/types";
import { StakedEnum } from "@near/apollo";
import { PaginationFilters } from "@/utils/createPaginatedConnection";

export type NFTStaking = {
  collection_id: ID;
  collection_owner_id: ID;
  // collection_treasury: ID[];
  token_address: ID;
  // farm: ID;
  min_staking_period: string;
  early_withdraw_penalty: string;
  round_interval: string;
  collection_image: string;
  collection_modal_image: string;
  active: boolean;
};

export type StakedNFT = {
  nft_id: ID;
  collection_id: ID;
  owner_id: ID;
  staked_timestamp: string;
  balances: string[];
};

export type NFTStakingFilters = {
  search: string;
  showStaked: StakedEnum;
};

export type PaginatedNFTStakingFilters = NFTStakingFilters & PaginationFilters;
