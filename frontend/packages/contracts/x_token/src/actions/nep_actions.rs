use crate::*;
// Implement ft methods for xJump
near_contract_standards::impl_fungible_token_core!(Contract, ft_functionality, on_tokens_burned);
near_contract_standards::impl_fungible_token_storage!(
  Contract,
  ft_functionality,
  on_account_closed
);

#[near_bindgen]
impl FungibleTokenMetadataProvider for Contract {
  fn ft_metadata(&self) -> FungibleTokenMetadata {
    self.x_token_metadata.get().unwrap()
  }
}
