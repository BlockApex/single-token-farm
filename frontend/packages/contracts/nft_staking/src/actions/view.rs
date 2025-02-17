use std::collections::HashMap;

use near_sdk::{json_types::U128, near_bindgen, AccountId};

use crate::{
  types::{
    FungibleTokenBalance, NFTCollection, NonFungibleTokenID, SerializableFungibleTokenBalance,
    SerializableStakedNFT, SerializableStakingProgram,
  },
  Contract, ContractExt,
};

#[near_bindgen]
impl Contract {
  pub fn view_staking_program(
    &self,
    collection: NFTCollection,
  ) -> Option<SerializableStakingProgram> {
    self.staking_programs.get(&collection).map(From::from)
  }

  pub fn view_staked_nft_balance(
    &self,
    nft_id: NonFungibleTokenID,
  ) -> SerializableFungibleTokenBalance {
    let collection = &nft_id.0;
    let mut staking_program = self.staking_programs.get(collection).unwrap();

    let staked_nft = staking_program.view_unclaimed_rewards(&nft_id);

    staked_nft.balance.into()
  }

  pub fn view_guardians(&self, from_index: Option<u16>, limit: Option<u16>) -> Vec<String> {
    let from_index: usize = from_index.map(From::from).unwrap_or(0);
    let limit: usize = limit.map(From::from).unwrap_or(usize::MAX);

    self
      .guardians
      .iter()
      .skip(from_index)
      .take(limit)
      .map(From::from)
      .collect()
  }

  pub fn view_total_staked_amount_for_collection(&self, collection: NFTCollection) -> U128 {
    let staking_program = self.staking_programs.get(&collection).unwrap();
    U128(staking_program.staked_nfts.len() as u128)
  }
  pub fn view_staked(
    &self,
    collection: NFTCollection,
    account_id: Option<AccountId>,
    from_index: Option<u64>,
    limit: Option<u16>,
  ) -> Vec<String> {
    let staking_program = self.staking_programs.get(&collection).unwrap();
    let from_index: u64 = from_index.map(From::from).unwrap_or(0);
    let limit: usize = limit.map(From::from).unwrap_or(usize::MAX);

    match account_id {
      None => staking_program
        .staked_nfts
        .keys()
        .skip(from_index as usize)
        .take(limit)
        .map(|(_, id)| id)
        .collect(),
      Some(owner_id) => match staking_program.nfts_by_owner.get(&owner_id) {
        Some(nfts) => nfts
          .iter()
          .skip(from_index as usize)
          .take(limit)
          .map(|id| id.clone())
          .collect(),
        None => vec![],
      },
    }
  }

  pub fn view_staked_nft(&self, nft_id: NonFungibleTokenID) -> Option<SerializableStakedNFT> {
    let collection = &nft_id.0;

    self
      .staking_programs
      .get(collection)
      .and_then(|staking_program| staking_program.staked_nfts.get(&nft_id))
      .map(|nft| nft.into())
  }

  pub fn view_inner_balance(
    &self,
    collection: NFTCollection,
    account_id: AccountId,
  ) -> SerializableFungibleTokenBalance {
    let staking_program = self.staking_programs.get(&collection).unwrap();

    let balance = staking_program.stakers_balances.get(&account_id).unwrap();

    balance.into()
  }

  pub fn view_contract_treasury_balance(&self) -> HashMap<AccountId, U128> {
    let mut result = HashMap::new();
    for (key, value) in self.contract_treasury.iter() {
      result.insert(key.clone(), U128(*value));
    }
    result
  }
}
