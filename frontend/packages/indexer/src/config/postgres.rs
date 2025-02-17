use super::{get_optional_var, get_required_var};
use once_cell::sync::Lazy;

pub struct PostgresConfig {
    pub host: String,
    pub user: String,
    pub port: u16,
    pub database: Option<String>,
    pub password: Option<String>,
}

fn optional_delimiter(opt: &Option<String>, delimiter: &str) -> String {
    opt.as_ref()
        .map(|value| format!("{}{}", delimiter, value))
        .unwrap_or("".to_string())
}

impl PostgresConfig {
    fn init() -> Self {
        Self {
            host: get_required_var("PG_HOST"),
            user: get_required_var("PG_USER"),
            port: get_optional_var("PG_PORT")
                .and_then(|p| p.parse::<u16>().ok()) // TODO: handle this result's error
                .unwrap_or(5432),
            database: get_optional_var("PG_DATABASE"),
            password: get_optional_var("PG_PASSWORD"),
        }
    }

    #[allow(dead_code)]
    pub fn connection_string(&self) -> String {
        format!(
            "postgres:://{}{}@{}:{}{}",
            self.user,
            optional_delimiter(&self.password, ":"),
            self.host,
            self.port,
            optional_delimiter(&self.database, "/")
        )
    }

    pub fn config_string(&self) -> String {
        format!(
            "host={} user={} port={} {} {}",
            self.host,
            self.user,
            self.port,
            optional_delimiter(&self.database, "dbname="),
            optional_delimiter(&self.password, "password=")
        )
    }
}

static PG_CONFIG: Lazy<PostgresConfig> = Lazy::new(|| PostgresConfig::init());

pub fn get_postgres_config() -> &'static PostgresConfig {
    Lazy::force(&PG_CONFIG)
}
