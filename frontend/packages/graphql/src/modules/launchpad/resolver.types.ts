import { PaginationFilters } from "@/utils/createPaginatedConnection";
import { StatusEnum, VisibilityEnum } from "@near/apollo";
import { ID } from "@/types/graphql-types";

export type Allocation = {
  account_id: ID;
  listing_id: ID;
  quantity_withdrawn: string;
  total_quantity: string;
  total_allocation: string;
};

export type NFTInvestor = {
  account_id: ID;
  listing_id: ID;
  quantity_withdrawn: string;
  total_quantity: string;
  total_allocation: string;
};

export type LaunchpadListing = {
  listing_id: ID;
  project_owner: ID;
  project_token: ID;
  price_token: string;
  open_sale_1_timestamp: string;
  open_sale_2_timestamp: string;
  final_sale_2_timestamp: string;
  liquidity_pool_timestamp: string;
  total_amount_sale_project_tokens: string;
  token_allocation_size: string;
  token_allocation_price: string;
  allocations_sold: string;
  liquidity_pool_project_tokens: string;
  liquidity_pool_price_tokens: string;
  fraction_instant_release: string;
  fraction_cliff_release: string;
  cliff_timestamp: string;
  end_cliff_timestamp: string;
  fee_price_tokens: string;
  fee_liquidity_tokens: string;
  status: string;
  dex_id: string;
  project_name: string;
  description_token: string;
  description_project: string;
  discord: string;
  twitter: string;
  telegram: string;
  website: string;
  whitepaper: string;
};

export type LaunchpadFilters = {
  status: StatusEnum;
  visibility: VisibilityEnum;
  showMineOnly: boolean;
  search: string;
};

export type PaginatedLaunchpadFilters = LaunchpadFilters & PaginationFilters;
