use postgres_types::ToSql;
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::types::json_types::{U128, U64};
use crate::types::staking::{
    split_ids, FungibleTokenBalance, FungibleTokenId, NftCollection, NonFungibleTokenId,
};
use crate::types::AccountId;

use super::convert::{u128_to_decimal, u32_to_decimal, u64_to_decimal};
use super::Event;

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateStakingProgramLog {
    pub collection_address: AccountId,
    pub collection_owner: AccountId,
    pub token_address: AccountId,
    pub collection_rps: FungibleTokenBalance,
    pub min_staking_period: U64,
    pub early_withdraw_penalty: U128,
    pub round_interval: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateStakingProgramLog {
    pub collection_address: AccountId,
    pub early_withdraw_penalty: Option<U128>,
    pub min_staking_period: Option<U64>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct StakeNftLog {
    pub token_id: NonFungibleTokenId,
    pub owner_id: AccountId,
    pub staked_timestamp: U64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UnstakeNftLog {
    pub token_id: NonFungibleTokenId,
    pub withdrawn_balance: HashMap<String, U128>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WithdrawRewardLog {
    pub collection: NftCollection,
    pub owner_id: AccountId,
    pub token_id: FungibleTokenId,
    pub amount: U128,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "snake_case")]
#[non_exhaustive]
pub enum NftStakingEvent {
    CreateStakingProgram([CreateStakingProgramLog; 1]),
    UpdateStakingProgram([UpdateStakingProgramLog; 1]),
    StakeNft([StakeNftLog; 1]),
    UnstakeNft([UnstakeNftLog; 1]),
}

impl Event for NftStakingEvent {
    fn kind(&self) -> &'static str {
        match &self {
            Self::CreateStakingProgram(_) => "nft0",
            Self::UpdateStakingProgram(_) => "nft1",
            Self::StakeNft(_) => "nft2",
            Self::UnstakeNft(_) => "nft3",
        }
    }

    fn raw_statements(&self) -> &'static [&'static str] {
        match &self {
            Self::CreateStakingProgram(_) => &["
                    insert into staking_programs (
                        collection_id,
                        collection_owner_id,
                        token_address,
                        min_staking_period,
                        early_withdraw_penalty,
                        round_interval
                    )
                    values ($1, $2, $3, $4, $5, $6)"],

            Self::UpdateStakingProgram(_) => &["
                    update staking_programs
                    set 
                        early_withdraw_penalty = coallesce($2, early_withdraw_penalty)
                        min_staking_period = coallesce($3, min_staking_period)
                    where collection_id = $1"],

            Self::StakeNft(_) => &["
                    insert into staked_nfts (
                        nft_id,
                        collection_id,
                        owner_id,
                        staked_timestamp
                    )
                    values ($1, $2, $3, $4)"],

            Self::UnstakeNft(_) => &["
                    delete from staked_nfts
                    where nft_id = $1
                    and collection_id = $2"],
        }
    }

    fn parameters(&self) -> Vec<Vec<Box<dyn ToSql + Sync + '_>>> {
        match &self {
            Self::CreateStakingProgram(
                [CreateStakingProgramLog {
                    collection_address,
                    collection_owner,
                    token_address,
                    collection_rps: _,
                    min_staking_period,
                    early_withdraw_penalty,
                    round_interval,
                }],
            ) => vec![vec_box![
                collection_address,
                collection_owner,
                token_address,
                u64_to_decimal(min_staking_period),
                u128_to_decimal(early_withdraw_penalty),
                u32_to_decimal(*round_interval),
            ]],

            &Self::UpdateStakingProgram(
                [UpdateStakingProgramLog {
                    collection_address,
                    early_withdraw_penalty,
                    min_staking_period,
                }],
            ) => vec![vec_box![
                collection_address.clone(),
                early_withdraw_penalty.and_then(|v| Decimal::from_u128(v.0)),
                min_staking_period.and_then(|v| Decimal::from_u64(v.0)),
            ]],

            Self::StakeNft(
                [StakeNftLog {
                    token_id,
                    owner_id,
                    staked_timestamp,
                }],
            ) => {
                let (collection_id, nft_id) = split_ids(token_id);

                vec![vec_box![
                    nft_id,
                    collection_id,
                    owner_id.clone(),
                    u64_to_decimal(staked_timestamp),
                ]]
            }

            Self::UnstakeNft(
                [UnstakeNftLog {
                    token_id,
                    withdrawn_balance: _,
                }],
            ) => {
                let (collection_id, nft_id) = split_ids(token_id);

                vec![vec_box![nft_id, collection_id]]
            }
        }
    }
}
