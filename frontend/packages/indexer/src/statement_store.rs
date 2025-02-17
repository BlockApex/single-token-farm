use std::collections::HashMap;

use postgres_types::ToSql;
use rust_decimal::{prelude::FromPrimitive, Decimal};
use tokio_postgres::Statement;

use crate::events::{Event, EventId};
use crate::pool::PgPooledConnection;

const SUCCESS_LOG_STATEMENT_KEY: &'static str = "store0";
const FAILURE_LOG_STATEMENT_KEY: &'static str = "store1";

pub struct StatementStore {
    conn: PgPooledConnection,
    prepared_statements: HashMap<&'static str, Vec<Statement>>,
}

impl StatementStore {
    pub async fn init(conn: PgPooledConnection) -> Self {
        let mut prepared_statements: HashMap<&'static str, Vec<Statement>> = HashMap::new();

        let log_success_statement = conn
            .prepare(
                "insert into processed_events (block_height, log_index, succeeded)
                values ($1, $2, true);",
            )
            .await
            .unwrap();

        prepared_statements.insert(SUCCESS_LOG_STATEMENT_KEY, vec![log_success_statement]);

        let log_failure_statement = conn
            .prepare(
                "insert into processed_events (block_height, log_index, succeeded, error)
                values ($1, $2, false, $3);",
            )
            .await
            .unwrap();

        prepared_statements.insert(FAILURE_LOG_STATEMENT_KEY, vec![log_failure_statement]);

        Self {
            conn,
            prepared_statements,
        }
    }

    pub async fn prepare_statements(&mut self, event: &impl Event) {
        let statements = event.raw_statements();

        let mut prepared_statements = vec![];
        for statement in statements {
            let prepared = self.conn.prepare(statement).await.unwrap();
            prepared_statements.push(prepared);
        }

        self.prepared_statements
            .insert(event.kind(), prepared_statements);
    }

    /*
    pub async fn get_statements(&mut self, event: &impl Event) -> &Vec<Statement> {
        if !self.prepared_statements.contains_key(event.kind()) {
            self.prepare_statements(event).await;
        }

        self.prepared_statements.get(event.kind()).unwrap()
    }
    */

    pub async fn process_event(&mut self, event_id: EventId, event: impl Event) {
        
        // TODO: let statements = self.get_statements(&event).await;
        if !self.prepared_statements.contains_key(event.kind()) {
            self.prepare_statements(&event).await;
        }
        let statements = self.prepared_statements.get(event.kind()).unwrap();

        if statements.len() == 0 {
            return;
        }

        let parameters = event.parameters();

        let transaction = self.conn.build_transaction().start().await.unwrap();

        for (statement, boxed_params) in statements.iter().zip(parameters.iter()) {
            let params: Vec<&(dyn ToSql + Sync)> =
                boxed_params.iter().map(|b| b.as_ref()).collect();

            if let Err(err) = transaction.execute(statement, &params).await {
                transaction.rollback().await.unwrap();
                self.conn
                    .execute(
                        &self
                            .prepared_statements
                            .get(FAILURE_LOG_STATEMENT_KEY)
                            .unwrap()[0],
                        &[
                            &Decimal::from_u64(event_id.0),
                            &Decimal::from_usize(event_id.1),
                            &err.to_string(),
                        ],
                    )
                    .await
                    .unwrap();
                return;
            }
        }

        transaction
            .execute(
                &self
                    .prepared_statements
                    .get(SUCCESS_LOG_STATEMENT_KEY)
                    .unwrap()[0],
                &[
                    &Decimal::from_u64(event_id.0),
                    &Decimal::from_usize(event_id.1),
                ],
            )
            .await
            .unwrap();

        transaction.commit().await.unwrap();
    }
}
