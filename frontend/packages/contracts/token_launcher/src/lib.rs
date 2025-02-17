use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap};
use near_sdk::json_types::{Base58CryptoHash, U128};
use near_sdk::{near_bindgen, BorshStorageKey, env, sys, AccountId, CryptoHash, PanicOnDefault};

use binaries::Binary;
use crate::errors::{ERR_001, ERR_003, ERR_004, ERR_005, ERR_006, ERR_007};
use crate::events::{event_new_contract_registered, event_contract_removed}; //, ERR_002};

pub mod actions;
pub mod binaries;
pub mod errors;
pub mod events;

/// The 0.25 NEAR tokens required for the registration of a new contract
const MIN_ATTACHED_STORAGE: u128 = 250_000_000_000_000_000_000_000;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
  pub owner: AccountId,
  /// Map of all the contracts available for deployment - Key: contract_name
  pub binaries: LookupMap<String, Binary>,
  /// Cost of storage for deployment of each contract
  pub storage_cost: LookupMap<Base58CryptoHash, U128>,
  ///AccountID where contract was deployed and the name of the contract
  pub deployed_contracts: LookupMap<AccountId, String>,
  // Balance received from the deployment fees
  pub treasury: U128,
}

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
  Binaries,
  DeployedContracts,
  CostPerHash,
}

#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(owner: AccountId) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    assert!(
      env::is_valid_account_id(owner.as_bytes()),
      "Invalid owner account"
    );

    Self {
      owner,
      binaries: LookupMap::new(StorageKey::Binaries),
      storage_cost: LookupMap::new(StorageKey::CostPerHash),
      deployed_contracts: LookupMap::new(StorageKey::DeployedContracts),
      treasury: U128(0),
    }
  }
}

//utils
impl Contract {
  pub fn only_owner(&self) {
    assert_eq!(env::predecessor_account_id(), self.owner, "{}", ERR_001);
  }
}

#[near_bindgen]
impl Contract {
  /// Register the memorry hash of as wasm that was saved on chain
  /// to the factory 'binaries' struct - this allows to access the contract more easily
  /// this function is restricted to the owner
  #[payable]
  pub fn register_contract(
    &mut self,
    contract_name: String,
    contract_hash: Base58CryptoHash,
    contract_cost: U128,
    init_cost: U128,
    init_fn_name: String,
    init_fn_params: String,
  ) {
    self.only_owner();

    //verify that there is not a contract registered with this name
    assert!(
      !self.binaries.contains_key(&contract_name.clone()),
      "{}",
      ERR_003
    );

    //verify that there is enough storage to register the contract
    assert!(
      env::attached_deposit() >= MIN_ATTACHED_STORAGE,
      "{}",
      ERR_004
    );

    //verify if there is a contract saved with this hash
    //when a contract is saved, it's hash is automatically saved on 'storage_cost' LUP MAP
    //therefore, it's there, we can proceed
    assert!(
      self.storage_cost.contains_key(&contract_hash.clone()),
      "{}",
      ERR_005
    );

    let new_binary = Binary::new(
      contract_name.clone(),
      contract_hash.into(),
      contract_cost,
      init_cost,
      init_fn_name,
      init_fn_params,
    );

    self.binaries.insert(&contract_name, &new_binary);
    event_new_contract_registered(contract_name.as_str(), contract_hash);
  }

  /// Function to unregister a contract - also restricted to the owner
  /// It removes the contract from the binary map and also removes it's
  /// wasm file from contract 'memory'
  pub fn unregister_contract(&mut self, contract_name: String) {
    self.only_owner();

    //verify that there IS a contract registered with this name
    assert!(
      self.binaries.contains_key(&contract_name.clone()),
      "{}",
      ERR_006
    );

    let contract_hash = self
      .binaries
      .get(&contract_name.clone())
      .expect(ERR_007)
      .contract_hash;

    //remove contract from the binaries struct
    self.binaries.remove(&contract_name);
    //remove the contract from the struct that contains its cost
    self.storage_cost.remove(&contract_hash.into());
    //remove the binary from memory
    env::storage_remove(&contract_hash);

    event_contract_removed(contract_name.as_str(), contract_hash.into());
  }
}

#[cfg(test)]
mod tests {
  use std::convert::TryInto;
  use std::str::FromStr;

  use near_sdk::{testing_env, VMContext, Gas};

  use super::*;

  pub const CONTRACT_ACCOUNT: &str = "contract.testnet";
  pub const OWNER_ACCOUNT: &str = "owner.testnet";

  pub fn get_context(
    input: Vec<u8>,
    attached_deposit: u128,
    account_balance: u128,
    signer_id: AccountId,
    block_timestamp: u64,
    prepaid_gas: Gas,
  ) -> VMContext {
    VMContext {
      current_account_id: CONTRACT_ACCOUNT.parse().unwrap(),
      signer_account_id: signer_id.clone(),
      signer_account_pk: vec![0; 33].try_into().unwrap(),
      predecessor_account_id: signer_id.clone(),
      input,
      block_index: 0,
      block_timestamp,
      account_balance,
      account_locked_balance: 0,
      storage_usage: 0,
      attached_deposit,
      prepaid_gas,
      random_seed: [0; 32],
      view_config: None,
      output_data_receivers: vec![],
      epoch_height: 19,
    }
  }

  pub fn init_contract() -> Contract {
    Contract {
      owner: OWNER_ACCOUNT.parse().unwrap(),
      binaries: LookupMap::new(b"a".to_vec()),
      storage_cost: LookupMap::new(b"m".to_vec()),
      deployed_contracts: LookupMap::new(b"c".to_vec()),
      treasury: U128(0),
    }
  }

