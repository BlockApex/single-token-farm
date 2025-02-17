use crate::*;

// Implement custom methods
#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  #[private]
  pub fn callback_base_token_transfer(
    &mut self,
    quantity_burnt: U128,
    recipient: AccountId,
    normal_tokens_released: U128,
  ) {
    assert_eq!(env::promise_results_count(), 1, "ERR_TOO_MANY_RESULTS");
    match env::promise_result(0) {
      PromiseResult::NotReady => unreachable!(),
      PromiseResult::Successful(_val) => {}
      PromiseResult::Failed => {
        self.internal_revert_burn_x_token(quantity_burnt.0, recipient, normal_tokens_released.0);
      }
    }
  }
}
