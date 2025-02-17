use crate::{
  *,
  errors::{ERR_301, ERR_302},
};

#[near_bindgen]
impl Contract {
  pub fn view_deployment_fee(&self, contract_name: String) -> U128 {
    let binary = self.binaries.get(&contract_name).expect(ERR_301);
    binary.deployment_cost
  }

  pub fn view_init_cost(&self, contract_name: String) -> U128 {
    let binary = self.binaries.get(&contract_name).expect(ERR_301);
    binary.init_cost
  }

  pub fn view_storage_cost_bytes(&self, contract_name: String) -> U128 {
    let binary = self.binaries.get(&contract_name).expect(ERR_301);
    let storage_cost = self
      .storage_cost
      .get(&binary.contract_hash.into())
      .expect("Could not find this contract cost of deployment");
    storage_cost
  }

  pub fn view_storage_cost_near(&self, contract_name: String) -> U128 {
    let binary = self.binaries.get(&contract_name).expect(ERR_301);
    let storage_cost = self
      .storage_cost
      .get(&binary.contract_hash.into())
      .expect("Could not find this contract cost of deployment");
    U128(storage_cost.0 * env::storage_byte_cost())
  }

  pub fn view_necessary_deposit_for_deployment(&self, contract_name: String) -> U128 {
    let binary = self.binaries.get(&contract_name).expect(ERR_301);
    let storage_cost: u128 = self
      .storage_cost
      .get(&binary.contract_hash.into())
      .expect("Could not find this contract cost of deployment")
      .0;

    let binary = self.binaries.get(&contract_name).expect(ERR_301);
    let final_cost =
      storage_cost * env::storage_byte_cost() + binary.deployment_cost.0 + binary.init_cost.0;

    U128(final_cost)
  }

  pub fn view_binary(&self, contract_name: String) -> Binary {
    let binary = self.binaries.get(&contract_name).expect(ERR_301);
    binary
  }

  pub fn view_deployed_contract(&self, account: AccountId) -> String {
    let contract_type = self.deployed_contracts.get(&account).expect(ERR_302);
    contract_type
  }

  pub fn view_treasury(&self) -> U128 {
    self.only_owner();
    self.treasury
  }
}
