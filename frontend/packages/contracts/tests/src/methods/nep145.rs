use serde_json::json;
use workspaces::{Account, Contract, result::ExecutionResult};

use crate::{GAS_LIMIT, transact_call};

pub async fn storage_withdraw(
  contract: &Contract,
  account: &Account,
  amount: Option<u128>,
) -> ExecutionResult<String> {
  transact_call(
    account
      .call(contract.as_account().id(), "storage_withdraw")
      .args_json(json!({ "amount": amount.map(|a| a.to_string()) }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn storage_unregister(contract: &Contract, account: &Account) -> ExecutionResult<String> {
  transact_call(
    account
      .call(contract.as_account().id(), "storage_unregister")
      .args_json(json!({ "force": false }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}
