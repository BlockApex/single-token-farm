use std::convert::TryInto;
use near_sdk::{Balance, self, Gas, PromiseOrValue, Promise, is_promise_success, serde_json::json};
use crate::*;
use crate::errors::{ERR_101, ERR_102, ERR_103, ERR_104, ERR_105, ERR_106};
use near_sdk::serde_json::value::Value;

use events::event_contract_deploy;

const NO_DEPOSIT: Balance = 0;
const BASE: Gas = Gas(70_000_000_000_000);
const CALLBACK_GAS: Gas = Gas(10_000_000_000_000);
const CALLBACK: &str = "callback";

#[near_bindgen]
impl Contract {
  ///Verifies if the selected contract meets the conditions to be deployed
  ///Calls the deploy function that has unsafe methods
  /// TO-DO
  #[payable]
  pub fn deploy_new_contract(
    &mut self,
    contract_to_be_deployed: String,
    deploy_prefix: String,
    args: Value,
  ) {
    let deploy_address = create_deploy_address(deploy_prefix);

    //verify if contract size does not exceed max allowed on near
    assert!(
      deploy_address.len() <= 64,
      "{}{}",
      ERR_102,
      env::current_account_id()
    );

    //verify if contract is already on deployed contract list
    if let Some(_value) = self
      .deployed_contracts
      .get(&deploy_address.clone().try_into().unwrap())
    {
      panic!("{}", ERR_101)
    }

    let binary = self.binaries.get(&contract_to_be_deployed).expect(ERR_103);

    let contract_hash_58: Base58CryptoHash = binary.contract_hash.into();

    let storage_cost =
      self.storage_cost.get(&contract_hash_58).expect(ERR_103).0 * env::storage_byte_cost();

    //verify that user payed enough storage
    //the cost of storage is composed by the cost of deployment(deployment fee charged
    // by the factory) +  blockchain storage cost
    assert!(
      env::attached_deposit() >= (storage_cost + binary.deployment_cost.0 + binary.init_cost.0),
      "{}{}{}",
      ERR_104,
      (storage_cost + binary.deployment_cost.0 + binary.init_cost.0),
      " N "
    );

    let deploy_address_ac: AccountId = deploy_address.to_string().try_into().unwrap();
    //insert into lupmap
    self
      .deployed_contracts
      .insert(&deploy_address_ac, &contract_to_be_deployed);

    //Deploy the contract
    deploy_contract(deploy_address, args, binary, contract_to_be_deployed);

    //Contract will only be added to
  }

  /// Callback after a contract was deployed
  /// refunds the attached deposit on deploy fail
  /// log deploy event to chain
  #[private]
  pub fn callback(
    &mut self,
    deploy_address: AccountId,
    type_of_contract: String,
    initial_deposit: U128,
    deploy_fee: U128,
    user_deploying: AccountId,
  ) -> PromiseOrValue<bool> {
    if is_promise_success() {
      //Log the sucessfull deployment
      event_contract_deploy(deploy_address, type_of_contract, "Success".to_string());

      //increase the treasury when promise is sucessfull
      self.treasury = U128(self.treasury.0 + deploy_fee.0);

      PromiseOrValue::Value(true)
    } else {
      //Remove the contract address from deployed_contracts
      self.deployed_contracts.remove(&deploy_address);

      //Log the failed deployement
      event_contract_deploy(deploy_address, type_of_contract, "Fail".to_string());

      //return the attached deposit to the account that signed the deploy
      Promise::new(user_deploying).transfer(initial_deposit.0);
      PromiseOrValue::Value(false)
    }
  }
}

