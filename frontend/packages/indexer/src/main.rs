use events::EventId;
use near_indexer_primitives::views::{ExecutionOutcomeView, ExecutionStatusView};
use near_lake_framework::near_indexer_primitives;
use pool::get_connection;
use pool::PgPooledConnection;
use rust_decimal::Decimal;
use tokio::sync::mpsc;

use crate::accounts::ContractAccount;
use crate::config::{contracts::get_contracts_config, postgres::get_postgres_config};
use crate::pool::build_pool;
use crate::statement_store::StatementStore;

#[macro_use]
extern crate vec_box;

mod accounts;
mod config;
mod events;
mod pool;
mod statement_store;
mod types;

const JSON_EVENT_PREFIX: &str = "EVENT_JSON:";

#[tokio::main]
async fn main() -> Result<(), tokio::io::Error> {
    config::initialize();

    println!("initialize");
    let pool = Box::leak(Box::new(build_pool(get_postgres_config()).await));

    let contract_accounts = ContractAccount::init_accounts(
        &get_contracts_config().launchpad_contract_account_id,
        &get_contracts_config().nft_staking_contract_account_id,
        &get_contracts_config().x_token_contract_account_id,
    );

    let mut store = StatementStore::init(get_connection(pool).await).await;

    let block_height: u64 = {
        let conn = get_connection(pool).await;
        get_current_block_height(conn).await
    };
    let lake_config = config::lake_framework::inject_block_height(block_height);
    let (_, stream) = near_lake_framework::streamer(lake_config);

    listen_blocks(stream, &contract_accounts, &mut store).await;

    Ok(())
}

async fn get_current_block_height(conn: PgPooledConnection) -> u64 {
    let numeric_block_height: Decimal = conn
        .query_one(
            "SELECT COALESCE(MAX(block_height), 0::numeric) FROM processed_events WHERE succeeded = true",
            &[],
        )
        .await
        .unwrap()
        .get(0);

    numeric_block_height.try_into().unwrap()
}

async fn listen_blocks(
    mut stream: mpsc::Receiver<near_indexer_primitives::StreamerMessage>,
    contract_accounts: &[ContractAccount],
    store: &mut StatementStore,
) {
    while let Some(streamer_message) = stream.recv().await {
        println!("block");
        for shard in streamer_message.shards {
            for receipt in shard.receipt_execution_outcomes {
                let outcome = receipt.execution_outcome.outcome;

                match outcome.status {
                    ExecutionStatusView::Failure(_) => (),
                    _ => {
                        let block_height = streamer_message.block.header.height;

                        process_transaction(outcome, block_height, contract_accounts, store).await
                    }
                };
            }
        }
    }
}

async fn process_transaction(
    execution_outcome: ExecutionOutcomeView,
    block_height: u64,
    contract_accounts: &[ContractAccount],
    store: &mut StatementStore,
) {
    let executor_id = execution_outcome.executor_id.to_string();

    for contract in contract_accounts {
        if contract.is(&executor_id) {
            for (index, log) in execution_outcome.logs.iter().enumerate() {
                if log.starts_with(JSON_EVENT_PREFIX) {
                    let event_json_string = &log[JSON_EVENT_PREFIX.len()..];

                    let event_id: EventId = (block_height, index);

                    contract
                        .process_event(event_id, event_json_string, store)
                        .await;
                }
            }
        }
    }
}
