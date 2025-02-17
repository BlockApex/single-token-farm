use crate::*;

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn add_minter(&mut self, new_minter: AccountId) {
    self.only_owner(&env::predecessor_account_id());
    self.minters.insert(&new_minter);
  }

  #[payable]
  pub fn remove_minter(&mut self, remove_minter: AccountId) {
    self.only_owner(&env::predecessor_account_id());
    self.minters.remove(&remove_minter);
  }

  #[payable]
  pub fn alter_config(&mut self, new_config: ContractConfig) {
    self.only_owner(&env::predecessor_account_id());
    self.contract_config.set(&new_config);
  }

  #[payable]
  pub fn send_pending_tokens_to_xtoken(&mut self) -> Promise {
    let tokens = self.fast_pass_receivals.0;
    self.fast_pass_receivals = U128(0);

    self.internal_transfer_call_x_token(tokens)
  }
}
