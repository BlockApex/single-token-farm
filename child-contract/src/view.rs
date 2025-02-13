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
    pub status: FarmStatus,
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
            status: farm.status.clone(),
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
    pub reward_tokens: Vec<AccountId>,
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
        if let Some(info) = self.stakes.get(&key) {
            if let Some(farm) = self.farms.get(&farm_id) {
                let sim_farm = self.simulate_update_farm(&farm);
                // Compute pending rewards per reward token:
                let updated_accrued: Vec<U128> = info.accrued_rewards
                    .iter()
                    .enumerate()
                    .map(|(i, &val)| {
                        let pending = info.amount
                            .saturating_mul(sim_farm.reward_per_share[i].saturating_sub(info.reward_debt[i]))
                            / ACC_REWARD_MULTIPLIER;
                        U128(val.saturating_add(pending))
                    })
                    .collect();
                return Some(StakeInfoView {
                    farm_id,
                    amount: U128(info.amount),
                    lockup_end_sec: info.lockup_end / 1_000_000_000,
                    reward_debt: info.reward_debt.iter().map(|v| U128(*v)).collect(),
                    accrued_rewards: updated_accrued,
                    reward_tokens: farm.reward_tokens.clone(),
                });
            }
        }
        None
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
                    if let Some(farm) = self.farms.get(&farm_id) {
                        let sim_farm = self.simulate_update_farm(&farm);
                        let updated_accrued: Vec<U128> = stake_info
                            .accrued_rewards
                            .iter()
                            .enumerate()
                            .map(|(i, &val)| {
                                let pending = stake_info.amount
                                    .saturating_mul(sim_farm.reward_per_share[i].saturating_sub(stake_info.reward_debt[i]))
                                    / ACC_REWARD_MULTIPLIER;
                                U128(val.saturating_add(pending))
                            })
                            .collect();
                        results.push(StakeInfoView {
                            farm_id,
                            amount: U128(stake_info.amount),
                            lockup_end_sec: stake_info.lockup_end / 1_000_000_000,
                            reward_debt: stake_info.reward_debt.iter().map(|v| U128(*v)).collect(),
                            accrued_rewards: updated_accrued,
                            reward_tokens: farm.reward_tokens.clone(),
                        });
                        count += 1;
                    }
                } else {
                    break;
                }
            }
        }
        results
    }
}