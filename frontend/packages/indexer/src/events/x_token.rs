use super::convert::{u128_to_decimal, u64_to_utc};
use super::Event;
use crate::types::json_types::{U128, U64};
use postgres_types::ToSql;
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct FtMintLog {
    pub owner_id: String,
    pub amount: String,
    pub memo: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FtBurnLog {
    pub owner_id: String,
    pub amount: String,
    pub memo: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProfitDepositLog {
    pub quantity_deposited: U128,
    pub base_token_treasury_after_deposit: U128,
    pub x_token_supply_after_deposit: U128,
    pub timestamp: U64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "snake_case")]
#[non_exhaustive]
pub enum XTokenEvent {
    FtMint([FtMintLog; 1]),
    FtBurn([FtBurnLog; 1]),
    ProfitDeposit([ProfitDepositLog; 1]),
}

impl Event for XTokenEvent {
    fn kind(&self) -> &'static str {
        ""
    }

    fn raw_statements(&self) -> &'static [&'static str] {
        match &self {
            Self::FtMint(_) => &["
                    INSERT INTO x_token_ratios (
                        time_event,
                        base_token_amount,
                        x_token_amount
                      )
                    VALUES ($1, $2, $3);
                "],

            Self::FtBurn(_) => &["
                    INSERT INTO x_token_ratios (
                        time_event,
                        base_token_amount,
                        x_token_amount
                      )
                    VALUES ($1, $2, $3);
                "],

            Self::ProfitDeposit(_) => &["
                    INSERT INTO x_token_ratios (
                        time_event,
                        base_token_amount,
                        x_token_amount
                        )
                    VALUES ($1, $2, $3);
                "],
        }
    }

    fn parameters(&self) -> Vec<Vec<Box<dyn ToSql + Sync + '_>>> {
        match &self {
            Self::FtMint(
                [FtMintLog {
                    owner_id: _,
                    amount: _,
                    memo,
                }],
            ) => {
                let memo_str = memo.clone().unwrap();
                let memo_json: serde_json::Value = serde_json::from_str(memo_str.as_str()).unwrap();

                let base_token: u128 = memo_json["base_token_treasury_after_deposit"]
                    .as_str()
                    .unwrap()
                    .parse()
                    .unwrap();
                let x_token: u128 = memo_json["x_token_supply_after_deposit"]
                    .as_str()
                    .unwrap()
                    .parse()
                    .unwrap();
                let event_timestamp: u64 =
                    memo_json["timestamp"].as_str().unwrap().parse().unwrap();

                vec![vec_box![
                    Decimal::from_u64(event_timestamp).unwrap(),
                    Decimal::from_u128(base_token).unwrap(),
                    Decimal::from_u128(x_token).unwrap(),
                ]]
            }
            Self::FtBurn(
                [FtBurnLog {
                    owner_id: _,
                    amount: _1,
                    memo,
                }],
            ) => {
                let memo_str = memo.clone().unwrap();
                let memo_json: serde_json::Value = serde_json::from_str(memo_str.as_str()).unwrap();

                let base_token: u128 = memo_json["base_token_treasury_after_deposit"]
                    .as_str()
                    .unwrap()
                    .parse()
                    .unwrap();
                let x_token: u128 = memo_json["x_token_supply_after_deposit"]
                    .as_str()
                    .unwrap()
                    .parse()
                    .unwrap();
                let event_timestamp: u64 =
                    memo_json["timestamp"].as_str().unwrap().parse().unwrap();

                vec![vec_box![
                    u64_to_utc(&U64(event_timestamp)),
                    Decimal::from_u128(base_token).unwrap(),
                    Decimal::from_u128(x_token).unwrap(),
                ]]
            }
            Self::ProfitDeposit(
                [ProfitDepositLog {
                    quantity_deposited: _,
                    base_token_treasury_after_deposit,
                    x_token_supply_after_deposit,
                    timestamp,
                }],
            ) => {
                vec![vec_box![
                    u64_to_utc(timestamp),
                    u128_to_decimal(base_token_treasury_after_deposit),
                    u128_to_decimal(x_token_supply_after_deposit),
                ]]
            }
        }
    }
}