/// Low level function used to deploy contract
/// Uses sys methods to load a contract to a register
/// Deploys the contract that was loaded on the register
pub fn deploy_contract(
  deploy_address: String,
  args: Value,
  binary: Binary,
  contract_to_be_deployed: String,
) {
  // The deployment fee should not be transfered to the new contract - it should be subtracted
  let contract_deposit = env::attached_deposit() - binary.deployment_cost.0;

  let encoded_args = near_sdk::serde_json::to_vec(&args).expect(ERR_105);
  let factory_account_id = env::current_account_id().as_bytes().to_vec();
  let code_hash = binary.contract_hash;
  let init_fn = binary.init_fn_name;

  // arguments for callback function - initial deposit is used to return funds on callback
  // deployment fee is used to increase the trasury balance
  let callback_args = near_sdk::serde_json::to_vec(&json!({ "deploy_address": deploy_address,
   "type_of_contract":contract_to_be_deployed,
    "initial_deposit":contract_deposit.to_string(),
    "deploy_fee": binary.deployment_cost,
    "user_deploying": env::predecessor_account_id()
  }))
  .expect("Failed to serialize callback args");

  unsafe {
    // Check that such contract exists.
    assert_eq!(
      sys::storage_has_key(code_hash.len() as _, code_hash.as_ptr() as _),
      1,
      "{}",
      ERR_106
    );
    // Load input (wasm code) into register 0.
    sys::storage_read(code_hash.len() as _, code_hash.as_ptr() as _, 0);
    // schedule a Promise tx to account_id
    let promise_id =
      sys::promise_batch_create(deploy_address.len() as _, deploy_address.as_ptr() as _);
    // create account first.
    sys::promise_batch_action_create_account(promise_id);
    // transfer attached deposit.
    sys::promise_batch_action_transfer(promise_id, &contract_deposit as *const u128 as _);
    // deploy contract (code is taken from register 0).
    sys::promise_batch_action_deploy_contract(promise_id, u64::MAX as _, 0);
    // call `new` with given arguments
    sys::promise_batch_action_function_call(
      promise_id,
      init_fn.len() as _,
      init_fn.as_ptr() as _,
      encoded_args.len() as _,
      encoded_args.as_ptr() as _,
      &NO_DEPOSIT as *const u128 as _,
      BASE.0,
    );
    // attach callback to the factory.
    let callback_id = sys::promise_then(
      promise_id,
      factory_account_id.len() as _,
      factory_account_id.as_ptr() as _,
      CALLBACK.len() as _,
      CALLBACK.as_ptr() as _,
      callback_args.len() as _,
      callback_args.as_ptr() as _,
      &NO_DEPOSIT as *const u128 as _,
      CALLBACK_GAS.0,
    );
    // attach callback to the factory.
    // add
    sys::promise_return(callback_id);
  }
}

pub fn create_deploy_address(prefix: String) -> String {
  let contract_account = env::current_account_id();
  format!("{}.{}", prefix, contract_account,)
}

#[cfg(test)]
mod tests {

  use near_sdk::testing_env;

  use crate::tests::*;

  use super::*;

  pub const DEPLOYED: &str = "test.factory.near";
  pub const LONG: &str =
    "Aaaaaaaaaaaaaaaaaaaaaaaaaaadddddddddddddddaaaaaakfbksdjbfksbfgajkbglkd3kjdajkbdflgkjdjkkskdfbskssssssssssaaaaaaaaaaaaaaa";

  /// Test the deployment of a contract that is already
  /// listed on the map of deployed contracts
  /// This function should panic
  #[test]
  #[should_panic(expected = "Deploy: deploy_new_contract: This contract address already exists")]
  fn test_deploy_new_contract_panic_contract_already_listed() {
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
    let contract_deployed = create_deploy_address(DEPLOYED.to_string());
    contract
      .deployed_contracts
      .insert(&contract_deployed.parse().unwrap(), &"token".to_string());

    contract.deploy_new_contract("token".to_string(), DEPLOYED.to_string(), json!(null));
  }

  /// Test the deployment of a contract that is already
  /// listed on the map of deployed contracts
  /// This function should panic
  #[test]
  #[should_panic(
    expected = "Deploy: deploy_new_contract: The contract address can not have MORE than 64 characters -> This includes the factory prefix: "
  )]
  fn test_deploy_new_contract_panic_contract_name_too_long() {
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
    let contract_deployed = create_deploy_address(LONG.to_string());

    contract.deploy_new_contract("token".to_string(), contract_deployed, json!(null));
  }
}
