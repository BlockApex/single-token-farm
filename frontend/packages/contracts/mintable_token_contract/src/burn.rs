use crate::*;
use near_sdk::{assert_one_yocto, env};

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn ft_burn(&mut self, amount: U128, memo: Option<String>) {
    assert_one_yocto();
    self
      .token
      .internal_burn(&env::predecessor_account_id(), amount.0, memo.clone());
    self.on_tokens_burned(env::predecessor_account_id(), amount.0, memo)
  }
}

#[cfg(all(test, not(target_arch = "wasm32")))]

mod tests {
  //imports
  use crate::tests::*;
  use crate::*;

  use near_sdk::MockedBlockchain;
  use near_sdk::{testing_env};

  use std::convert::TryFrom;

  #[test]
  fn test_burn() {
    let context = get_context(vec![], false, 1, 0, SIGNER_ACCOUNT.to_string());
    testing_env!(context);

    let mut contract = init_contract();

    let initial_balance = 10;

    //registring owner
    contract
      .token
      .internal_register_account(&SIGNER_ACCOUNT.to_string());
    contract
      .token
      .internal_deposit(&SIGNER_ACCOUNT.to_string(), initial_balance);

    let burn_amount = 5;

    contract.ft_burn(U128(burn_amount), None);

    assert_eq!(
      contract
        .ft_balance_of(ValidAccountId::try_from(SIGNER_ACCOUNT).unwrap())
        .0,
      (initial_balance - burn_amount)
    );
  }

  #[test]
  #[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
  fn test_burn_no_yocto() {
    let context = get_context(vec![], false, 0, 0, SIGNER_ACCOUNT.to_string());
    testing_env!(context);

    let mut contract = init_contract();

    let burn_amount = 5;

    contract.ft_burn(U128(burn_amount), None);
  }
}
