use super::{json_types::U128, AccountId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type FungibleTokenId = AccountId;

pub type FungibleTokenBalance = HashMap<FungibleTokenId, U128>;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum NftCollection {
    NFTContract { account_id: AccountId },
}

pub type NonFungibleTokenId = (NftCollection, String);

pub fn split_ids(token_id: &NonFungibleTokenId) -> (&AccountId, &String) {
    let (collection, nft_id) = token_id;

    let collection_id = match collection {
        NftCollection::NFTContract { account_id } => account_id,
    };

    (collection_id, nft_id)
}
