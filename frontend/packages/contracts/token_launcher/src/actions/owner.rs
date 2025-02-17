use near_sdk::{assert_one_yocto, Promise};

use crate::{
  *,
  errors::{ERR_201, ERR_202, ERR_203, ERR_204, ERR_205},
  events::event_treasury_withdrawal,
};

#[near_bindgen]
impl Contract {
  /// Returns code at the given hash.
  pub fn get_code(&self, code_hash: Base58CryptoHash) {
    //validate that the owner is calling the function
    assert_eq!(env::predecessor_account_id(), self.owner, "{}", ERR_202);

    let code_hash: CryptoHash = code_hash.into();
    unsafe {
      // Check that such contract exists.
      assert_eq!(
        sys::storage_has_key(code_hash.len() as _, code_hash.as_ptr() as _),
        1,
        "{}",
        ERR_201
      );
      // Load the hash from storage.
      sys::storage_read(code_hash.len() as _, code_hash.as_ptr() as _, 0);
      // Return as value.
      sys::value_return(u64::MAX as _, 0 as _);
    }
  }

  /// Returns code at the given hash.
  pub fn get_code_with_name(&self, contract_name: String) {
    //validate that the owner is calling the function
    assert_eq!(env::predecessor_account_id(), self.owner, "{}", ERR_202);

    let code_hash: Base58CryptoHash = self
      .binaries
      .get(&contract_name)
      .expect(ERR_203)
      .contract_hash
      .into();

    let code_hash: CryptoHash = code_hash.into();
    unsafe {
      // Check that such contract exists.
      assert_eq!(
        sys::storage_has_key(code_hash.len() as _, code_hash.as_ptr() as _),
        1,
        "{}",
        ERR_204
      );
      // Load the hash from storage.
      sys::storage_read(code_hash.len() as _, code_hash.as_ptr() as _, 0);
      // Return as value.
      sys::value_return(u64::MAX as _, 0 as _);
    }
  }

  /// Allows for the owner of the contract to withdrawal
  /// the fees that were collected for the deployments
  #[payable]
  pub fn withdraw_treasury(&mut self, amount: U128) {
    self.only_owner();
    assert_one_yocto();

    assert!(
      self.treasury >= amount,
      "{}{}{}",
      ERR_205,
      self.treasury.0,
      " N"
    );

    //decrease the contract treasury
    self.treasury = U128(self.treasury.0 - amount.0);

    //transfer funds to owner
    Promise::new(self.owner.clone()).transfer(amount.0);
    event_treasury_withdrawal(amount, self.treasury);
  }
}

#[cfg(test)]
mod tests {

  use near_sdk::{testing_env, Gas, test_utils::get_created_receipts, mock::VmAction};

  use crate::{tests::*};

  use super::*;

  pub const WITHDRAW: u128 = 5;
  pub const TREASURY: u128 = 10;
  pub const BALANCE: u128 = 100;

  /// Test the deployment of a contract that is already
  /// listed on the map of deployed contracts
  /// This function should panic
  #[test]
  fn test_owner_withdraw() {
    let context = get_context(
      vec![],
      1,
      BALANCE,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(10u64.pow(18)),
    );
    testing_env!(context);

    let mut contract: Contract = init_contract();
    contract.treasury = U128(TREASURY);

    contract.withdraw_treasury(U128(WITHDRAW));

    //verify if treasury was deducted
    assert_eq!(contract.treasury.0, TREASURY - WITHDRAW);

    //Verify the transfer
    let receipts = get_created_receipts();
    assert_eq!(receipts.len(), 1);

    assert_eq!(receipts[0].actions.len(), 1);
    match receipts[0].actions[0].clone() {
      VmAction::Transfer { deposit } => {
        assert_eq!(deposit, WITHDRAW);
      }
      _ => panic!(),
    }
  }
}
