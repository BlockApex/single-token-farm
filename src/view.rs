use near_sdk::{
    near_bindgen,
    serde::{Deserialize, Serialize},
    json_types::U128,
};

use crate::*; // <-- Assuming `view.rs` and your main contract code are in the same crate

/// A JSON-friendly representation of `FarmParams`.
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct FarmView {
    pub farm_id: u64,

    pub staking_token: String,
    pub reward_tokens: Vec<String>,

    /// How many tokens are emitted each session for each reward token.
    pub reward_per_session: Vec<U128>,

    /// Session interval in seconds (converted from nanoseconds).
    pub session_interval_sec: u64,

    /// When the farm can start distributing (in seconds).
    pub start_at_sec: u64,
    /// The last time the farm distributed (in seconds).
    pub last_distribution_sec: u64,

    /// Total staked (in U128).
    pub total_staked: U128,

    /// reward_per_share for each reward token (U128).
    pub reward_per_share: Vec<U128>,

    /// Lockup period in seconds (converted from nanoseconds).
    pub lockup_period_sec: u64,
}

/// Convert internal `FarmParams` to a JSON-friendly `FarmView`.
impl From<(&FarmParams, u64)> for FarmView {
    fn from((farm, farm_id): (&FarmParams, u64)) -> Self {
        FarmView {
            farm_id,

            staking_token: farm.staking_token.clone(),
            reward_tokens: farm.reward_tokens.clone(),

            reward_per_session: farm
                .reward_per_session
                .iter()
                .map(|v| U128(*v))
                .collect(),

            session_interval_sec: farm.session_interval / 1_000_000_000,
            start_at_sec: farm.start_time / 1_000_000_000,
            last_distribution_sec: farm.last_distribution / 1_000_000_000,

            total_staked: U128(farm.total_staked),

            reward_per_share: farm
                .reward_per_share
                .iter()
                .map(|v| U128(*v))
                .collect(),

            lockup_period_sec: farm.lockup_period / 1_000_000_000,
        }
    }
}

/// A JSON-friendly representation of `StakeInfo`.
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct StakeInfoView {
    pub farm_id: u64,

    /// How many tokens staked.
    pub amount: U128,

    /// When the user can withdraw (in seconds).
    pub lockup_end_sec: u64,

    /// The user’s reward debt for each token (U128).
    pub reward_debt: Vec<U128>,

    /// The user’s accrued rewards for each token (U128).
    pub accrued_rewards: Vec<U128>,
}

/// Convert internal `StakeInfo` to a JSON-friendly `StakeInfoView`.
impl From<(&StakeInfo, u64)> for StakeInfoView {
    fn from((info, farm_id): (&StakeInfo, u64)) -> Self {
        StakeInfoView {
            farm_id,
            amount: U128(info.amount),
            lockup_end_sec: info.lockup_end / 1_000_000_000,
            reward_debt: info.reward_debt.iter().map(|v| U128(*v)).collect(),
            accrued_rewards: info.accrued_rewards.iter().map(|v| U128(*v)).collect(),
        }
    }
}

#[near_bindgen]
impl ChildFarmingContract {
    /// Return a list of farms in a paginated manner.
    /// `from_index` is the starting farm_id, `limit` is how many to return.
    /// If you store farm IDs in a simple incrementing `farm_count`, you can just iterate up to `farm_count`.
    pub fn list_farms(&self, from_index: u64, limit: u64) -> Vec<FarmView> {
        let mut results = Vec::new();
        let end = std::cmp::min(self.farm_count, from_index + limit);
        for farm_id in from_index..end {
            if let Some(farm) = self.farms.get(&farm_id) {
                results.push(FarmView::from((&farm, farm_id)));
            }
        }
        results
    }

    /// Return a single farm by farm_id (if it exists).
    pub fn get_farm(&self, farm_id: u64) -> Option<FarmView> {
        self.farms
            .get(&farm_id)
            .map(|farm| FarmView::from((&farm, farm_id)))
    }

    /// Return the stake info for a user in a given farm, if any.
    pub fn get_stake_info(
        &self, 
        account_id: String, 
        farm_id: u64
    ) -> Option<StakeInfoView> {
        let key = (account_id.clone(), farm_id);
        self.stakes.get(&key).map(|info| StakeInfoView::from((&info, farm_id)))
    }

    /// Return all stakes a user has, in a paginated manner.
    /// If you want to store a separate structure (e.g. `user -> Vec<farm_id>`) for quick iteration,
    /// you’d do that. But the code below does a naive approach of scanning all `(account, farm_id)` pairs.
    pub fn list_stakes_by_user(
        &self, 
        account_id: String, 
        from_index: u64, 
        limit: u64
    ) -> Vec<StakeInfoView> {
        // Naive approach: you'll iterate over all keys in `stakes`, 
        // filtering by `account_id`. 
        // This can be inefficient if you have thousands of stake records. 
        // A more advanced approach: keep a map of user->set_of_farm_ids.
        
        let mut results = Vec::new();
        let mut count = 0;
        let mut skipped = 0;

        // This example just does a linear iteration, 
        // which is not very scalable on large sets. 
        for ((user, farm_id), stake_info) in self.stakes.iter() {
            if user == account_id {
                if skipped < from_index {
                    skipped += 1;
                    continue;
                }
                if count < limit {
                    let view = StakeInfoView::from((&stake_info, farm_id));
                    results.push(view);
                    count += 1;
                } else {
                    break;
                }
            }
        }
        results
    }
}