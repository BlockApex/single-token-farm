use serde_json::json;
use workspaces::{Contract, result::ExecutionResult, Account};

use crate::methods::{transact_call, GAS_LIMIT, token::ft_transfer_call, nft::nft_transfer_call};

pub const DENOM: u128 = 1_000_000_000_000_000_000_000;

fn serialize_nft_contract(collection: &Contract) -> serde_json::Value {
  json!({ "type": "NFTContract", "account_id": collection.as_account().id() })
}

pub async fn initialize_nft_staking(
  contract: &Contract,
  owner: &Account,
  contract_tokens: Vec<&str>,
) -> ExecutionResult<String> {
  transact_call(
    contract
      .call("new")
      .args_json(json!({"owner_id": owner.id(), "contract_tokens": contract_tokens })),
  )
  .await
}

pub async fn add_guardian(
  nft_staking: &Contract,
  owner: &Account,
  guardian_id: &str,
) -> ExecutionResult<String> {
  transact_call(
    owner
      .call(&nft_staking.as_account().id(), "add_guardian")
      .args_json(json!({ "guardian": guardian_id }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn transfer<U: serde::Serialize>(
  nft_staking: &Contract,
  operator: &Account,
  operation: U,
) -> ExecutionResult<String> {
  transact_call(
    operator
      .call(&nft_staking.as_account().id(), "transfer")
      .args_json(operation)
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn deposit<U: serde::Serialize>(
  nft_staking: &Contract,
  token: &Contract,
  sender: &Account,
  amount: u128,
  payload: U,
) -> ExecutionResult<String> {
  ft_transfer_call(
    &sender,
    &token,
    &nft_staking.as_account(),
    amount,
    json!({
      "type": "Deposit",
      "data": payload,
    })
    .to_string(),
  )
  .await
}

pub async fn create_staking_program<U: serde::Serialize>(
  nft_staking: &Contract,
  guardian: &Account,
  payload: U,
) -> ExecutionResult<String> {
  transact_call(
    guardian
      .call(&nft_staking.as_account().id(), "create_staking_program")
      .args_json(json!({ "payload": payload }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn stake(
  nft_staking: &Contract,
  collection: &Contract,
  staker: &Account,
  token_id: &str,
) -> ExecutionResult<String> {
  nft_transfer_call(
    &collection,
    &staker,
    &nft_staking.as_account(),
    token_id,
    None,
    None,
    json!({ "type": "Stake" }).to_string(),
  )
  .await
}

pub async fn unstake(
  nft_staking: &Contract,
  collection: &Contract,
  staker: &Account,
  token_id: &str,
) -> ExecutionResult<String> {
  transact_call(
    staker
      .call(nft_staking.as_account().id(), "unstake")
      .args_json(json!({
        "token_id": [
          serialize_nft_contract(collection),
          token_id
        ]
      }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn withdraw_reward(
  nft_staking: &Contract,
  collection: &Contract,
  staker: &Account,
  token: &Contract,
) -> ExecutionResult<String> {
  transact_call(
    staker
      .call(nft_staking.as_account().id(), "withdraw_reward")
      .args_json(json!({
        "collection": serialize_nft_contract(collection),
        "token_id": token.as_account().id(),
        "amount": null
      }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn alter_rewards(
  signer: &Account,
  nft_staking: &Contract,
  collection: &Contract,
  token_id: &str,
  amount: u128
) -> ExecutionResult<String> {
  transact_call(
    signer
      .call(nft_staking.as_account().id(), "alter_rewards")
      .args_json(json!({
        "collection": serialize_nft_contract(collection),
        "token_id": token_id,
        "amount": amount.to_string()
      }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}
