use near_sdk::serde::Serialize;
use near_sdk::serde_json::json;
use near_sdk::AccountId;
use near_sdk::{json_types::U128, log};

use crate::types::{
  FungibleTokenID, NFTCollection, SerializableFungibleTokenBalance, SerializableStakedNFT,
};
use crate::{actions::guardian::CreateStakingProgramPayload, types::NonFungibleTokenID};

fn log_event<T: Serialize>(event: &str, data: T) {
  let event = json!({
    "standard": "nft_staking",
    "version": "1.0.0",
    "event": event,
    "data": [data]
  });

  log!("EVENT_JSON:{}", event.to_string());
}

pub fn create_staking_program(payload: CreateStakingProgramPayload) {
  log_event("create_staking_program", payload)
}

pub fn update_staking_program<T: Serialize>(updates: T) {
  log_event("update_staking_program", updates);
}

pub fn stake_nft(staked_nft: &SerializableStakedNFT) {
  log_event("stake_nft", staked_nft);
}

pub fn unstake_nft(nft_id: &NonFungibleTokenID, balance: SerializableFungibleTokenBalance) {
  let event = json!({
    "token_id": nft_id,
    "withdrawn_balance": balance
  });

  log_event("unstake_nft", event);
}

pub fn withdraw_reward(
  collection: NFTCollection,
  owner_id: AccountId,
  token_id: FungibleTokenID,
  amount: U128,
) {
  log_event(
    "withdraw_reward",
    json!({
      "collection": collection,
      "owner_id": owner_id,
      "token_id": token_id.to_string(),
      "amount": amount,
    }),
  )
}
