use workspaces::result::ExecutionResult;

use crate::*;

pub async fn withdraw_locked_tokens(
  sender: &Account,
  contract: &Contract,
  vesting_id: String,
) -> ExecutionResult<String> {
  transact_call(
    sender
      .call(contract.id(), "withdraw_locked_tokens")
      .args_json(json!({ "vesting_id": vesting_id }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn view_vesting_paginated(
  contract: &Contract,
  account: &Account,
) -> anyhow::Result<serde_json::Value> {
  anyhow::Ok(
    contract
      .view(
        "view_vesting_paginated",
        json!({
          "account_id": account.id(),
          "initial_id": "0".to_string(),
          "size": "20".to_string()
        })
        .to_string()
        .into_bytes(),
      )
      .await?
      .json()?,
  )
}
