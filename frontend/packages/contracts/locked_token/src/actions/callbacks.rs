use crate::*;
use near_sdk::utils::{is_promise_success};

#[near_bindgen]
impl Contract {
  #[private]
  pub fn callback_base_token_transfer(
    &mut self,
    recipient: AccountId,
    quantity_withdrawn: U128,
    vesting_id: U64,
  ) {
    if !is_promise_success() {
      let vesting_id = vesting_id.0;
      let quantity_withdrawn = quantity_withdrawn.0;
      let mut vesting_vector = self.vesting_schedules.get(&recipient).unwrap();
      let mut vesting = vesting_vector.get(vesting_id).unwrap();
      vesting.withdrawn_tokens = U128(vesting.withdrawn_tokens.0 - quantity_withdrawn);
      vesting_vector.replace(vesting_id, &vesting);
      self
        .ft_functionality
        .internal_deposit(&recipient, quantity_withdrawn);
    } else {
      FtBurn {
        owner_id: &recipient,
        amount: &quantity_withdrawn,
        memo: Some("Burnt to withdraw base tokens"),
      }
      .emit();
    }
  }

  #[private]
  pub fn callback_send_to_xtoken(&mut self, quantity: U128) {
    if !is_promise_success() {
      self.fast_pass_receivals = U128(self.fast_pass_receivals.0 + quantity.0)
    }
  }
}
