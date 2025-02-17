use workspaces::result::ExecutionResult;

use crate::*;

pub async fn bulk_register_storage(
  accounts: Vec<&Account>,
  contracts: Vec<&Contract>,
) -> anyhow::Result<()> {
  let mut batch = Vec::new();
  for account in accounts.into_iter() {
    for contract in contracts.iter() {
      batch.push(
        account
          .call(contract.id(), "storage_deposit")
          .args_json(json!({
            "account_id": account.id(),
            "registration_only": false,
          }))
          .deposit(parse_near!("1 N"))
          .transact(),
      );
    }
  }
  try_join_all(batch).await?;
  anyhow::Ok(())
}

// more than required
const STORAGE_DEPOSIT_AMOUNT: u128 = 1250000000000000000000000;
pub async fn register_user(
  contract: &Contract,
  caller: &Account,
  user: &Account,
) -> ExecutionResult<String> {
  transact_call(
    caller
      .call(contract.as_account().id(), "storage_deposit")
      .args_json(json!({ "account_id": user.id() }))
      .deposit(STORAGE_DEPOSIT_AMOUNT),
  )
  .await
}
