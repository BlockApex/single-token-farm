use near_sdk::ext_contract;
use near_sdk::json_types::U128;

#[ext_contract(token_contract)]
trait FungibleToken {
  fn ft_transfer(receiver_id: String, amount: U128, memo: String);
}

#[ext_contract(ext_self)]
trait LogInfo {
  fn undo_transfer(value_to_return: U128, investment_id: String, required_by: String);
}
