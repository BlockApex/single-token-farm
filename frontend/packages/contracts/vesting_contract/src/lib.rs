use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap};
use near_sdk::json_types::{U128, U64};
use near_sdk::{env, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault};
use near_sdk::serde::{Serialize, Deserialize};

pub mod actions;
pub mod errors;
pub mod events;
pub mod ext_interface;
pub mod investment;
pub mod schema;
pub mod utils;

use crate::errors::{ERR_001, ERR_002, ERR_003, ERR_004, ERR_005, ERR_006, ERR_007};
use crate::utils::{create_investment_id, split_investment_id};
use crate::events::{event_create_investment, event_create_schema};

use investment::Investment;
use schema::{CurveType, Schema};

pub const FRACTION_BASE: u128 = 10_000;
pub const BASE_GAS: u64 = 50_000_000_000_000;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
  pub owner: AccountId,
  pub token_contract: AccountId,
  pub schemas: UnorderedMap<String, Schema>,
  pub investments: LookupMap<String, Investment>,
}

#[derive(BorshStorageKey, BorshSerialize)]
pub(crate) enum StorageKey {
  Schemas,
  Investments,
}

#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(owner: AccountId, token_contract: AccountId) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    assert!(
      env::is_valid_account_id(owner.as_bytes()),
      "Invalid owner account"
    );

    // declarando os atributos
    Self {
      owner,
      token_contract,
      schemas: UnorderedMap::new(StorageKey::Schemas), // inicializa o lupmap
      investments: LookupMap::new(StorageKey::Investments),
    }
  }
}

//utils
impl Contract {
  pub fn only_owner(&self) {
    assert_eq!(env::predecessor_account_id(), self.owner, "{}", ERR_001);
  }
}

// high level functions
impl Contract {
  pub fn new_schema(
    &mut self,
    category: String,
    total_quantity: u128,
    initial_release: u128, //releases should be a fraction
    cliff_release: u128,
    final_release: u128,
    initial_timestamp: u64,
    cliff_delta: u64,
    final_delta: u64,
    curve_type: CurveType,
  ) {
    if let Some(_value) = self.schemas.get(&category) {
      panic!("{}", ERR_002);
    }

    let schema = Schema::new(
      category.clone(),
      total_quantity,
      initial_release,
      cliff_release,
      final_release,
      initial_timestamp,
      cliff_delta,
      final_delta,
      curve_type,
    );

    self.schemas.insert(&category, &schema);
    event_create_schema(category.as_str(), total_quantity.to_string().as_str());
  }

  pub fn new_investment(
    &mut self,
    category: String,
    account: AccountId,
    total_value: U128,
    date_in: Option<U64>,
  ) {
    let investment_id = create_investment_id(category.clone(), account.clone());
    assert!(
      !self.investments.contains_key(&investment_id),
      "{}",
      ERR_003
    );

    let mut schema = self.schemas.get(&category).expect(ERR_005);
    schema.investments.push(investment_id.clone());
    let allocated_quantity = schema.allocated_quantity + total_value.0;
    assert!(allocated_quantity <= schema.total_quantity, "{}", ERR_004);
    let investment = Investment::new(account.clone(), total_value.0, date_in.map(|v| v.0));
    self.investments.insert(&investment_id, &investment);
    self.schemas.insert(&category, &schema);

    event_create_investment(
      category.as_str(),
      account.as_str(),
      total_value.0.to_string().as_str(),
      date_in.map(|v| v.0),
    );
  }

  pub fn calculate_available_withdraw(
    &self,
    curent_time_stamp: u64,
    investment_id: String,
  ) -> u128 {
    let schema_id = split_investment_id(investment_id.clone()).remove(0);

    let schema = self.schemas.get(&schema_id).expect(ERR_005);
    let investment = self.investments.get(&investment_id).expect(ERR_006);

    let initial_timestamp: u64;

    if let Some(time_stamp) = investment.date_in {
      initial_timestamp = time_stamp;
    } else {
      initial_timestamp = schema.initial_timestamp;
    }

    let release: u128;

    if curent_time_stamp >= (initial_timestamp + schema.cliff_delta + schema.final_delta) {
      release = FRACTION_BASE;
    } else if curent_time_stamp >= (initial_timestamp + schema.cliff_delta) {
      let elapsed_curve_time = curent_time_stamp - initial_timestamp - schema.cliff_delta;

      release = schema.initial_release
        + schema.curve_type.calculate_curve_return(
          schema.final_delta,
          schema.cliff_release,
          elapsed_curve_time,
        );
    } else if curent_time_stamp >= initial_timestamp {
      release = schema.initial_release;
    } else {
      release = 0;
    }

    let total_vested = (release * investment.total_value) / FRACTION_BASE;
    total_vested - investment.withdrawn_value
  }

  pub fn withdraw_investment(
    &mut self,
    curent_time_stamp: u64,
    investment_id: String,
    value_to_withdraw: u128,
  ) {
    let mut investment = self.investments.get(&investment_id).expect(ERR_006);

    let available_withdraw =
      self.calculate_available_withdraw(curent_time_stamp, investment_id.clone());
    assert!(value_to_withdraw <= available_withdraw, "{}", ERR_007);

    investment.increase_withdrawn_value(value_to_withdraw);

    self.investments.insert(&investment_id, &investment);
  }

  pub fn undo_withdraw_investment(&mut self, investment_id: String, value_to_return: u128) {
    let mut investment = self.investments.get(&investment_id).expect(ERR_006);

    investment.withdrawn_value -= value_to_return;

    self.investments.insert(&investment_id, &investment);
  }
}

#[cfg(test)]
mod tests {
  pub use near_sdk::{testing_env, Balance, MockedBlockchain, VMContext};

