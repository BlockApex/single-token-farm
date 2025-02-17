use near_sdk::{env, AccountId};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap};
use near_sdk::json_types::{U128};
use near_sdk::serde::{Serialize};

use crate::{StorageKey};
use crate::errors::*;

// min deposit for storage is 0.25 NEAR
pub const MIN_STORAGE_BALANCE: u128 = 250_000_000_000_000_000_000_000;

#[derive(BorshDeserialize, BorshSerialize)]
pub enum VInvestor {
  V1(Investor),
}

#[derive(BorshDeserialize, BorshSerialize, Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Investor {
  pub account_id: AccountId,
  // storage checks
  #[serde(with = "crate::string")]
  pub storage_deposit: u128,
  #[serde(with = "crate::string")]
  pub storage_used: u64,

  // marks whether is listing owner
  pub is_listing_owner: bool,
  // marks whether investor agreed to the creation of a new listing with them as owner
  pub authorized_listing_creation: bool, 

  // launchpad membership checks
  #[serde(with = "crate::string")]
  pub staked_token: u128,
  #[serde(with = "crate::string")]
  pub last_check: u64,

  // listing allocations treasury
  // tuple first value is allocations purchased, second value is tokens withdrawn
  #[serde(skip)]
  pub allocation_count: UnorderedMap<u64, (u64, u128)>,
}

impl VInvestor {
  pub fn new(account_id: AccountId, initial_deposit: u128) -> Self {
    Self::V1(Investor {
      account_id: account_id.clone(),
      storage_deposit: initial_deposit,
      is_listing_owner: false,
      authorized_listing_creation: false,
      storage_used: 0,
      staked_token: 0,
      last_check: 0,
      allocation_count: UnorderedMap::new(StorageKey::InvestorTreasury { account_id }),
    })
  }

  #[allow(unreachable_patterns)]
  pub fn into_current(self) -> Investor {
    match self {
      VInvestor::V1(investor) => investor,
      _ => unimplemented!(),
    }
  }
}

// Implements storage related methods
impl Investor {
  /// Returns NEAR necessary to pay for account's storage
  fn storage_usage_cost(&self) -> u128 {
    self.storage_used as u128 * env::storage_byte_cost()
  }

  /// Returns how much deposited NEAR is not being used for storage
  pub fn storage_funds_available(&self) -> u128 {
    let locked = self.storage_usage_cost();
    self.storage_deposit - locked
  }

  /// Asserts there is sufficient amount of $NEAR to cover storage usage.
  fn assert_storage_usage_cost(&self) {
    let storage_usage_cost = self.storage_usage_cost();
    assert!(
      storage_usage_cost <= self.storage_deposit,
      "{}. Needs to deposit {} more yoctoNear",
      ERR_201,
      storage_usage_cost - self.storage_deposit
    );
  }

  pub fn track_storage_usage(&mut self, initial_storage: u64) {
    let final_storage = env::storage_usage();
    if final_storage > initial_storage {
      self.storage_used += final_storage - initial_storage;
      self.assert_storage_usage_cost();
    } else {
      self.storage_used -= initial_storage - final_storage;
    }
  }

  pub fn deposit_storage_funds(&mut self, deposit: u128) {
    self.storage_deposit += deposit;
  }

  pub fn withdraw_storage_funds(&mut self, withdraw: u128) {
    self.storage_deposit -= withdraw;
  }
}

// implement membership related methods
impl Investor {
  pub fn get_current_membership_level(&self, tiers_quantities: &Vec<U128>) -> u64 {
    let mut membership_level = 0;
    let mut iterator = tiers_quantities.iter();
    loop {
      if let Some(v) = iterator.next() {
        if self.staked_token >= v.0 {
          membership_level += 1;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    membership_level
  }
  pub fn update_time_check(&mut self) {
    self.last_check = env::block_timestamp();
  }
}
