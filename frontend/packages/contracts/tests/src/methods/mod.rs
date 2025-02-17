use workspaces::{operations::CallTransaction, result::ExecutionResult};

use crate::*;

mod launchpad;
mod locked_token;
pub mod nep145;
pub mod nft;
pub mod nft_staking;
mod ref_finance;
mod storage;
pub mod token;
mod token_launcher;
mod x_token;

pub use token::*;
pub use storage::*;
pub use launchpad::*;
pub use ref_finance::*;
pub use x_token::*;
pub use locked_token::*;
pub use token_launcher::*;

pub async fn transact_call<'a, 'b>(
  call_transaction: CallTransaction<'a, 'b>,
) -> ExecutionResult<String> {
  call_transaction
    .transact()
    .await
    .unwrap()
    .into_result()
    .unwrap()
}

pub fn get_wasm(file_name: &str) -> Result<Vec<u8>, Error> {
  std::fs::read(Path::new(OUT_DIR).join(file_name))
}

pub async fn create_user_account(tla: &Account, account_id: &str) -> Account {
  tla
    .create_subaccount(account_id)
    .initial_balance(USER_ACCOUNT_BALANCE)
    .transact()
    .await
    .unwrap()
    .unwrap()
}

pub async fn deploy_contract(tla: &Account, account_id: &str, wasm: &Vec<u8>) -> Contract {
  let contract_account = tla
    .create_subaccount(account_id)
    .initial_balance(CONTRACT_ACCOUNT_BALANCE)
    .transact()
    .await
    .unwrap()
    .unwrap();

  contract_account.deploy(wasm).await.unwrap().unwrap()
}

pub async fn deploy_contract_from_wasm_path(
  tla: &Account,
  account_id: &str,
  wasm_path: &str,
) -> Contract {
  let wasm = get_wasm(wasm_path).unwrap();
  deploy_contract(&tla, account_id, &wasm).await
}

pub async fn spoon_contract(
  contract_id: &str,
  worker: &Worker<Sandbox>,
) -> anyhow::Result<Contract> {
  let mainnet = workspaces::mainnet_archival().await?;
  let contract_id: AccountId = contract_id.parse().unwrap();

  Ok(
    worker
      .import_contract(&contract_id, &mainnet)
      .initial_balance(parse_near!("1000000 N"))
      .block_height(SPOON_BLOCK_HEIGHT)
      .transact()
      .await?,
  )
}

pub async fn time_travel(worker: &Worker<Sandbox>, seconds_to_advance: u64) -> anyhow::Result<()> {
  let blocks_to_advance = (seconds_to_advance * TO_NANO) / AVERAGE_BLOCK_TIME;
  worker.fast_forward(blocks_to_advance).await?;
  anyhow::Ok(())
}
