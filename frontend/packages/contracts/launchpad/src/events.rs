use near_sdk::{log, AccountId};
use near_sdk::serde::{Serialize};
use near_sdk::serde_json::{json};
use near_sdk::json_types::{U128, U64};

use crate::listing::{VListing, ListingStatus, SalePhase};
use crate::token_handler::{TokenType};

fn log_event<T: Serialize>(event: &str, data: T) {
  let event = json!({
      "standard": "jump_launchpad",
      "version": "1.0.0",
      "event": event,
      "data": [data]
  });

  log!("EVENT_JSON:{}", event.to_string());
}

/// Owner actions events
pub fn add_guardian(new_guardian: &AccountId) {
  let data = json!({ "new_guardian": new_guardian });
  log_event("add_guardian", data);
}

pub fn remove_guardian(old_guardian: &AccountId) {
  let data = json!({ "old_guardian": old_guardian });
  log_event("remove_guardian", data);
}

pub fn retrieve_treasury_funds(token_type: &TokenType, quantity: U128) {
  let data = json!({ "token_type": token_type, "quantity": quantity });
  log_event("retrieve_treasury_funds", data);
}

/// Guardian actions events
pub fn create_listing(listing_data: VListing) {
  let data = json!({ "listing_data": listing_data });
  log_event("create_listing", data);
}

pub fn cancel_listing(listing_id: U64) {
  let data = json!({ "listing_id": listing_id });
  log_event("cancel_listing", data);
}

/// Project owner actions events
pub fn project_fund_listing(listing_id: U64, tokens_sale: U128, tokens_liquidity: U128) {
  let data = json!({
      "listing_id": listing_id,
      "tokens_sale": tokens_sale,
      "tokens_liquidity": tokens_liquidity
  });
  log_event("project_fund_listing", data);
}

pub fn project_withdraw_listing(
  listing_id: U64,
  project_tokens_withdraw: U128,
  price_tokens_withdraw: U128,
  project_status: &ListingStatus,
) {
  let data = json!({
      "listing_id": listing_id,
      "project_tokens_withdraw": project_tokens_withdraw,
      "price_tokens_withdraw": price_tokens_withdraw,
      "project_status": project_status
  });
  log_event("project_withdraw_listing", data);
}

/// Investor action events
pub fn investor_buy_allocations(
  investor_id: &AccountId,
  listing_id: U64,
  project_status: &ListingStatus,
  sale_phase: SalePhase,
  allocations_purchased: U64,
  total_allocations_sold: U64,
  tokens_purchased: U128,
) {
  let data = json!({
      "investor_id": investor_id,
      "listing_id": listing_id,
      "project_status": project_status,
      "sale_phase": sale_phase,
      "allocations_purchased": allocations_purchased,
      "tokens_purchased": tokens_purchased,
      "total_allocations_sold": total_allocations_sold,
  });
  log_event("investor_buy_allocations", data);
}

pub fn investor_withdraw_allocations(
  investor_id: &AccountId,
  listing_id: U64,
  project_tokens_withdrawn: U128,
  price_tokens_withdrawn: U128,
  project_status: &ListingStatus,
) {
  let data = json!({
      "investor_id": investor_id,
      "listing_id": listing_id,
      "project_tokens_withdrawn": project_tokens_withdrawn,
      "price_tokens_withdrawn": price_tokens_withdrawn,
      "project_status": project_status
  });
  log_event("investor_withdraw_allocations", data);
}

pub fn investor_stake_membership(
  investor_id: &AccountId,
  token_quantity: U128,
  new_membership_level: U64,
) {
  let data = json!({
      "investor_id": investor_id,
      "token_quantity": token_quantity,
      "new_membership_level": new_membership_level
  });
  log_event("investor_stake_membership", data);
}

pub fn investor_unstake_membership(
  investor_id: &AccountId,
  token_quantity: U128,
  new_membership_level: U64,
) {
  let data = json!({
      "investor_id": investor_id,
      "token_quantity": token_quantity,
      "new_membership_level": new_membership_level
  });
  log_event("investor_unstake_membership", data);
}
