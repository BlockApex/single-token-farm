use std::collections::HashMap;

use near_sdk::{
  json_types::{U128, U64},
  serde::{Deserialize, Serialize},
  AccountId,
};

use crate::models::{Farm, RewardsDistribution, StakedNFT, StakingProgram};

use super::{
  tokens::{FungibleTokenBalance, FungibleTokenID, NFTCollection},
  NonFungibleTokenID,
};

#[derive(Serialize)]
pub struct SerializableStakingProgram {
  pub collection: NFTCollection,
  pub collection_owner: AccountId,
  pub collection_treasury: SerializableFungibleTokenBalance,
  pub token_address: AccountId,

  pub farm: SerializableFarm,
  pub min_staking_period: U64,
  pub early_withdraw_penalty: U128,
}

impl From<StakingProgram> for SerializableStakingProgram {
  fn from(staking_program: StakingProgram) -> Self {
    Self {
      collection: staking_program.collection,
      collection_owner: staking_program.collection_owner,
      early_withdraw_penalty: U128(staking_program.early_withdraw_penalty),
      min_staking_period: U64(staking_program.min_staking_period),
      token_address: staking_program.token_address,
      collection_treasury: staking_program.collection_treasury.into(),

      farm: staking_program.farm.into(),
    }
  }
}

#[derive(Serialize, Deserialize)]
pub struct SerializableFarm {
  pub round_interval: u64,
  pub start_at: u64,
  pub distributions: HashMap<FungibleTokenID, RewardsDistribution>,
}

impl From<Farm> for SerializableFarm {
  fn from(farm: Farm) -> Self {
    Self {
      round_interval: farm.round_interval,
      start_at: farm.start_at,
      distributions: farm.distributions,
    }
  }
}

#[derive(Serialize, Deserialize)]
pub struct SerializableFungibleTokenBalance(HashMap<FungibleTokenID, U128>);

impl From<FungibleTokenBalance> for SerializableFungibleTokenBalance {
  fn from(balance: FungibleTokenBalance) -> Self {
    let mut serializable_balance = HashMap::new();

    for (k, v) in balance.iter() {
      serializable_balance.insert(k.clone(), U128(*v));
    }

    SerializableFungibleTokenBalance(serializable_balance)
  }
}

#[derive(Serialize, Deserialize)]
pub struct SerializableStakedNFT {
  token_id: NonFungibleTokenID,
  owner_id: AccountId,
  staked_timestamp: u64,
  balance: SerializableFungibleTokenBalance,
}

impl From<StakedNFT> for SerializableStakedNFT {
  fn from(nft: StakedNFT) -> Self {
    Self {
      owner_id: nft.owner_id,
      staked_timestamp: nft.staked_timestamp,
      token_id: nft.token_id,
      balance: nft.balance.into(),
    }
  }
}
