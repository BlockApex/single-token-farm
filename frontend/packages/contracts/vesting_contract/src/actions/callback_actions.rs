use crate::events::event_withdraw_vested_funds;
use crate::*;

use near_sdk::{env, near_bindgen, PromiseResult};

#[near_bindgen]
impl Contract {
  #[private]
  pub fn undo_transfer(
    &mut self,
    value_to_return: U128,
    investment_id: String,
    required_by: String,
  ) {
    assert_eq!(env::promise_results_count(), 1, "ERR_TOO_MANY_RESULTS");
    match env::promise_result(0) {
      PromiseResult::NotReady => unreachable!(),
      PromiseResult::Successful(_val) => {
        let splited_id = split_investment_id(investment_id);
        event_withdraw_vested_funds(
          splited_id[0].as_str(),
          splited_id[1].as_str(),
          value_to_return.0.to_string().as_str(),
          required_by.as_str(),
        );
      }
      PromiseResult::Failed => self.undo_withdraw_investment(investment_id, value_to_return.0),
    }
  }
}
