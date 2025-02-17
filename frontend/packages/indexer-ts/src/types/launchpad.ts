/* Define all interested events that will trigger DB actions
 * and all their type interfaces
 * All other events will be discarded
 */
export const ADD_GUARDIAN = "add_guardian";
export type AddGuardianData = {
  new_guardian: string;
};

export const REMOVE_GUARDIAN = "remove_guardian";
export type RemoveGuardianData = {
  old_guardian: string;
};

export const RETRIVE_TREASURY_FUNDS = "retrieve_treasury_funds";
export type RetrieveTreasuryFundsData = {
  token_type: string;
  quantity: string;
};

export const CREATE_LISTING = "create_listing";
export type TokenType = {
  FT: {
    account_id: string;
  };
};
export type Listing = {
  listing_id: string;
  project_owner: string;
  project_token: TokenType;
  price_token: TokenType;
  listing_type: string;
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
};
export type CreateListingData = {
  listing_data: {
    V1: Listing;
  };
};

export const CANCEL_LISTING = "cancel_listing";
export type CancelListingData = {
  listing_id: string;
};

export const PROJECT_FUND_LISTING = "project_fund_listing";
export type ProjectFundListingData = {
  listing_id: string;
  tokens_sale: string;
  tokens_liquidity: string;
};

export const PROJECT_WITHDRAW_LISTING = "project_withdraw_listing";
export type ProjectWithdrawListingData = {
  listing_id: string;
  project_tokens_withdraw: string;
  price_tokens_withdraw: string;
  project_status: string;
};

export const INVESTOR_BUY_ALLOCATIONS = "investor_buy_allocations";
export type InvestorBuyAllocationsData = {
  investor_id: string;
  listing_id: string;
  project_status: string;
  sale_phase: string;
  allocations_purchased: string;
  tokens_purchased: string;
  total_allocations_sold: string;
};

export const INVESTOR_WITHDRAW_ALLOCATIONS = "investor_withdraw_allocations";
export type InvestorWithdrawAllocationsData = {
  investor_id: string;
  listing_id: string;
  project_status: string;
  project_tokens_withdrawn: string;
  price_tokens_withdrawn: string;
};

export const INVESTOR_STAKE_MEMBERSHIP = "investor_stake_membership";
export type InvestorStakeMembershipData = {
  investor_id: string;
  token_quantity: string;
  new_membership_level: string;
};

export const INVESTOR_UNSTAKE_MEMBERSHIP = "investor_unstake_membership";
export type InvestorUnstakeMembershipData = {
  investor_id: string;
  token_quantity: string;
  new_membership_level: string;
};
