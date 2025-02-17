use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Serialize, Deserialize};
use near_sdk::json_types::{U128, U64};
use near_sdk::{env, AccountId};

use crate::errors::*;

pub const MIN_STORAGE_BALANCE: u128 = 500_000_000_000_000_000_000_000;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Account {
  pub account_id: AccountId,
  // storage checks
  pub storage_deposit: U128,
  pub storage_used: U64,
}

impl Account {
  pub fn new(account_id: AccountId, initial_deposit: u128) -> Self {
    Self {
      account_id,
      storage_deposit: U128(initial_deposit),
      storage_used: U64(0),
    }
  }

  // Returns NEAR necessary to pay for account's storage
  fn storage_usage_cost(&self) -> u128 {
    self.storage_used.0 as u128 * env::storage_byte_cost()
  }

  /// Returns how much deposited NEAR is not being used for storage
  pub fn storage_funds_available(&self) -> u128 {
    let locked = self.storage_usage_cost();
    self.storage_deposit.0 - locked
  }

  /// Asserts there is sufficient amount of $NEAR to cover storage usage.
  fn assert_storage_usage_cost(&self) {
    let storage_usage_cost = self.storage_usage_cost();
    let storage_deposit = self.storage_deposit.0;
    assert!(
      storage_usage_cost <= storage_deposit,
      "{}. Needs to deposit {} more yoctoNear",
      ERR_201,
      storage_usage_cost - storage_deposit
    );
  }

  pub fn track_storage_usage(&mut self, initial_storage: u64) {
    let final_storage = env::storage_usage();
    println!("final storage: {}", final_storage);
    let storage_used = self.storage_used.0;
    if final_storage > initial_storage {
      self.storage_used = U64(storage_used + final_storage - initial_storage);
      self.assert_storage_usage_cost();
    } else {
      self.storage_used = U64(storage_used + initial_storage - final_storage);
    }
  }

  pub fn deposit_storage_funds(&mut self, deposit: u128) {
    self.storage_deposit = U128(self.storage_deposit.0 + deposit);
  }

  pub fn withdraw_storage_funds(&mut self, withdraw: u128) {
    self.storage_deposit = U128(self.storage_deposit.0 - withdraw);
  }
}
