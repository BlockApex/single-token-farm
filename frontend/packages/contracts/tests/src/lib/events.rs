use workspaces::result::ExecutionResult;

#[allow(dead_code)] // it is used in tests, I found it preferable to #[cfg(test)]
pub const EVENT_JSON_LOG_PREFIX: &str = "EVENT_JSON:";

#[allow(dead_code)]
pub fn parse_event_logs<T>(
  result: ExecutionResult<T>,
) -> serde_json::Result<Vec<serde_json::Value>> {
  let prefix_len = EVENT_JSON_LOG_PREFIX.len();

  let logs = result.logs();

  let mut events = Vec::with_capacity(logs.len());
  for log in logs.iter() {
    let log = &log[prefix_len..];

    let event = serde_json::from_str(log)?;

    events.push(event);
  }

  Ok(events)
}

#[allow(dead_code)]
pub fn find_event_type(
  events: Vec<serde_json::Value>,
  event_type: &str,
) -> Option<serde_json::Value> {
  events
    .iter()
    .find(|event| event.get("event").and_then(|t| t.as_str()) == Some(event_type))
    .and_then(|event| Some(event.clone()))
}
