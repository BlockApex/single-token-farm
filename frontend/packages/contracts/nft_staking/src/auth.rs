use near_sdk::AccountId;

use crate::{models::StakingProgram, types::FungibleTokenID, Contract};

impl Contract {
  #[inline]
  pub fn only_owner(&self, account_id: &AccountId) {
    assert_eq!(
      account_id, &self.owner,
      "Only the contract owner may call this function"
    )
  }

  #[inline]
  pub fn only_guardians(&self, account_id: &AccountId) {
    assert!(
      self.guardians.contains(&account_id),
      "Only guardians may call this function"
    );
  }

  #[inline]
  pub fn is_contract_token(&self, token_id: &FungibleTokenID) -> bool {
    self.contract_treasury.contains_key(token_id)
  }

  #[inline]
  pub fn only_contract_tokens(&self, token_id: &FungibleTokenID) {
    assert!(
      self.is_contract_token(token_id),
      "Guardians may only operate on contract tokens"
    )
  }

  #[inline]
  pub fn only_non_contract_tokens(&self, token_id: &FungibleTokenID) {
    assert!(
      !self.is_contract_token(token_id),
      "Staking program token cannot be a contract token"
    );
  }

  pub fn assert_authorized_operator(
    &self,
    operator: &AccountId,
    staking_program: &StakingProgram,
    token_id: &FungibleTokenID,
  ) {
    if staking_program.is_program_token(token_id) {
      staking_program.only_collection_owner(operator);
    } else if self.is_contract_token(token_id) {
      self.only_owner(operator);
    } else {
      panic!("Token does not belong to staking program");
    }
  }
}

impl StakingProgram {
  #[inline]
  pub fn is_program_token(&self, token_id: &FungibleTokenID) -> bool {
    token_id == &self.token_address
  }

  #[inline]
  pub fn only_collection_owner(&self, account_id: &AccountId) {
    assert_eq!(
      account_id, &self.collection_owner,
      "Only collection owner may call this function",
    );
  }

  #[inline]
  pub fn only_program_token(&self, token_id: &FungibleTokenID) {
    assert!(
      self.is_program_token(token_id),
      "Collection owner may only operate on program token"
    );
  }

  #[inline]
  pub fn only_non_program_tokens(&self, token_id: &FungibleTokenID) {
    assert!(
      !self.is_program_token(token_id),
      "Cannot operate on staking program tokens."
    );
  }
}
