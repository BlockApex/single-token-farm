//! Standard for nep171 (Non-Fungible Token) events.
//!
//! These events will be picked up by the NEAR indexer.
//!
//! <https://github.com/near/NEPs/blob/69f76c6c78c2ebf05d856347c9c98ae48ad84ebd/specs/Standards/NonFungibleToken/Event.md>
//!
//! This is an extension of the events format (nep-297):
//! <https://github.com/near/NEPs/blob/master/specs/Standards/EventsFormat.md>
//!
//! The three events in this standard are [`NftMint`], [`NftTransfer`], and [`NftBurn`].
//!
//! These events can be logged by calling `.emit()` on them if a single event, or calling
//! [`NftMint::emit_many`], [`NftTransfer::emit_many`],
//! or [`NftBurn::emit_many`] respectively.

use crate::event::NearEvent;
use near_sdk::AccountId;
use serde::Serialize;

/// Data to log for an NFT mint event. To log this event, call [`.emit()`](NftMint::emit).
#[must_use]
#[derive(Serialize, Debug, Clone)]
pub struct NftMint<'a> {
  pub owner_id: &'a AccountId,
  pub token_ids: &'a [&'a str],
  #[serde(skip_serializing_if = "Option::is_none")]
  pub memo: Option<&'a str>,
}

impl NftMint<'_> {
  /// Logs the event to the host. This is required to ensure that the event is triggered
  /// and to consume the event.
  pub fn emit(self) {
    Self::emit_many(&[self])
  }

  /// Emits an nft mint event, through [`env::log_str`](near_sdk::env::log_str),
  /// where each [`NftMint`] represents the data of each mint.
  pub fn emit_many(data: &[NftMint<'_>]) {
    new_171_v1(Nep171EventKind::NftMint(data)).emit()
  }
}

/// Data to log for an NFT transfer event. To log this event,
/// call [`.emit()`](NftTransfer::emit).
#[must_use]
#[derive(Serialize, Debug, Clone)]
pub struct NftTransfer<'a> {
  pub old_owner_id: &'a AccountId,
  pub new_owner_id: &'a AccountId,
  pub token_ids: &'a [&'a str],
  #[serde(skip_serializing_if = "Option::is_none")]
  pub authorized_id: Option<&'a AccountId>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub memo: Option<&'a str>,
}

impl NftTransfer<'_> {
  /// Logs the event to the host. This is required to ensure that the event is triggered
  /// and to consume the event.
  pub fn emit(self) {
    Self::emit_many(&[self])
  }

  /// Emits an nft transfer event, through [`env::log_str`](near_sdk::env::log_str),
  /// where each [`NftTransfer`] represents the data of each transfer.
  pub fn emit_many(data: &[NftTransfer<'_>]) {
    new_171_v1(Nep171EventKind::NftTransfer(data)).emit()
  }
}

/// Data to log for an NFT burn event. To log this event, call [`.emit()`](NftBurn::emit).
#[must_use]
#[derive(Serialize, Debug, Clone)]
pub struct NftBurn<'a> {
  pub owner_id: &'a AccountId,
  pub token_ids: &'a [&'a str],
  #[serde(skip_serializing_if = "Option::is_none")]
  pub authorized_id: Option<&'a AccountId>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub memo: Option<&'a str>,
}

impl NftBurn<'_> {
  /// Logs the event to the host. This is required to ensure that the event is triggered
  /// and to consume the event.
  pub fn emit(self) {
    Self::emit_many(&[self])
  }

  /// Emits an nft burn event, through [`env::log_str`](near_sdk::env::log_str),
  /// where each [`NftBurn`] represents the data of each burn.
  pub fn emit_many<'a>(data: &'a [NftBurn<'a>]) {
    new_171_v1(Nep171EventKind::NftBurn(data)).emit()
  }
}

#[derive(Serialize, Debug)]
pub(crate) struct Nep171Event<'a> {
  version: &'static str,
  #[serde(flatten)]
  event_kind: Nep171EventKind<'a>,
}

#[derive(Serialize, Debug)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "snake_case")]
#[allow(clippy::enum_variant_names)]
enum Nep171EventKind<'a> {
  NftMint(&'a [NftMint<'a>]),
  NftTransfer(&'a [NftTransfer<'a>]),
  NftBurn(&'a [NftBurn<'a>]),
}

fn new_171<'a>(version: &'static str, event_kind: Nep171EventKind<'a>) -> NearEvent<'a> {
  NearEvent::Nep171(Nep171Event {
    version,
    event_kind,
  })
}

fn new_171_v1(event_kind: Nep171EventKind) -> NearEvent {
  new_171("1.0.0", event_kind)
}
