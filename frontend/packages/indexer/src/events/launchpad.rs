use crate::types::json_types::{U128, U64};
use crate::types::listing::{Listing, ListingStatus, SalePhase};
use crate::types::AccountId;

use postgres_types::ToSql;
use rust_decimal::{prelude::FromPrimitive, Decimal};
use serde::{Deserialize, Serialize};

use super::convert::{u128_to_decimal, u64_to_decimal, u64_to_utc};
use super::Event;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddGuardianLog {
    new_guardian: AccountId,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveGuardianLog {
    old_guardian: AccountId,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RetrieveTreasuryFundsLog {
    token_type: AccountId,
    quantity: U128,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateListingLog {
    listing_data: Listing,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CancelListingLog {
    listing_id: U64,
}

#[derive(Serialize, Deserialize, Debug)]

pub struct ProjectFundListingLog {
    listing_id: U64,
    tokens_sale: U128,
    tokens_liquidity: U128,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProjectWithdrawListingLog {
    listing_id: U64,
    project_tokens_withdraw: U128,
    price_tokens_withdraw: U128,
    project_status: ListingStatus,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InvestorBuyAllocationsLog {
    investor_id: AccountId,
    listing_id: U64,
    project_status: ListingStatus,
    sale_phase: SalePhase,
    allocations_purchased: U64,
    tokens_purchased: U128,
    total_allocations_sold: U64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InvestorWithdrawAllocationsLog {
    investor_id: AccountId,
    listing_id: U64,
    project_status: ListingStatus,
    project_tokens_withdrawn: U128,
    price_tokens_withdrawn: U128,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InvestorStakeMembershipLog {
    investor_id: AccountId,
    token_quantity: U128,
    new_membership_level: U64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InvestorUnstakeMembershipLog {
    investor_id: AccountId,
    token_quantity: U128,
    new_membership_level: U64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "snake_case")]
#[non_exhaustive]
pub enum LaunchpadEvent {
    AddGuardian([AddGuardianLog; 1]),
    RemoveGuardian([RemoveGuardianLog; 1]),
    RetrieveTreasuryFunds([RetrieveTreasuryFundsLog; 1]),
    CreateListing([CreateListingLog; 1]),
    CancelListing([CancelListingLog; 1]),
    ProjectFundListing([ProjectFundListingLog; 1]),
    ProjectWithdrawListing([ProjectWithdrawListingLog; 1]),
    InvestorBuyAllocations([InvestorBuyAllocationsLog; 1]),
    InvestorWithdrawAllocations([InvestorWithdrawAllocationsLog; 1]),
    InvestorStakeMembership([InvestorStakeMembershipLog; 1]),
    InvestorUnstakeMembership([InvestorUnstakeMembershipLog; 1]),
}

impl Event for LaunchpadEvent {
    fn kind(&self) -> &'static str {
        match &self {
            Self::AddGuardian(_) => "launch0",
            Self::RemoveGuardian(_) => "launch1",
            Self::RetrieveTreasuryFunds(_) => "launch2",
            Self::CreateListing(_) => "launch3",
            Self::CancelListing(_) => "launch4",
            Self::ProjectFundListing(_) => "launch5",
            Self::ProjectWithdrawListing(_) => "launch6",
            Self::InvestorBuyAllocations(_) => "launch7",
            Self::InvestorWithdrawAllocations(_) => "launch8",
            Self::InvestorStakeMembership(_) => "launch9",
            Self::InvestorUnstakeMembership(_) => "launchA",
        }
    }

    fn raw_statements(&self) -> &'static [&'static str] {
        match &self {
            Self::CreateListing(_) => &["
                insert into listings (
                    listing_id,
                    status,
                    project_owner,
                    project_token,
                    price_token, 

                    open_sale_1_timestamp,
                    open_sale_2_timestamp,
                    final_sale_2_timestamp,
                    liquidity_pool_timestamp,
                    
                    total_amount_sale_project_tokens,
                    token_allocation_size,
                    token_allocation_price,
                    allocations_sold,
                    liquidity_pool_project_tokens,
                    liquidity_pool_price_tokens,
                    fraction_instant_release,
                    fraction_cliff_release,
                    cliff_timestamp,
                    end_cliff_timestamp,
                    fee_price_tokens,
                    fee_liquidity_tokens,
                    dex_id
                )
                values (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                    $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                )
            "],

            Self::CancelListing(_) => {
                &["update listings set status = 'cancelled' where listing_id = $1;"]
            }

            Self::ProjectFundListing(_) => {
                &["update listings set status = 'funded' where listing_id = $1;"]
            }

            Self::ProjectWithdrawListing(_) => &["
                update listings
                set status = $2
                where listing_id = $1;"],

            Self::InvestorBuyAllocations(_) => {
                &["select investor_buy_allocations($1, $2, $3, $4, $5, $6)"]
            }

            Self::InvestorWithdrawAllocations(_) => {
                &["select investor_withdraw_allocations($1, $2, $3)"] // TODO: find this function
            }

            Self::InvestorStakeMembership(_) => &["
                insert into launchpad_investors (account_id, staked_token, last_check)
                values ($1, $2, now())
                on conflict (account_id)
                do
                    update launchpad_investors
                    set staked_token = $2;"],

            Self::InvestorUnstakeMembership(_) => &["
                update launchpad_investors
                set staked_token = $2
                where account_id = $1"],

            Self::AddGuardian(_) | Self::RemoveGuardian(_) | Self::RetrieveTreasuryFunds(_) => &[],
        }
    }

    fn parameters(&self) -> Vec<Vec<Box<dyn ToSql + Sync + '_>>> {
        match &self {
            Self::CreateListing([CreateListingLog { listing_data }]) => {
                let listing_data = match listing_data {
                    Listing::V1(listing) => listing,
                };

                vec![vec_box![
                    u64_to_decimal(&listing_data.listing_id),
                    listing_data.status.clone(),
                    listing_data.project_owner.clone(),
                    listing_data.project_token.to_string(),
                    listing_data.price_token.to_string(),
                    u64_to_utc(&listing_data.open_sale_1_timestamp),
                    u64_to_utc(&listing_data.open_sale_2_timestamp),
                    u64_to_utc(&listing_data.final_sale_2_timestamp),
                    u64_to_utc(&listing_data.liquidity_pool_timestamp),
                    u128_to_decimal(&listing_data.total_amount_sale_project_tokens),
                    u128_to_decimal(&listing_data.token_allocation_size),
                    u128_to_decimal(&listing_data.token_allocation_price),
                    u64_to_decimal(&listing_data.allocations_sold),
                    u128_to_decimal(&listing_data.liquidity_pool_project_tokens),
                    u128_to_decimal(&listing_data.liquidity_pool_price_tokens),
                    u128_to_decimal(&listing_data.fraction_instant_release),
                    u128_to_decimal(&listing_data.fraction_cliff_release),
                    u64_to_utc(&listing_data.cliff_timestamp),
                    u64_to_utc(&listing_data.end_cliff_timestamp),
                    u128_to_decimal(&listing_data.fee_price_tokens),
                    u128_to_decimal(&listing_data.fee_liquidity_tokens),
                    listing_data.dex_id.map(|v| Decimal::from_u64(v.0)),
                ]]
            }

            Self::CancelListing([CancelListingLog { listing_id }]) => {
                vec![vec_box![u64_to_decimal(listing_id)]]
            }

            Self::ProjectFundListing(
                [ProjectFundListingLog {
                    listing_id,
                    tokens_sale: _,
                    tokens_liquidity: _,
                }],
            ) => vec![vec_box![u64_to_decimal(listing_id)]],

            &Self::ProjectWithdrawListing(
                [ProjectWithdrawListingLog {
                    listing_id,
                    project_tokens_withdraw: _,
                    price_tokens_withdraw: _,
                    project_status,
                }],
            ) => vec![vec_box![u64_to_decimal(listing_id), project_status.clone()]],

            &Self::InvestorBuyAllocations(
                [InvestorBuyAllocationsLog {
                    investor_id,
                    listing_id,
                    project_status,
                    sale_phase: _,
                    allocations_purchased,
                    tokens_purchased,
                    total_allocations_sold,
                }],
            ) => vec![vec_box![
                investor_id.clone(),
                u64_to_decimal(listing_id),
                project_status.clone(),
                u64_to_decimal(allocations_purchased),
                u128_to_decimal(tokens_purchased),
                u64_to_decimal(total_allocations_sold),
            ]],

            &Self::InvestorWithdrawAllocations(
                [InvestorWithdrawAllocationsLog {
                    investor_id,
                    listing_id,
                    project_tokens_withdrawn,
                    price_tokens_withdrawn,
                    project_status,
                }],
            ) => vec![vec_box![
                investor_id.clone(),
                u64_to_decimal(listing_id),
                project_status.clone(),
                u128_to_decimal(project_tokens_withdrawn),
                u128_to_decimal(price_tokens_withdrawn),
            ]],

            &Self::InvestorStakeMembership(
                [InvestorStakeMembershipLog {
                    investor_id,
                    token_quantity,
                    new_membership_level: _,
                }],
            ) => vec![vec_box![investor_id, u128_to_decimal(token_quantity)]],

            &Self::InvestorUnstakeMembership(
                [InvestorUnstakeMembershipLog {
                    investor_id,
                    token_quantity,
                    new_membership_level: _,
                }],
            ) => vec![vec_box![investor_id, u128_to_decimal(token_quantity)]],

            Self::AddGuardian(_) | Self::RemoveGuardian(_) | Self::RetrieveTreasuryFunds(_) => {
                vec![]
            }
        }
    }
}
