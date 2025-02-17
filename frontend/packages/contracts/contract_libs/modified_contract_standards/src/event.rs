use serde::Serialize;
use near_sdk::log;

#[derive(Serialize, Debug)]
#[serde(tag = "standard")]
#[must_use = "don't forget to `.emit()` this event"]
#[serde(rename_all = "snake_case")]
pub(crate) enum NearEvent<'a> {
  Nep171(crate::non_fungible_token::events::Nep171Event<'a>),
  Nep141(crate::fungible_token::events::Nep141Event<'a>),
}

impl<'a> NearEvent<'a> {
  fn to_json_string(&self) -> String {
    // Events cannot fail to serialize so fine to panic on error
    #[allow(clippy::redundant_closure)]
    serde_json::to_string(self)
      .ok()
      .unwrap_or_else(|| panic!("noUnwrap"))
  }

  fn to_json_event_string(&self) -> String {
    format!("EVENT_JSON:{}", self.to_json_string())
  }

  /// Logs the event to the host. This is required to ensure that the event is triggered
  /// and to consume the event.
  pub(crate) fn emit(self) {
    log!("{}", &self.to_json_event_string());
  }
}
