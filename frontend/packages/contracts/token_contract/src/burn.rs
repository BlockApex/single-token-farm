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
