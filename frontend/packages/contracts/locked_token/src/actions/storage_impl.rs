use crate::*;
use crate::account::{MIN_STORAGE_BALANCE};

use near_sdk::{Promise};
use near_contract_standards::storage_management::{
  StorageBalance, StorageBalanceBounds, StorageManagement,
};

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
    let already_registered = self.users.contains_key(&account_id);
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
        self.internal_deposit_storage(&account_id, min_balance);
        let refund = amount - min_balance;
        if refund > 0 {
          Promise::new(env::predecessor_account_id()).transfer(refund);
        }
      }
    } else {
      self.internal_deposit_storage(&account_id, amount);
    }
    if !already_registered {
      self.ft_functionality.internal_register_account(&account_id);
    }
    let mut account = self.internal_get_account(&account_id).unwrap();
    account.track_storage_usage(initial_storage);
    self.internal_update_account(&account_id, &account);
    self.storage_balance_of(account_id).unwrap()
  }

  #[payable]
  fn storage_withdraw(&mut self, amount: Option<U128>) -> StorageBalance {
    assert_one_yocto();
    let account_id = env::predecessor_account_id();
    let amount = amount.unwrap_or(U128(0)).0;
    let withdraw_amount = self.internal_storage_withdraw(&account_id, amount);
    Promise::new(account_id.clone()).transfer(withdraw_amount);
    self.storage_balance_of(account_id).unwrap()
  }

  #[payable]
  fn storage_unregister(&mut self, force: Option<bool>) -> bool {
    assert_one_yocto();
    let account_id = env::predecessor_account_id();
    if let Some(account_deposit) = self.internal_get_account(&account_id) {
      if force.unwrap_or(false) {
        assert_eq!(
          self.vesting_schedules.get(&account_id).unwrap().len(),
          0,
          "{}",
          ERR_203
        );
      } else {
        self.vesting_schedules.get(&account_id).unwrap().clear();
        self.ft_functionality.internal_transfer(
          &account_id,
          &self.contract_config.get().unwrap().owner_id,
          self
            .ft_functionality
            .internal_unwrap_balance_of(&account_id),
          Some("force unregister: send user tokens to owner".to_string()),
        )
      }

      assert!(self
        .ft_functionality
        .internal_storage_unregister(None)
        .is_some());
      self.vesting_schedules.remove(&account_id);
      self.users.remove(&account_id);
      // ft_functionality already does a deposit worth
      // self.ft_functionality.storage_balance_bounds().min.0 + 1,
      // so we reduce it from the promise
      Promise::new(account_id.clone()).transfer(
        account_deposit.storage_deposit.0
          - self.ft_functionality.storage_balance_bounds().min.0
          - 1,
      );
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
    match self.internal_get_account(&account_id) {
      Some(account) => Some(StorageBalance {
        total: account.storage_deposit,
        available: U128(account.storage_funds_available()),
      }),
      None => None,
    }
  }
}
