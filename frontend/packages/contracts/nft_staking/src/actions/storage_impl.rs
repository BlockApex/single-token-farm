use crate::errors::{ERR_202, ERR_203};
use crate::investor::MIN_STORAGE_BALANCE;
use crate::{Contract, ContractExt};

use near_contract_standards::storage_management::{
  StorageBalance, StorageBalanceBounds, StorageManagement,
};
use near_sdk::json_types::U128;
use near_sdk::{assert_one_yocto, env, near_bindgen, AccountId, Promise};

/// Implements users storage management for the pool.
#[near_bindgen]
impl StorageManagement for Contract {
  #[payable]
  fn storage_deposit(
    &mut self,
    account_id: Option<AccountId>,
    registration_only: Option<bool>,
  ) -> StorageBalance {
    let initial_storage = env::storage_usage();
    let amount = env::attached_deposit();
    let account_id = account_id
      .map(|a| a.into())
      .unwrap_or_else(|| env::predecessor_account_id());
    let registration_only = registration_only.unwrap_or(false);
    let min_balance = self.storage_balance_bounds().min.0;
    let already_registered = self.investors.contains_key(&account_id);
    if amount < min_balance && !already_registered {
      panic!("{}", ERR_202);
    }
    if registration_only {
      // Registration only setups the account but doesn't leave space for tokens.
      if already_registered {
        if amount > 0 {
          Promise::new(env::predecessor_account_id()).transfer(amount);
        }
      } else {
        self.internal_deposit_storage_investor(&account_id, min_balance);
        let refund = amount - min_balance;
        if refund > 0 {
          Promise::new(env::predecessor_account_id()).transfer(refund);
        }
      }
    } else {
      self.internal_deposit_storage_investor(&account_id, amount);
    }

    self
      .internal_get_investor(&account_id)
      .unwrap()
      .track_storage_usage(initial_storage);

    self.storage_balance_of(account_id).unwrap()
  }

  #[payable]
  fn storage_withdraw(&mut self, amount: Option<U128>) -> StorageBalance {
    assert_one_yocto();
    let account_id = env::predecessor_account_id();
    let amount = amount.map(|a| a.0);
    let withdraw_amount = self.internal_storage_withdraw_investor(&account_id, amount);
    Promise::new(account_id.clone()).transfer(withdraw_amount);
    self.storage_balance_of(account_id).unwrap()
  }

  #[allow(unused_variables)]
  #[payable]
  fn storage_unregister(&mut self, force: Option<bool>) -> bool {
    assert_one_yocto();
    assert_ne!(force, Some(true), "force option is not implemented");

    let account_id = env::predecessor_account_id();
    if let Some(investor) = self.internal_get_investor(&account_id) {
      assert_eq!(investor.storage_used, 0, "{}", ERR_203);
      self.investors.remove(&account_id);
      Promise::new(account_id.clone()).transfer(investor.storage_deposit);
      true
    } else {
      false
    }
  }

  fn storage_balance_bounds(&self) -> StorageBalanceBounds {
    StorageBalanceBounds {
      min: U128(MIN_STORAGE_BALANCE),
      max: None,
    }
  }

  fn storage_balance_of(&self, account_id: AccountId) -> Option<StorageBalance> {
    match self.internal_get_investor(&account_id) {
      Some(investor) => Some(StorageBalance {
        total: U128(investor.storage_deposit),
        available: U128(investor.storage_funds_available()),
      }),
      None => None,
    }
  }
}
