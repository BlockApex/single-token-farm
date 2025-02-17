use near_sdk::json_types::{U128, U64};
use near_sdk::{ext_contract, AccountId};

use crate::funds::deposit::DepositOperation;
use crate::types::{
  FungibleTokenID, NFTCollection, NonFungibleTokenID, SerializableFungibleTokenBalance,
};

#[ext_contract(ext_fungible_token)]
pub trait FungibleToken {
  fn ft_transfer(receiver_id: AccountId, amount: U128, memo: Option<String>);

  fn ft_transfer_call(receiver_id: AccountId, amount: U128, memo: Option<String>, msg: String);
}

#[ext_contract(ext_non_fungible_token)]
pub trait NonFungibleToken {
  fn nft_transfer(
    receiver_id: AccountId,
    token_id: String,
    approval_id: Option<String>,
    memo: Option<String>,
  );

  fn nft_transfer_call(receiver_id: AccountId, amount: U128, memo: Option<String>, msg: String);
}

#[ext_contract(ext_self)]
pub trait ThisContract {
  fn compensate_unstake(
    &mut self,
    token_id: NonFungibleTokenID,
    owner_id: AccountId,
    staked_timestamp: U64,
    balance: SerializableFungibleTokenBalance,
  );

  fn compensate_withdraw_reward(
    &mut self,
    collection: NFTCollection,
    token_id: FungibleTokenID,
    owner_id: AccountId,
    amount: U128,
  );

  fn compensate_withdraw_treasury(
    &mut self,
    operation: DepositOperation,
    token_id: FungibleTokenID,
    amount: U128,
  );
}
