use near_sdk::{AccountId, Promise, Gas};
use near_sdk::json_types::{U128};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Serialize, Deserialize};

use crate::ext_interface::{ext_fungible_token};

pub const GAS_FOR_FT_TRANSFER: Gas = Gas(20_000_000_000_000);
pub const GAS_FOR_FT_TRANSFER_CALL: Gas = Gas(200_000_000_000_000);
pub const GAS_FOR_FT_TRANSFER_CALLBACK: Gas = Gas(50_000_000_000_000);

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, PartialEq, Debug)]
#[serde(crate = "near_sdk::serde")]
#[cfg_attr(test, derive(Clone))]
pub enum TokenType {
  FT { account_id: AccountId },
}

#[allow(unreachable_patterns)]
impl TokenType {
  pub fn transfer_token(&self, receiver_id: AccountId, quantity: u128) -> Promise {
    match self {
      TokenType::FT { account_id } => ext_fungible_token::ext(account_id.clone())
        .with_static_gas(GAS_FOR_FT_TRANSFER)
        .with_attached_deposit(1)
        .ft_transfer(receiver_id, U128(quantity), None),
      _ => unimplemented!(),
    }
  }

  pub fn transfer_token_call(
    &self,
    receiver_id: AccountId,
    quantity: u128,
    msg: String,
  ) -> Promise {
    match self {
      TokenType::FT { account_id } => ext_fungible_token::ext(account_id.clone())
        .with_static_gas(GAS_FOR_FT_TRANSFER_CALL)
        .with_attached_deposit(1)
        .ft_transfer_call(receiver_id, U128(quantity), None, msg),
      _ => unimplemented!(),
    }
  }

  pub fn ft_get_account_id(&self) -> AccountId {
    match self {
      TokenType::FT { account_id } => account_id.clone(),
      _ => unimplemented!(),
    }
  }
}
