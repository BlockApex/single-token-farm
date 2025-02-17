pub(crate) const ERR_001: &str = "This function is private to owner";

// pub(crate) const ERR_002: &str =
//     "token_launcher: Contract: new_binary: There is already a binary with this type_of_contract
//     (the type_of_contract is the binary id)";

pub(crate) const ERR_003: &str =
  "Contract: register_contract: A contract with this name is already saved to the memory";

pub(crate) const ERR_004: &str =
  "Contract: register_contract: To register a contract you must attach 0,25 N as storage";

pub(crate) const ERR_005: &str =
  "Contract: register_contract: There is no contract associated with the hash that was passed";

pub(crate) const ERR_006: &str =
  "Contract: unregister_contract: There is no contract with this name - it is not possible to unregister it";

pub(crate) const ERR_007: &str =
  "Contract: unregister_contract: There is no hash associated with this name - it is not possible to unregister it";

pub(crate) const ERR_101: &str =
  "Deploy: deploy_new_contract: This contract address already exists";

pub(crate) const ERR_102: &str =
  "Deploy: deploy_new_contract: The contract address can not have MORE than 64 characters -> This includes the factory prefix: ";

pub(crate) const ERR_103: &str =
  "Deploy: deploy_new_contract: There is no contract of this type registred on the binaries map";

pub(crate) const ERR_104: &str =
  "Deploy: deploy_new_contract: The attached deposit must be over the storage_cost + binary.deployment_cost: ";

pub(crate) const ERR_105: &str =
  "Deploy: deploy_new_contract: deploy_contract: Could not serialize the soon to be deployed contract args";

pub(crate) const ERR_106: &str =
  "Deploy: deploy_new_contract: deploy_contract: There is no contract of this type registred on the contract memory";

pub(crate) const ERR_201: &str =
  "Owner: get_code: There is no contract of this type registred on the contract memory";

pub(crate) const ERR_202: &str = "Owner: get_code: this funciton is restricted to the owner";

pub(crate) const ERR_203: &str =
  "Owner: get_code_with_name: There is no contract of this type registred on the binaries map";

pub(crate) const ERR_204: &str =
  "Owner: get_code_with_name: There is no contract of this type registred on the contract memory";

pub(crate) const ERR_205: &str =
  "Owner: withdraw_treasury: The amount you solicited to withdraw is greater then the treasury: ";

pub(crate) const ERR_301: &str =
  "view: There is no contract of this type registred on the binaries map";

pub(crate) const ERR_302: &str =
  "view: There is no contract of this type registred on the deployed_contracts map";
