use serde_json::json;
use workspaces::result::ExecutionResult;

use crate::*;

pub async fn ft_transfer(
  sender: &Account,
  contract: &Contract,
  receiver: &Account,
  amount: u128,
) -> ExecutionResult<String> {
  transact_call(
    sender
      .call(contract.id(), "ft_transfer")
      .args_json(json!({
        "receiver_id": receiver.id(),
        "amount": amount.to_string(),
        "memo": null,
      }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn ft_transfer_call(
  sender: &Account,
  contract: &Contract,
  receiver: &Account,
  amount: u128,
  msg: String,
) -> ExecutionResult<String> {
  transact_call(
    sender
      .call(contract.id(), "ft_transfer_call")
      .args_json(json!({
        "receiver_id": receiver.id(),
        "amount": amount.to_string(),
        "memo": null,
        "msg": msg
      }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn ft_balance_of(contract: &Contract, account: &Account) -> anyhow::Result<String> {
  anyhow::Ok(
    contract
      .view(
        "ft_balance_of",
        json!({
          "account_id": account.id()
        })
        .to_string()
        .into_bytes(),
      )
      .await?
      .json()?,
  )
}

pub async fn initialize_ft_contract(
  contract: &Contract,
  owner: &Account,
) -> ExecutionResult<String> {
  transact_call(contract.call("new").args_json(json!({
    "owner_id": owner.id(),
    "total_supply": "1000000000000000000000",
    "metadata": {
      "spec": "ft-1.0.0",
      "name": "name",
      "symbol": "NME",
      "icon": null,
      "reference": null,
      "reference_hash": null,
      "decimals": FT_DECIMALS,
    }
  })))
  .await
}
