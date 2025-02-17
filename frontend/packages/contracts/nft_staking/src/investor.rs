use crate::errors::ERR_201;
use crate::Contract;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, AccountId};

// min deposit for storage is 0.25 NEAR
pub const MIN_STORAGE_BALANCE: u128 = 250_000_000_000_000_000_000_000;

#[derive(BorshDeserialize, BorshSerialize)]
pub enum VInvestor {
  V1(Investor),
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Investor {
  pub account_id: AccountId,
  // storage checks
  pub storage_deposit: u128,
  pub storage_used: u64,
}

impl VInvestor {
  pub fn new(account_id: AccountId, initial_deposit: u128) -> Self {
    Self::V1(Investor {
      account_id: account_id.clone(),
      storage_deposit: initial_deposit,
      storage_used: 0,
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

impl Contract {
  pub fn internal_get_investor(&self, account_id: &AccountId) -> Option<Investor> {
    self.investors.get(account_id)
  }

  pub fn internal_deposit_storage_investor(
    &mut self,
    account_id: &AccountId,
    amount: u128,
  ) -> Investor {
    let mut investor = self
      .investors
      .get(account_id)
      .unwrap_or_else(|| VInvestor::new(account_id.clone(), 0).into_current());
    investor.deposit_storage_funds(amount);
    self.investors.insert(&account_id, &investor);

    investor
  }

  pub fn internal_storage_withdraw_investor(
    &mut self,
    account_id: &AccountId,
    amount: Option<u128>,
  ) -> u128 {
    let mut investor = self.investors.get(account_id).unwrap();

    let available = investor.storage_funds_available();
    let withdraw = match amount {
      Some(amount) => amount,
      None => available, // TODO: test case to assert this
    };
    assert!(
      withdraw <= available,
      "available storage balance for withdraw is only {} but the requested amount was {}",
      available,
      withdraw,
    );

    investor.withdraw_storage_funds(withdraw);
    self.investors.insert(&account_id, &investor);

    withdraw
  }

  pub fn track_storage_usage(&mut self, account_id: &AccountId, initial_usage: u64) {
    let mut investor = self
      .internal_get_investor(&account_id)
      .unwrap_or_else(|| VInvestor::new(account_id.clone(), 0).into_current());

    investor.track_storage_usage(initial_usage);
    self.investors.insert(account_id, &investor);
  }
}
