use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Serialize};

#[derive(BorshDeserialize, BorshSerialize, Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Treasury {
  #[serde(with = "crate::string")]
  pub presale_project_token_balance: u128,
  #[serde(with = "crate::string")]
  pub total_received_presale_price_token_balance: u128,

  #[serde(with = "crate::string")]
  pub liquidity_pool_project_token_balance: u128,
  #[serde(with = "crate::string")]
  pub liquidity_pool_price_token_balance: u128,

  #[serde(with = "crate::string")]
  pub all_investors_project_token_balance: u128,
  #[serde(with = "crate::string")]
  pub cancellation_funds_price_tokens: u128,
}

impl Treasury {
  pub fn new() -> Self {
    Self {
      presale_project_token_balance: 0,
      total_received_presale_price_token_balance: 0,
      liquidity_pool_project_token_balance: 0,
      liquidity_pool_price_token_balance: 0,
      all_investors_project_token_balance: 0,
      cancellation_funds_price_tokens: 0,
    }
  }

  pub fn fund_listing(&mut self, token_sale_amount: u128, token_liquidity_amount: u128) {
    self.presale_project_token_balance = token_sale_amount;
    self.liquidity_pool_project_token_balance = token_liquidity_amount;
  }

  pub fn update_treasury_after_sale(
    &mut self,
    lp_project_tokens_excess: u128,
    lp_price_tokens_to_deposit: u128,
  ) {
    self.presale_project_token_balance += lp_project_tokens_excess;
    self.liquidity_pool_project_token_balance -= lp_project_tokens_excess;

    self.total_received_presale_price_token_balance -= lp_price_tokens_to_deposit;
    self.liquidity_pool_price_token_balance += lp_price_tokens_to_deposit;
  }

  pub fn update_treasury_after_cancelation(&mut self) {
    self.presale_project_token_balance += self.all_investors_project_token_balance;
    self.all_investors_project_token_balance = 0;

    self.presale_project_token_balance += self.liquidity_pool_project_token_balance;
    self.liquidity_pool_project_token_balance = 0;

    self.cancellation_funds_price_tokens += self.total_received_presale_price_token_balance;
    self.cancellation_funds_price_tokens += self.liquidity_pool_price_token_balance;
    self.total_received_presale_price_token_balance = 0;
    self.liquidity_pool_price_token_balance = 0;
  }

  pub fn withdraw_project_funds(&mut self) -> (u128, u128) {
    let project_tokens = self.presale_project_token_balance;
    let price_tokens = self.total_received_presale_price_token_balance;

    self.presale_project_token_balance = 0;
    self.total_received_presale_price_token_balance = 0;

    (project_tokens, price_tokens)
  }

  pub fn update_after_investment(&mut self, project_tokens_bought: u128, price_tokens_sent: u128) {
    self.all_investors_project_token_balance += project_tokens_bought;
    self.presale_project_token_balance -= project_tokens_bought;
    self.total_received_presale_price_token_balance += price_tokens_sent;
  }

  pub fn withdraw_investor_funds(&mut self, amount: u128) {
    self.all_investors_project_token_balance -= amount;
  }

  pub fn withdraw_investor_funds_cancelled(
    &mut self,
    allocation_price: u128,
    allocations_to_withdraw: [u64; 2],
  ) -> u128 {
    let withdrawn_tokens = allocation_price * allocations_to_withdraw[0] as u128;
    self.cancellation_funds_price_tokens -= withdrawn_tokens;

    withdrawn_tokens
  }

  pub fn withdraw_liquidity_project_token(&mut self) -> u128 {
    let withdrawn = self.liquidity_pool_project_token_balance;
    self.liquidity_pool_project_token_balance = 0;
    withdrawn
  }

  pub fn undo_withdraw_liquidity_project_token(&mut self, amount: u128) {
    self.liquidity_pool_project_token_balance = amount;
  }

  pub fn withdraw_liquidity_price_token(&mut self) -> u128 {
    let withdrawn = self.liquidity_pool_price_token_balance;
    self.liquidity_pool_price_token_balance = 0;
    withdrawn
  }

  pub fn undo_withdraw_liquidity_price_token(&mut self, amount: u128) {
    self.liquidity_pool_price_token_balance = amount;
  }
}