  #[test]
  /// Test the initialization of the contract
  /// Guarantee that the owner was set
  fn test_new() {
    let context = get_context(
      vec![],
      10,
      100,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(10u64.pow(18)),
    );

    testing_env!(context);
    let contract = Contract::new(OWNER_ACCOUNT.parse().unwrap());
    assert_eq!(contract.owner, OWNER_ACCOUNT.parse().unwrap());
  }

  /// Standard initialization test panic
  #[test]
  #[should_panic(expected = "The contract is not initialized")]
  fn test_new_fn_panic() {
    let context = get_context(
      vec![],
      10,
      100,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(10u64.pow(18)),
    );
    testing_env!(context);
    let _contract = Contract::default();
  }

  /// Test registration of a contract (to be deployed)
  /// that was already registred
  /// Should panic and not allow for user to register it
  #[test]
  #[should_panic(
    expected = "Contract: register_contract: A contract with this name is already saved to the memory"
  )]
  fn test_register_contract_of_already_registerd_contract() {
    let contract_hash_58: Base58CryptoHash =
      Base58CryptoHash::from_str("GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH").unwrap();

    let context = get_context(
      vec![],
      MIN_ATTACHED_STORAGE,
      MIN_ATTACHED_STORAGE * 4,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(10u64.pow(18)),
    );
    testing_env!(context);

    let mut contract: Contract = init_contract();

    let new_binary = Binary::new(
      "token".to_string(),
      CryptoHash::from(contract_hash_58),
      U128(10),
      U128(10),
      "new".to_string(),
      "params".to_string(),
    );
    contract.binaries.insert(&"token".to_string(), &new_binary);

    contract.register_contract(
      "token".to_string(),
      contract_hash_58,
      U128(10),
      U128(10),
      "new".to_string(),
      "params".to_string(),
    )

    //GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH
  }

  /// Test registration of a contract (to be deployed)
  /// that was already registred
  /// Should panic and not allow for user to register it
  #[test]
  #[should_panic(
    expected = "Contract: register_contract: To register a contract you must attach 0,25 N as storage"
  )]
  fn test_register_contract_of_contract_without_paying_for_storage() {
    let contract_hash_58: Base58CryptoHash =
      Base58CryptoHash::from_str("GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH").unwrap();

    let context = get_context(
      vec![],
      10,
      100,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(10u64.pow(18)),
    );
    testing_env!(context);

    let mut contract: Contract = init_contract();

    contract.register_contract(
      "token".to_string(),
      contract_hash_58,
      U128(10),
      U128(10),
      "new".to_string(),
      "params".to_string(),
    );
  }

  /// Test registration of a contract (to be deployed)
  /// The contract hash should be saved to the 'binaries' array
  /// assert that a certain hash "GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH"
  /// was registred to the binaries map
  #[test]
  fn test_register_contract() {
    let contract_hash_58: Base58CryptoHash =
      Base58CryptoHash::from_str("GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH").unwrap();

    let context = get_context(
      vec![],
      MIN_ATTACHED_STORAGE * 2,
      MIN_ATTACHED_STORAGE * 4,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(10u64.pow(18)),
    );
    testing_env!(context);

    let mut contract: Contract = init_contract();

    // first, we need to register the storage cost of the contract
    // this is done in the 'store' function, but this action cannot be performed on
    // unit tets
    contract.storage_cost.insert(&contract_hash_58, &U128(10));

    contract.register_contract(
      "token".to_string(),
      contract_hash_58,
      U128(10),
      U128(10),
      "new".to_string(),
      "params".to_string(),
    );

    assert!(contract.binaries.contains_key(&"token".to_string()));
    let binary: Binary = contract
      .binaries
      .get(&"token".to_string())
      .expect("failed ");
    assert_eq!(binary.contract_name, "token".to_string());
    assert_eq!(binary.contract_hash, CryptoHash::from(contract_hash_58));

    //GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH
  }

  /// Test registration of a contract (to be deployed) and unregistration
  /// The contract hash should be saved to the 'binaries' array
  /// assert that a certain hash "GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH"
  /// was registred to the binaries map
  /// Then assert that it was unregistered from binaries and from storage_cost
  #[test]
  fn test_register_and_unregister_contract() {
    let contract_hash_58: Base58CryptoHash =
      Base58CryptoHash::from_str("GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH").unwrap();

    let context = get_context(
      vec![],
      MIN_ATTACHED_STORAGE * 2,
      MIN_ATTACHED_STORAGE * 4,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(10u64.pow(18)),
    );
    testing_env!(context);

    let mut contract: Contract = init_contract();

    // first, we need to register the storage cost of the contract
    // this is done in the 'store' function, but this action cannot be performed on
    // unit tets
    contract.storage_cost.insert(&contract_hash_58, &U128(10));

    contract.register_contract(
      "token".to_string(),
      contract_hash_58,
      U128(10),
      U128(10),
      "new".to_string(),
      "params".to_string(),
    );

    //assert contract registration
    assert!(contract.binaries.contains_key(&"token".to_string()));
    let binary: Binary = contract
      .binaries
      .get(&"token".to_string())
      .expect("failed ");
    assert_eq!(binary.contract_name, "token".to_string());
    assert_eq!(binary.contract_hash, CryptoHash::from(contract_hash_58));

    //unregister
    contract.unregister_contract("token".to_string());

    //assert that it was unregistered correctly
    assert!(!contract.binaries.contains_key(&"token".to_string()));
    assert!(!contract.storage_cost.contains_key(&contract_hash_58));

    //GuP7VRr9w1tJoRRBUJaD8jWF7Xe4Em5oZULRoXowBLQH
  }
}
