use crate::*;
use near_sdk::{
  json_types::U128,
  serde::{Serialize, Deserialize},
};

/// Binary struct hosts the information regarding the contract to
/// be deployed - the hash is the address on the contract memory for
/// the contract binary that will be deployed
#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Binary {
  pub contract_name: String,
  pub contract_hash: CryptoHash,
  //This is how much the user should pay as a DEPLOYMENT FEE - it's different from the cost of storage
  pub deployment_cost: U128,
  // This is the cost to call the constructor method in the new contract and store its initial state
  pub init_cost: U128,
  pub init_fn_name: String,
  pub init_fn_params: String,
}

impl Binary {
  pub fn new(
    contract_name: String,
    contract_hash: CryptoHash,
    deployment_cost: U128,
    init_cost: U128,
    init_fn_name: String,
    init_fn_params: String,
  ) -> Self {
    Self {
      contract_name,
      contract_hash,
      deployment_cost,
      init_cost,
      init_fn_name,
      init_fn_params,
    }
  }

  pub fn change_binary(
    &mut self,
    contract_name: String,
    contract_hash: CryptoHash,
    deployment_cost: U128,
    init_fn_name: String,
    init_fn_params: String,
  ) {
    self.contract_name = contract_name;
    self.contract_hash = contract_hash;
    self.deployment_cost = deployment_cost;
    self.init_fn_name = init_fn_name;
    self.init_fn_params = init_fn_params;
  }

  pub fn change_deployment_cost(&mut self, deployment_cost: U128) {
    self.deployment_cost = deployment_cost;
  }
}
