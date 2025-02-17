use std::collections::HashMap;

use near_sdk::{
  borsh::{BorshDeserialize, BorshSerialize},
  serde::{Deserialize, Serialize},
  AccountId,
};

use super::u256::U256;

pub type FungibleTokenID = AccountId;

pub type FungibleTokenBalance = HashMap<FungibleTokenID, u128>;

pub type TokenRPS = HashMap<FungibleTokenID, U256>;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
#[serde(tag = "type")]
pub enum NFTCollection {
  NFTContract { account_id: AccountId },
}

pub type NonFungibleTokenID = (NFTCollection, String);
