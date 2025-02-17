use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Serialize, Deserialize};
use near_sdk::json_types::{U128, U64};
use near_sdk::{AccountId};

use crate::errors::*;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Vesting {
  // account that owns vesting tokens
  pub beneficiary: AccountId,
  // quantity of tokens in vesting program
  pub locked_value: U128,
  // timestamp of when vesting started
  pub start_timestamp: U64,
  // time that must pass after start_timestamp for vesting to be completed
  pub vesting_duration: U64,
  // whether fastpass was already bought
  pub fast_pass: bool,
  // how many tokens where already withdrawn
  pub withdrawn_tokens: U128,
}

impl Vesting {
  pub fn new(
    beneficiary: AccountId,
    locked_value: u128,
    start_timestamp: u64,
    vesting_duration: u64,
  ) -> Self {
    Self {
      beneficiary,
      locked_value: U128(locked_value),
      start_timestamp: U64(start_timestamp),
      vesting_duration: U64(vesting_duration),
      fast_pass: false,
      withdrawn_tokens: U128(0),
    }
  }

  fn calculate_vested_tokens(&self, current_timestamp: u64) -> u128 {
    let start_timestamp = self.start_timestamp.0;
    let duration = self.vesting_duration.0;
    let end_timestamp = start_timestamp + duration;
    let tokens = self.locked_value.0;
    if current_timestamp < start_timestamp {
      0
    } else if current_timestamp >= end_timestamp {
      tokens
    } else {
      let passed_time = current_timestamp - start_timestamp;
      (tokens * passed_time as u128) / duration as u128
    }
  }

  pub fn calculate_available_withdraw(&self, current_timestamp: u64) -> u128 {
    let vested = self.calculate_vested_tokens(current_timestamp);
    let withdrawn = self.withdrawn_tokens.0;
    if vested >= withdrawn {
      vested - withdrawn
    } else {
      0
    }
  }

  pub fn evaluate_done_vesting(&self) -> bool {
    self.withdrawn_tokens == self.locked_value
  }

  pub fn withdraw_available(&mut self, current_timestamp: u64) -> u128 {
    let available = self.calculate_available_withdraw(current_timestamp);
    self.withdrawn_tokens = U128(self.withdrawn_tokens.0 + available);
    available
  }

  pub fn buy_fastpass(&mut self, current_timestamp: u64, fast_pass_acceleration: u64) {
    let duration = self.vesting_duration.0;
    let start_timestamp = self.start_timestamp.0;

    assert!(!self.fast_pass, "{}", ERR_103);
    assert!(
      start_timestamp + duration > current_timestamp,
      "{}",
      ERR_104
    );

    let elapsed_duration = current_timestamp - start_timestamp;
    let remaining_duration = duration - elapsed_duration;
    let new_remaining_duration = remaining_duration / fast_pass_acceleration;
    self.vesting_duration = U64(elapsed_duration + new_remaining_duration);
    self.fast_pass = true;
  }
}
