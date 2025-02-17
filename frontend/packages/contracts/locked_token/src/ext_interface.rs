use near_sdk::{ext_contract, AccountId, Promise};
use near_sdk::json_types::{U128, U64};

#[ext_contract(ext_token_contract)]
trait FungibleToken {
  fn ft_transfer(receiver_id: String, amount: U128, memo: String);

  fn ft_transfer_call(
    receiver_id: String,
    amount: U128,
    memo: Option<String>,
    msg: String,
  ) -> Promise;
}

#[ext_contract(ext_self)]
trait SelfTraits {
  fn callback_base_token_transfer(recipient: AccountId, quantity_withdrawn: U128, vesting_id: U64);

  fn callback_send_to_xtoken(quantity: U128);
}
