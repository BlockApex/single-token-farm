use once_cell::sync::Lazy;
use std::env;
use std::sync::Mutex;

pub mod contracts;
pub mod lake_framework;
pub mod postgres;

static MISSING_VARS: Lazy<Mutex<Box<Vec<&str>>>> = Lazy::new(|| Mutex::new(Box::new(vec![])));

fn register_missing_var(var_name: &'static str) {
    Lazy::force(&MISSING_VARS).lock().unwrap().push(var_name);
}

fn get_required_var(var_name: &'static str) -> String {
    let value = env::var(var_name).unwrap_or("".to_string());

    if value.len() == 0 {
        register_missing_var(var_name)
    }

    value
}

fn get_optional_var(var_name: &str) -> Option<String> {
    env::var(var_name)
        .ok()
        .and_then(|value| if value.len() > 0 { Some(value) } else { None })
}

pub fn initialize() {
    dotenv::dotenv().unwrap();
    contracts::get_contracts_config();
    postgres::get_postgres_config();
    lake_framework::get_lake_framework_config();

    assert!(
        Lazy::force(&MISSING_VARS).lock().unwrap().len() == 0,
        "Must provide the following environment variables: {:#?}",
        MISSING_VARS.lock().unwrap()
    );
}
