use crate::*;
use near_sdk::{assert_one_yocto};

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn ft_mint(&mut self, quantity_to_mint: U128, recipient: AccountId) {
    assert_one_yocto();
    self.only_owner();
    assert!(
      env::is_valid_account_id(recipient.as_bytes()),
      "Invalid recipient account"
    );
    self.token.internal_deposit(&recipient, quantity_to_mint.0);
    self.on_tokens_minted(recipient, quantity_to_mint.0);
  }
}

//Tests
// Must Panic:
// - If no yocto is asserted
// - if is not owner
// Should work
// - Assert that 5 minted tokens by the owner are minted to a given user

#[cfg(all(test, not(target_arch = "wasm32")))]

mod tests {
  //imports
  use crate::tests::*;
  use crate::*;

  use near_sdk::MockedBlockchain;
  use near_sdk::{testing_env};

  use std::convert::TryFrom;

  #[test]
  fn test_mint() {
    let context = get_context(vec![], false, 1, 0, OWNER_ACCOUNT.to_string());
    testing_env!(context);

    let mut contract = init_contract();

    let initial_balance = 5;

    //registring owner
    contract
      .token
      .internal_register_account(&SIGNER_ACCOUNT.to_string());
    contract
      .token
      .internal_register_account(&OWNER_ACCOUNT.to_string());
    contract
      .token
      .internal_deposit(&SIGNER_ACCOUNT.to_string(), initial_balance);
    let total_supply = contract.token.total_supply;

    let mint_amount = 10;

    contract.ft_mint(U128(mint_amount), SIGNER_ACCOUNT.clone().to_string());

    assert_eq!(
      contract
        .ft_balance_of(ValidAccountId::try_from(SIGNER_ACCOUNT).unwrap())
        .0,
      (initial_balance + mint_amount)
    );

    assert_eq!(contract.token.total_supply, total_supply + mint_amount);
  }

  #[test]
  #[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
  fn test_burn_no_yocto() {
    let context = get_context(vec![], false, 0, 0, OWNER_ACCOUNT.to_string());
    testing_env!(context);

    let mut contract = init_contract();

    let mint_amount = 5;

    contract.ft_mint(U128(mint_amount), SIGNER_ACCOUNT.clone().to_string());
  }

  #[test]
  #[should_panic(
    expected = "lib: only_owner: this function is restricted to the owner of the contract"
  )]
  fn test_burn_not_owner() {
    let context = get_context(vec![], false, 1, 0, SIGNER_ACCOUNT.to_string());
    testing_env!(context);

    let mut contract = init_contract();

    let mint_amount = 5;

    contract.ft_mint(U128(mint_amount), SIGNER_ACCOUNT.clone().to_string());
  }
}
