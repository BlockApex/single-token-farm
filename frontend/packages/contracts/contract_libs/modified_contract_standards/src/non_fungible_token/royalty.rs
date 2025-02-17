use near_sdk::json_types::U128;
use std::collections::HashMap;
use near_sdk::AccountId;
use crate::non_fungible_token::refund_approved_account_ids;
use near_sdk::assert_one_yocto;
use crate::non_fungible_token::TokenId;
use crate::non_fungible_token::NonFungibleToken;
use near_sdk::Balance;
use serde::{Serialize, Deserialize};
use near_sdk::env;
use std::convert::TryInto;

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Payout {
  pub payout: HashMap<AccountId, U128>,
}

pub(crate) fn royalty_to_payout(royalty_percentage: u32, amount_to_pay: Balance) -> U128 {
  U128(royalty_percentage as u128 * amount_to_pay / 10_000u128)
}

pub trait Royalty {
  //calculates the payout for a token given the passed in balance. This is a view method
  fn nft_payout(&self, token_id: TokenId, balance: U128, max_len_payout: u32) -> Payout;

  //transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance.
  fn nft_transfer_payout(
    &mut self,
    receiver_id: AccountId,
    token_id: TokenId,
    approval_id: u64,
    memo: Option<String>,
    balance: U128,
    max_len_payout: u32,
  ) -> Payout;
}

impl Royalty for NonFungibleToken {
  //calculates the payout for a token given the passed in balance. This is a view method
  fn nft_payout(&self, token_id: TokenId, balance: U128, max_len_payout: u32) -> Payout {
    //get the owner of the token
    let owner_id = self.owner_by_id.get(&token_id).unwrap();
    //keep track of the total perpetual royalties
    let mut total_perpetual = 0;
    //get the u128 version of the passed in balance (which was U128 before)
    let balance_u128 = balance.0;
    //keep track of the payout object to send back
    let mut payout_object = Payout {
      payout: HashMap::new(),
    };
    //get the royalty object from token
    let royalty = self
      .royalties_by_id
      .as_ref()
      .unwrap()
      .get(&token_id)
      .unwrap();

    //make sure we're not paying out to too many people (GAS limits this)
    assert!(
      royalty.len() as u32 <= max_len_payout,
      "Market cannot payout to that many receivers"
    );

    //go through each key and value in the royalty object
    for (k, v) in royalty.iter() {
      //get the key
      let key = k.clone();
      //only insert into the payout if the key isn't the token owner (we add their payout at the end)
      if key != owner_id {
        //
        payout_object.payout.insert(
          key,
          royalty_to_payout((*v).try_into().unwrap(), balance_u128),
        );
        total_perpetual += *v;
      }
    }

    // payout to previous owner who gets 100% - total perpetual royalties
    payout_object.payout.insert(
      owner_id,
      royalty_to_payout((10000 - total_perpetual).try_into().unwrap(), balance_u128),
    );

    //return the payout object
    payout_object
  }

  //transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance.
  fn nft_transfer_payout(
    &mut self,
    receiver_id: AccountId,
    token_id: TokenId,
    approval_id: u64,
    memo: Option<String>,
    balance: U128,
    max_len_payout: u32,
  ) -> Payout {
    //assert that the user attached 1 yocto NEAR for security reasons
    assert_one_yocto();
    //get the sender ID
    let sender_id = env::predecessor_account_id();
    //transfer the token to the passed in receiver and get the previous token object back
    let previous_token =
      self.internal_transfer(&sender_id, &receiver_id, &token_id, Some(approval_id), memo);

    //refund the previous token owner for the storage used up by the previous approved account IDs
    let (previous_owner, previous_approved) = previous_token;
    refund_approved_account_ids(previous_owner.clone(), &previous_approved.unwrap());

    //get the owner of the token
    let owner_id = previous_owner;
    //keep track of the total perpetual royalties
    let mut total_perpetual: u128 = 0;
    //get the u128 version of the passed in balance (which was U128 before)
    let balance_u128 = balance.0;
    //keep track of the payout object to send back
    let mut payout_object = Payout {
      payout: HashMap::new(),
    };
    //get the royalty object from token
    let royalty = self
      .royalties_by_id
      .as_ref()
      .unwrap()
      .get(&token_id)
      .unwrap();

    //make sure we're not paying out to too many people (GAS limits this)
    assert!(
      royalty.len() as u32 <= max_len_payout,
      "Market cannot payout to that many receivers"
    );

    //go through each key and value in the royalty object
    for (k, v) in royalty.iter() {
      //get the key
      let key = k.clone();
      //only insert into the payout if the key isn't the token owner (we add their payout at the end)
      if key != owner_id {
        //
        payout_object.payout.insert(
          key,
          royalty_to_payout((*v).try_into().unwrap(), balance_u128),
        );
        total_perpetual += *v;
      }
    }

    // payout to previous owner who gets 100% - total perpetual royalties
    payout_object.payout.insert(
      owner_id,
      royalty_to_payout((10000 - total_perpetual).try_into().unwrap(), balance_u128),
    );

    //return the payout object
    payout_object
  }
}
