use crate::config::postgres::PostgresConfig;
use bb8::{Pool, PooledConnection};
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;

pub type ConnectionManager = PostgresConnectionManager<NoTls>;
pub type PgPool = Pool<ConnectionManager>;
pub type PgPooledConnection = PooledConnection<'static, ConnectionManager>;

pub async fn build_pool(pg_config: &PostgresConfig) -> PgPool {
    let database_url = pg_config.config_string();
    let manager = PostgresConnectionManager::new(database_url.parse().unwrap(), NoTls);

    Pool::builder().build(manager).await.unwrap()
}

pub async fn get_connection(pool: &'static PgPool) -> PgPooledConnection {
    pool.get().await.unwrap()
}
