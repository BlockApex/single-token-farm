use crate::*;

pub async fn view_investor_allocations(
  contract: &Contract,
  account: &Account,
  listing_id: u64,
) -> anyhow::Result<Option<(String, String)>> {
  anyhow::Ok(
    contract
      .view(
        "view_investor_allocation",
        json!({
          "account_id": account.id(),
          "listing_id": listing_id.to_string()
        })
        .to_string()
        .into_bytes(),
      )
      .await?
      .json()?,
  )
}

pub async fn view_listing(
  contract: &Contract,
  listing_id: u64,
) -> anyhow::Result<Option<serde_json::Value>> {
  anyhow::Ok(
    contract
      .view(
        "view_listing",
        json!({"listing_id": listing_id.to_string()})
          .to_string()
          .into_bytes(),
      )
      .await?
      .json()?,
  )
}

pub async fn view_contract_treasury_balance(
  contract: &Contract,
) -> anyhow::Result<Vec<(serde_json::Value, String)>> {
  anyhow::Ok(
    contract
      .view(
        "view_contract_treasury_balance",
        json!({
          "start": 0.to_string(),
          "pagination": 10.to_string()
        })
        .to_string()
        .into_bytes(),
      )
      .await?
      .json()?,
  )
}

pub async fn withdraw_allocations(
  contract: &Contract,
  account: &Account,
  listing_id: u64,
) -> anyhow::Result<()> {
  transact_call(
    account
      .call(contract.id(), "withdraw_allocations")
      .args_json(json!({
        "listing_id": listing_id.to_string()
      }))
      .deposit(1)
      .gas(GAS_LIMIT),
  )
  .await;

  anyhow::Ok(())
}

pub async fn launch_on_dex(
  contract: &Contract,
  account: &Account,
  listing_id: u64,
) -> anyhow::Result<()> {
  transact_call(
    account
      .call(contract.id(), "launch_on_dex")
      .args_json(json!({"listing_id": listing_id.to_string()}))
      .deposit(parse_near!("1 N"))
      .gas(GAS_LIMIT),
  )
  .await;

  anyhow::Ok(())
}
