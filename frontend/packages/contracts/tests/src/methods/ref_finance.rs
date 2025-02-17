use crate::*;

pub async fn get_number_of_pools(contract: &Contract) -> anyhow::Result<u64> {
  anyhow::Ok(
    contract
      .view("get_number_of_pools", json!({}).to_string().into_bytes())
      .await?
      .json()?,
  )
}

pub async fn get_pool(contract: &Contract, pool_id: u64) -> anyhow::Result<serde_json::Value> {
  anyhow::Ok(
    contract
      .view(
        "get_pool",
        json!({ "pool_id": pool_id }).to_string().into_bytes(),
      )
      .await?
      .json()?,
  )
}

pub async fn get_deposits(
  contract: &Contract,
  account: &Account,
) -> anyhow::Result<HashMap<String, String>> {
  anyhow::Ok(
    contract
      .view(
        "get_deposits",
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
