use super::json_types::{U128, U64};
use super::AccountId;
use postgres_types::{FromSql, ToSql};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum FungibleToken {
    FT { account_id: AccountId },
}

impl ToString for FungibleToken {
    fn to_string(&self) -> String {
        match self {
            Self::FT { account_id } => account_id.to_string(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub enum SalePhase {
    Phase1,
    Phase2,
}

#[derive(Debug, Clone, ToSql, FromSql, Deserialize, Serialize)]
#[postgres(name = "listing_status")]
pub enum ListingStatus {
    #[postgres(name = "unfunded")]
    Unfunded,
    #[postgres(name = "funded")]
    Funded,
    #[postgres(name = "sale_finalized")]
    SaleFinalized,
    #[postgres(name = "pool_created")]
    PoolCreated,
    #[postgres(name = "pool_project_token_sent")]
    PoolProjectTokenSent,
    #[postgres(name = "pool_price_token_sent")]
    PoolPriceTokenSent,
    #[postgres(name = "liquidity_pool_finalized")]
    LiquidityPoolFinalized,
    #[postgres(name = "cancelled")]
    Cancelled,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ListingV1 {
    pub listing_id: U64,
    pub project_owner: AccountId,
    pub project_token: FungibleToken,
    pub price_token: FungibleToken,
    pub open_sale_1_timestamp: U64,
    pub open_sale_2_timestamp: U64,
    pub final_sale_2_timestamp: U64,
    pub liquidity_pool_timestamp: U64,
    pub total_amount_sale_project_tokens: U128,
    pub token_allocation_size: U128,
    pub token_allocation_price: U128,
    pub allocations_sold: U64,
    pub liquidity_pool_project_tokens: U128,
    pub liquidity_pool_price_tokens: U128,
    pub fraction_instant_release: U128,
    pub fraction_cliff_release: U128,
    pub cliff_timestamp: U64,
    pub end_cliff_timestamp: U64,
    pub fee_price_tokens: U128,
    pub fee_liquidity_tokens: U128,

    pub status: ListingStatus,

    pub dex_id: Option<U64>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum Listing {
    V1(ListingV1),
}
