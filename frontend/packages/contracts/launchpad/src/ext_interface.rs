use near_sdk::json_types::{U128, U64};
use near_sdk::{ext_contract, AccountId, PromiseOrValue};
use crate::token_handler::{TokenType};

#[ext_contract(ext_fungible_token)]
pub trait FunglibleToken {
  fn ft_transfer(receiver_id: AccountId, amount: U128, memo: Option<String>);

  fn ft_transfer_call(receiver_id: AccountId, amount: U128, memo: Option<String>, msg: String);
}

#[ext_contract(ext_dex)]
pub trait Dex {
  fn add_simple_pool(tokens: Vec<AccountId>, fee: u32);
  // add tokens with a simple empty message in ft_transfer_call
  fn add_liquidity(pool_id: u64, amounts: Vec<U128>, min_amounts: Option<Vec<U128>>);
}

#[ext_contract(ext_self)]
pub trait SelfCalls {
  fn callback_token_transfer_to_owner(token_type: TokenType, old_value: U128);

  fn callback_token_transfer_to_project_owner(
    listing_id: U64,
    old_value: U128,
    field: String,
    fee: Option<U128>,
  );

  fn callback_token_transfer_to_investor(
    &mut self,
    investor_id: AccountId,
    listing_id: U64,
    withdraw_amount: U128,
  );

  fn callback_membership_token_transfer_to_investor(investor_id: AccountId, amount: U128);

  fn callback_dex_launch_create_pool(
    listing_id: U64,
    original_deposit: U128,
  ) -> PromiseOrValue<bool>;

  fn callback_dex_deposit_project_token(
    listing_id: U64,
    original_deposit: U128,
    launchpad_fee: U128,
  );

  fn callback_dex_deposit_price_token(listing_id: U64, original_deposit: U128, launchpad_fee: U128);

  fn callback_dex_add_liquidity(
    &mut self,
    listing_id: U64,
    original_deposit: U128,
  ) -> PromiseOrValue<bool>;
}
