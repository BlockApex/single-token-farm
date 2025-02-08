use crate::*;
use near_sdk::{
    near_bindgen,
    serde::{Deserialize, Serialize},
    json_types::U128,
};

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct FarmView {
    pub farm_id: u64,
    pub staking_token: AccountId,
    pub reward_tokens: Vec<AccountId>,
    pub reward_per_session: Vec<U128>,
    pub session_interval_sec: u64,
    pub start_at_sec: u64,
    pub last_distribution_sec: u64,
    pub total_staked: U128,
    pub reward_per_share: Vec<U128>,
    pub lockup_period_sec: u64,
}

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

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct StakeInfoView {
    pub farm_id: u64,
    pub amount: U128,
    pub lockup_end_sec: u64,
    pub reward_debt: Vec<U128>,
    pub accrued_rewards: Vec<U128>,
}

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

    pub fn get_farm(&self, farm_id: u64) -> Option<FarmView> {
        self.farms
            .get(&farm_id)
            .map(|farm| FarmView::from((&farm, farm_id)))
    }

    pub fn get_stake_info(
        &self, 
        account_id: AccountId, 
        farm_id: u64
    ) -> Option<StakeInfoView> {
        let key = (account_id, farm_id);
        self.stakes.get(&key).map(|info| StakeInfoView::from((&info, farm_id)))
    }

    pub fn list_stakes_by_user(
        &self, 
        account_id: String, 
        from_index: u64, 
        limit: u64
    ) -> Vec<StakeInfoView> {
        let mut results = Vec::new();
        let mut count = 0;
        let mut skipped = 0;
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