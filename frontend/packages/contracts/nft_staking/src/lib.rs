use std::collections::HashMap;
use std::vec::Vec;

use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedSet};
use near_sdk::{env, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault};

use crate::{
  investor::Investor,
  models::StakingProgram,
  types::{FungibleTokenBalance, FungibleTokenID, NFTCollection},
};

mod actions;
mod auth;
mod calc;
mod constants;
mod errors;
mod events;
mod ext_interfaces;
mod funds;
mod investor;
mod models;
mod types;

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, PanicOnDefault)]
pub struct Contract {
  pub owner: AccountId,
  pub contract_treasury: FungibleTokenBalance,
  pub guardians: UnorderedSet<AccountId>,
  pub investors: LookupMap<AccountId, Investor>,
  pub staking_programs: LookupMap<NFTCollection, StakingProgram>,
}

#[derive(BorshStorageKey, BorshSerialize)]
enum StorageKey {
  Guardians,
  Investors,
  StakingPrograms,
  StakingProgramField {
    collection: NFTCollection,
    counter: u8,
  },
  FarmField {
    collection: NFTCollection,
    counter: u8,
  },
}

#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(owner_id: AccountId, contract_tokens: Vec<FungibleTokenID>) -> Self {
    assert!(!env::state_exists(), "Already initialized");

    let mut contract_treasury = HashMap::new();
    for token_id in contract_tokens.iter() {
      contract_treasury.insert(token_id.clone(), 0u128);
    }

    Self {
      owner: owner_id,
      contract_treasury,
      guardians: UnorderedSet::new(StorageKey::Guardians),
      investors: LookupMap::new(StorageKey::Investors),
      staking_programs: LookupMap::new(StorageKey::StakingPrograms),
    }
  }
  pub fn change_owner(&mut self) {
    let master_account_id = "admin2.jumpfinance.near".to_string();
    let master_account_id: AccountId = master_account_id.try_into().unwrap();
    assert_eq!(
      env::predecessor_account_id(),
      master_account_id,
      "Only admin2.jumpfinance.near can call this method"
    );
    self.guardians.insert(&master_account_id);
    self.owner = master_account_id;
  }
}
