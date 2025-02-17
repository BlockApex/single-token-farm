use serde_json::json;
use workspaces::{
  result::{ExecutionResult},
  Contract, Account,
};
use near_contract_standards::non_fungible_token::Token;

use crate::{transact_call, GAS_LIMIT};

const MINT_DEPOSIT: u128 = 10000000000000000000000;

pub async fn initialize_nft_contract(
  contract: &Contract,
  owner: &Account,
) -> ExecutionResult<String> {
  transact_call(contract.call("new").args_json(json!({
    "owner_id": owner.id(),
    "metadata": {
      "spec": "nft-1.0.0",
      "name": "Testers",
      "symbol": "TEST",
      "icon": null,
      "base_uri": "https://imgur.com/gallery/OBB7tLg",
      "reference": null,
      "reference_hash": null,
    },
    "media_quantity": null,
  })))
  .await
}

pub async fn nft_transfer_call<U: serde::Serialize>(
  contract: &Contract,
  sender: &Account,
  receiver: &Account,
  token_id: &str,
  approval_id: Option<u32>,
  memo: Option<&str>,
  msg: U,
) -> ExecutionResult<String> {
  transact_call(
    sender
      .call(contract.as_account().id(), "nft_transfer_call")
      .args_json(json!({
        "receiver_id": receiver.id(),
        "token_id": token_id,
        "approval_id": approval_id,
        "memo": memo,
        "msg": msg,
      }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn nft_mint(
  contract: &Contract,
  caller: &Account,
  receiver: Option<&Account>,
) -> ExecutionResult<String> {
  transact_call(
    caller
      .call(&contract.as_account().id(), "nft_mint")
      .args_json(json!({ "receiver_id": receiver.unwrap_or(caller).id() }))
      .deposit(MINT_DEPOSIT)
      .gas(GAS_LIMIT),
  )
  .await
}

pub async fn view_nft_token(contract: &Contract, token_id: &str) -> anyhow::Result<Option<Token>> {
  anyhow::Ok(
    contract
      .view(
        "nft_token",
        json!({ "token_id": token_id }).to_string().into_bytes(),
      )
      .await?
      .json()?,
  )
}
