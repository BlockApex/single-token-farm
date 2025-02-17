use near_sdk::json_types::{Base58CryptoHash, U128};
use near_sdk::serde_json::{json, Value};
use near_sdk::{log, AccountId};

const STANDARD_NAME: &str = "token_launcher";
const STANDARD_VERSION: &str = "1.0.0";

fn log_basic_event_format(standard: &str, version: &str, event_type: &str, data_vec: Vec<&Value>) {
  log!(
    "EVENT_JSON:{}",
    &json!({
        "standard": standard,
        "version": version,
        "event": event_type,
        "data": data_vec
    })
    .to_string()
  )
}
/// New wasm was registered with a name to the binaries struct
pub fn event_new_contract_registered(type_of_contract: &str, contract_hash: Base58CryptoHash) {
  let event_type = "new_contract_registered";
  let event_data = &json!({
      "type_of_contract": type_of_contract,
      "contract_hash": contract_hash,
  });
  log_basic_event_format(
    STANDARD_NAME,
    STANDARD_VERSION,
    event_type,
    vec![event_data],
  );
}

/// Contract was removed from the deploying options (a.k.a removed from the binaries struct)
pub fn event_contract_removed(type_of_contract: &str, contract_hash: Base58CryptoHash) {
  let event_type = "contract_removed";
  let event_data = &json!({
      "type_of_contract": type_of_contract,
      "contract_hash": contract_hash,
  });
  log_basic_event_format(
    STANDARD_NAME,
    STANDARD_VERSION,
    event_type,
    vec![event_data],
  );
}

/// New wasm was added to factory contract storage
pub fn event_new_contract_saved(storage_cost: U128, contract_hash: Base58CryptoHash) {
  let event_type = "new_contract_saved_on_storage";
  let event_data = &json!({
      "contract_hash": contract_hash,
      "storage_cost": storage_cost
  });
  log_basic_event_format(
    STANDARD_NAME,
    STANDARD_VERSION,
    event_type,
    vec![event_data],
  );
}

/// New wasm was added to factory contract storage
pub fn event_contract_deploy(
  deploy_address: AccountId,
  type_of_contract: String,
  deploy_status: String,
) {
  let event_type = "new_contract_saved_on_storage";
  let event_data = &json!({
      "deploy_address: ": deploy_address,
      "type_of_contract: ": type_of_contract,
      "deploy_status: ": deploy_status
  });
  log_basic_event_format(
    STANDARD_NAME,
    STANDARD_VERSION,
    event_type,
    vec![event_data],
  );
}

/// Withdrawal of the contract treasury by the owner
pub fn event_treasury_withdrawal(amount: U128, treasury: U128) {
  let event_type = "treasury_withdrawal";
  let event_data = &json!({
      "amount: ": amount,
      "balance_after_withdraw": treasury
  });
  log_basic_event_format(
    STANDARD_NAME,
    STANDARD_VERSION,
    event_type,
    vec![event_data],
  );
}
