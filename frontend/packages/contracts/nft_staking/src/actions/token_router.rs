use near_sdk::{env, json_types::U128, near_bindgen, AccountId, PromiseOrValue};
use serde::{Deserialize, Serialize};

use crate::{
  funds::deposit::DepositOperation,
  types::{FungibleTokenID, NFTCollection, NonFungibleTokenID},
  Contract, ContractExt,
};

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
#[serde(tag = "type", content = "data")]
enum FTRoute {
  Deposit(DepositOperation),
}

pub struct FTRoutePayload<'a> {
  pub sender_id: AccountId,
  pub token_id: FungibleTokenID,
  pub amount: u128,
  pub msg: &'a str,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
#[serde(tag = "type")]
enum NFTRoute {
  Stake,
}

pub struct NFTRoutePayload<'a> {
  pub sender_id: AccountId,
  pub previous_owner_id: AccountId,
  pub token_id: NonFungibleTokenID,
  pub msg: &'a str,
  pub collection: NFTCollection,
}

impl Contract {
  fn assert_collection_has_program(&self, collection: &NFTCollection) {
    assert!(
      self.staking_programs.contains_key(&collection),
      "Transfered token collection is not accepted by this contract"
    );
  }
}

#[near_bindgen]
impl Contract {
  pub fn ft_on_transfer(
    &mut self,
    sender_id: AccountId,
    amount: U128,
    msg: String,
  ) -> PromiseOrValue<U128> {
    let token_id = env::predecessor_account_id();

    self.match_ft_route(FTRoutePayload {
      sender_id,
      token_id,
      amount: amount.0,
      msg: &msg.to_owned(),
    });

    PromiseOrValue::Value(U128(0))
  }

  fn match_ft_route(&mut self, payload: FTRoutePayload) {
    let route: FTRoute = serde_json::from_str(payload.msg).expect("Unrecognized deposit route");

    match route {
      FTRoute::Deposit(operation) => self.deposit(payload, operation),
    }
  }

  pub fn nft_on_transfer(
    &mut self,
    sender_id: AccountId,
    previous_owner_id: AccountId,
    token_id: String,
    msg: String,
  ) -> bool {
    let collection = NFTCollection::NFTContract {
      account_id: env::predecessor_account_id(),
    };

    self.assert_collection_has_program(&collection);

    let result = self.match_nft_route(NFTRoutePayload {
      sender_id,
      previous_owner_id,
      token_id: (collection.clone(), token_id),
      msg: &msg.to_owned(),
      collection,
    });

    match result {
      Ok(_) => false,
      Err(_) => true,
    }
  }

  fn match_nft_route(&mut self, payload: NFTRoutePayload) -> Result<(), serde_json::Error> {
    let route: NFTRoute = serde_json::from_str(payload.msg).unwrap();

    match route {
      NFTRoute::Stake => {
        self.stake(payload);
      }
    }

    Ok(())
  }
}
