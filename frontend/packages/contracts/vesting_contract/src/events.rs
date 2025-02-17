use near_sdk::{log};
use serde_json::{json};

const STANDARD_NAME: &str = "HaC_vesting";
const STANDARD_VERSION: &str = "1.0.0";

fn log_basic_event_format(standard: &str, version: &str, event_type: &str, data_vec: Vec<&str>) {
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

pub fn event_create_schema(category: &str, total_quantity: &str) {
  let event_type = "create_schema";
  let event_data = &json!({
      "category": category,
      "total_quantity": total_quantity,
  })
  .to_string();
  log_basic_event_format(
    STANDARD_NAME,
    STANDARD_VERSION,
    event_type,
    vec![event_data],
  );
}

pub fn event_create_investment(
  category: &str,
  investor: &str,
  total_quantity: &str,
  date_in: Option<u64>,
) {
  let event_type = "create_investment";
  let event_data = &json!({
      "category": category,
      "investor": investor,
      "total_quantity": total_quantity,
      "date_in": date_in,
  })
  .to_string();
  log_basic_event_format(
    STANDARD_NAME,
    STANDARD_VERSION,
    event_type,
    vec![event_data],
  );
}

pub fn event_withdraw_vested_funds(
  category: &str,
  investor: &str,
  vested_quantity: &str,
  requested_by: &str,
) {
  let event_type = "withdraw_vested_funds";
  let event_data = &json!({
      "category": category,
      "investor": investor,
      "vested_quantity": vested_quantity,
      "date_in": requested_by,
  })
  .to_string();
  log_basic_event_format(
    STANDARD_NAME,
    STANDARD_VERSION,
    event_type,
    vec![event_data],
  );
}