  pub use super::*;

  pub const CONTRACT_ACCOUNT: &str = "contract.testnet";
  pub const TOKEN_ACCOUNT: &str = "token.testnet";
  pub const OWNER_ACCOUNT: &str = "owner.testnet";

  pub fn get_context(
    input: Vec<u8>,
    is_view: bool,
    attached_deposit: u128,
    account_balance: u128,
    signer_id: AccountId,
    block_timestamp: u64,
    prepaid_gas: u64,
  ) -> VMContext {
    VMContext {
      current_account_id: CONTRACT_ACCOUNT.to_string(),
      signer_account_id: signer_id.clone(),
      signer_account_pk: vec![0, 1, 2],
      predecessor_account_id: signer_id.clone(),
      input,
      block_index: 0,
      block_timestamp,
      account_balance,
      account_locked_balance: 0,
      storage_usage: 0,
      attached_deposit,
      prepaid_gas,
      random_seed: vec![0, 1, 2],
      is_view,
      output_data_receivers: vec![],
      epoch_height: 19,
    }
  }
  pub fn init_contract() -> Contract {
    Contract {
      owner: OWNER_ACCOUNT.to_string(),
      token_contract: TOKEN_ACCOUNT.to_string(),
      schemas: UnorderedMap::new(StorageKey::Schemas),
      investments: LookupMap::new(StorageKey::Investments),
    }
  }

  #[test]
  fn test_new() {
    let context = get_context(
      vec![],
      false,
      0,
      0,
      OWNER_ACCOUNT.to_string(),
      0,
      10u64.pow(18),
    ); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    let contract = Contract::new(OWNER_ACCOUNT.to_string(), TOKEN_ACCOUNT.to_string());
    assert_eq!(contract.owner, OWNER_ACCOUNT.to_string());
    assert_eq!(contract.token_contract, TOKEN_ACCOUNT.to_string());
  }

  #[test]
  #[should_panic(expected = "The contract is not initialized")]
  fn test_default() {
    let context = get_context(
      vec![],
      false,
      0,
      0,
      OWNER_ACCOUNT.to_string(),
      0,
      10u64.pow(18),
    );
    testing_env!(context);
    let _contract = Contract::default();
  }

  #[test]
  fn implementation_test_calculate_avalibe_withdraw() {
    // This is an implementation test. It's used to assert that implementation of code is correct
    // in case of refactoring you can safely disregard this test and erase it
    // Asserts that calculate_available_withdraw method of Contract is calculating the correct
    // amount.
    let context = get_context(
      vec![],
      false,
      0,
      0,
      OWNER_ACCOUNT.to_string(),
      0,
      10u64.pow(18),
    );
    testing_env!(context);
    let mut contract = init_contract();
    let total_quantity: u128 = 1_000_000_000;
    let schema_name = "schema".to_string();
    let investor_name = "investor".to_string();
    let investment_id = create_investment_id(schema_name.clone(), investor_name.clone());

    let initial_release = 30;
    let cliff_release = 50;
    let final_release = 20;

    let schema = schema::Schema {
      category: schema_name.clone(),
      allocated_quantity: 0,
      total_quantity,
      initial_release,
      cliff_release,
      final_release,
      initial_timestamp: 0,
      cliff_delta: 100_000,
      final_delta: 100_000,
      curve_type: schema::CurveType::Linear {
        discrete_period: 10,
      },
      investments: Vec::new(),
    };

    contract.schemas.insert(&schema_name, &schema);

    let mut investment = investment::Investment {
      account: investor_name,
      total_value: total_quantity,
      withdrawn_value: 0,
      date_in: None,
    };
    contract.investments.insert(&investment_id, &investment);

    //assert initial stage
    assert_eq!(
      contract.calculate_available_withdraw(0, investment_id.clone()),
      (initial_release * total_quantity) / FRACTION_BASE
    );
    assert_eq!(
      contract.calculate_available_withdraw(100_000, investment_id.clone()),
      (initial_release * total_quantity) / FRACTION_BASE
    );

    //assert curve stage
    let curve_percentage =
      schema
        .curve_type
        .calculate_curve_return(schema.final_delta, schema.cliff_release, 30_000);

    assert_eq!(
      contract.calculate_available_withdraw(130_000, investment_id.clone()),
      ((initial_release * total_quantity) + (curve_percentage * total_quantity)) / FRACTION_BASE
    );

    //assert final stage
    assert_eq!(
      contract.calculate_available_withdraw(200_000, investment_id.clone()),
      total_quantity
    );

    let withdrawn_amount = 100;
    investment.withdrawn_value = withdrawn_amount;
    contract.investments.insert(&investment_id, &investment);

    //assert initial stage
    assert_eq!(
      contract.calculate_available_withdraw(0, investment_id.clone()),
      ((initial_release * total_quantity) / FRACTION_BASE) - withdrawn_amount
    );
    assert_eq!(
      contract.calculate_available_withdraw(100_000, investment_id.clone()),
      ((initial_release * total_quantity) / FRACTION_BASE) - withdrawn_amount
    );

    //assert curve stage
    let curve_percentage1 =
      schema
        .curve_type
        .calculate_curve_return(schema.final_delta, schema.cliff_release, 30_000);
    assert_eq!(
      contract.calculate_available_withdraw(130_000, investment_id.clone()),
      (((initial_release * total_quantity) + (curve_percentage1 * total_quantity)) / FRACTION_BASE)
        - withdrawn_amount
    );

    //assert final stage
    assert_eq!(
      contract.calculate_available_withdraw(200_000, investment_id.clone()),
      total_quantity - withdrawn_amount
    );
  }
}
