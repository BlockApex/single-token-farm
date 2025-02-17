use std::collections::HashMap;

use borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::AccountId;
use serde::Serialize;

use crate::types::{FungibleTokenBalance, NonFungibleTokenID};

#[derive(Serialize, BorshSerialize, BorshDeserialize)]
pub struct StakedNFT {
  pub token_id: NonFungibleTokenID,
  pub owner_id: AccountId,
  pub staked_timestamp: u64,
  pub balance: FungibleTokenBalance,
}

impl StakedNFT {
  pub fn new(token_id: NonFungibleTokenID, owner_id: AccountId, staked_timestamp: u64) -> Self {
    let balance = HashMap::new();

    StakedNFT {
      token_id,
      owner_id,
      staked_timestamp,
      balance,
    }
  }

  pub fn update_balance(&mut self, rewards: FungibleTokenBalance) {
    self.balance = rewards
      .iter()
      .map(|(k, v)| (k.clone(), v + self.balance.get(k).unwrap_or(&0)))
      .collect();
  }

  pub fn withdraw(&mut self) -> FungibleTokenBalance {
    let withdrawn_balance = self.balance.clone();

    for (_, v) in self.balance.iter_mut() {
      *v = 0;
    }

    withdrawn_balance
  }
}

#[cfg(test)]
mod tests {
  use std::str::FromStr;

  use near_sdk::AccountId;
  use rstest::{fixture, rstest};

  use crate::types::{FungibleTokenID, NFTCollection};

  use super::*;

  #[fixture]
  pub fn contract_token() -> FungibleTokenID {
    AccountId::from_str("contract_token.near").unwrap()
  }

  #[fixture]
  pub fn program_token() -> FungibleTokenID {
    AccountId::from_str("program_token.near").unwrap()
  }

  #[fixture]
  fn collection() -> NFTCollection {
    NFTCollection::NFTContract {
      account_id: AccountId::from_str("collection.near").unwrap(),
    }
  }

  #[fixture]
  fn staker() -> AccountId {
    AccountId::from_str("staker.near").unwrap()
  }

  #[fixture]
  fn staked_nft(
    collection: NFTCollection,
    staker: AccountId,
    contract_token: FungibleTokenID,
    program_token: FungibleTokenID,
  ) -> StakedNFT {
    let id = (collection, "#1".to_string());
    let mut staked_nft = StakedNFT::new(id, staker, 5 * 10u64.pow(3));

    staked_nft.balance.insert(contract_token, 10);
    staked_nft.balance.insert(program_token, 5);

    staked_nft
  }

  #[rstest]
  fn test_withdraw(mut staked_nft: StakedNFT) {
    let initial_balance = staked_nft.balance.clone();

    let withdrawn_balance = staked_nft.withdraw();

    let final_balance = staked_nft.balance;

    assert_eq!(withdrawn_balance, initial_balance);

    for &v in final_balance.values() {
      assert_eq!(v, 0);
    }
  }
}
