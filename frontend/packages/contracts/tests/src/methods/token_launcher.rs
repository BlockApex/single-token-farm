use crate::*;
use serde_json::Value;
use workspaces::result::ExecutionResult;

pub async fn initialize_factory_contract(
  contract: &Contract,
  owner: &Account,
) -> ExecutionResult<String> {
  transact_call(contract.call("new").args_json(json!({
    "owner": owner.id()
  })))
  .await
}

pub async fn register_contract(
  owner: &Account,
  contract: &Contract,
  contract_name: String,
  contract_hash: String,
  contract_cost: u128,
  init_cost: u128,
  init_fn_name: String,
  init_fn_params: String,
) -> ExecutionResult<String> {
  transact_call(
    owner
      .call(&contract.id(), "register_contract")
      .args_json(json!({
        "contract_name": contract_name,
        "contract_hash": contract_hash,
        "contract_cost": contract_cost.to_string(),
        "init_cost": init_cost.to_string(),
        "init_fn_name": init_fn_name,
        "init_fn_params": init_fn_params
      })).deposit(1_000_000_000_000_000_000_000_000),
  )
  .await
}

pub async fn unregister_contract(
  owner: &Account,
  contract: &Contract,
  contract_name: String,
) -> ExecutionResult<String> {
  transact_call(
    owner
      .call(&contract.id(), "unregister_contract")
      .args_json(json!({
        "contract_name": contract_name
      })).gas(300_000_000_000_000),
  )
  .await
}

pub async fn deploy_new_contract(
  owner: &Account,
  contract: &Contract,
  contract_to_be_deployed: String,
  deploy_prefix: String,
  args: Value,
) -> ExecutionResult<String> {
  transact_call(
    owner
      .call(&contract.id(), "deploy_new_contract")
      .args_json(json!({
        "contract_to_be_deployed": contract_to_be_deployed,
        "deploy_prefix": deploy_prefix,
        "args": args
      }))
      .deposit(35_000_000_000_000_000_000_000_000)
      .gas(300_000_000_000_000),
  )
  .await
}
