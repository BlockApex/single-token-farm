use crate::*;

pub async fn view_token_ratio(contract: &Contract) -> anyhow::Result<HashMap<String, String>> {
  anyhow::Ok(
    contract
      .view("view_token_ratio", json!({}).to_string().into_bytes())
      .await?
      .json()?,
  )
}
