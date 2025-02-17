use near_sdk::{ext_contract, AccountId};
use near_sdk::json_types::U128;

#[ext_contract(ext_token_contract)]
trait FungibleToken {
  fn ft_transfer(receiver_id: String, amount: U128, memo: String);
}

#[ext_contract(ext_self)]
trait SelfTraits {
  fn callback_base_token_transfer(
    quantity_burnt: U128,
    recipient: AccountId,
    normal_tokens_released: U128,
  );
}
