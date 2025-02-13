pub mod view;

use near_contract_standards::fungible_token::Balance;
use near_sdk::{
    env, near_bindgen, AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue,
};
use near_sdk::collections::UnorderedMap;
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use serde_json;

// Constants for gas and deposits.
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(50);
const MSG_ADD_REWARD: &str = "ADD_REWARD";
const MSG_STAKE: &str = "STAKE";

// A multiplier to track rewards with high precision.
const ACC_REWARD_MULTIPLIER: u128 = 1_000_000_000_000;

#[derive(BorshDeserialize, BorshSerialize)]
pub enum StorageKey {
    Farms,
    Stakes,
    StorageDeposits,
}

#[derive(BorshDeserialize, BorshSerialize, PartialEq, Eq, Debug, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
#[derive(Clone)]
pub enum FarmStatus {
    Active,
    Ended,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct FarmInput {
    pub staking_token: AccountId,
    pub reward_tokens: Vec<AccountId>,
    pub lockup_period_sec: u64,
    pub reward_per_session: Vec<U128>,
    pub session_interval_sec: u64,
    pub start_at_sec: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct FarmParams {
    pub staking_token: AccountId,
    pub reward_tokens: Vec<AccountId>,
    pub reward_per_session: Vec<u128>,
    pub session_interval: u64,
    pub start_time: u64,
    pub last_distribution: u64,
    pub total_staked: u128,
    /// Scaled by ACC_REWARD_MULTIPLIER.
    pub reward_per_share: Vec<u128>,
    pub lockup_period: u64,
    /// Tracks the remaining reward tokens available for distribution.
    pub remaining_reward: Vec<u128>,
    /// New field to track the farm status.
    pub status: FarmStatus,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct StakeInfo {
    pub amount: u128,
    pub lockup_end: u64,
    pub reward_debt: Vec<u128>,
    pub accrued_rewards: Vec<u128>,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct ChildFarmingContract {
    farms: UnorderedMap<u64, FarmParams>,
    stakes: UnorderedMap<(AccountId, u64), StakeInfo>,
    farm_count: u64,
    storage_deposits: UnorderedMap<AccountId, Balance>,
    admin: AccountId,
}

#[near_bindgen]
impl ChildFarmingContract {
    #[init]
    pub fn new(admin: AccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            farms: UnorderedMap::new(b"farms".to_vec()),
            stakes: UnorderedMap::new(b"stakes".to_vec()),
            farm_count: 0,
            storage_deposits: UnorderedMap::new(b"storage_deposits".to_vec()),
            admin,
        }
    }

    fn estimate_farm_storage(num_rewards: usize) -> u64 {
        let overhead = 40;
        let base_bytes = 8 + 8 + 8 + 16 + 8; 
        let reward_per_share_bytes = 16 * (num_rewards as u64);
        let reward_per_session_bytes = 16 * (num_rewards as u64);

        let staking_token_bytes = 32;
        let reward_tokens_bytes = 32 * (num_rewards as u64);

        // Additional storage for the remaining_reward vector.
        let remaining_reward_bytes = 16 * (num_rewards as u64);
        let status_bytes = 8;

        overhead
            + base_bytes
            + reward_per_share_bytes
            + reward_per_session_bytes
            + staking_token_bytes
            + reward_tokens_bytes
            + remaining_reward_bytes
            + status_bytes
    }

    fn estimate_stake_storage(num_rewards: usize) -> u64 {
        let overhead_key = 40; 
        let amount_bytes = 16;
        let lockup_end_bytes = 8;
        let reward_debt_bytes = 16 * (num_rewards as u64);
        let accrued_rewards_bytes = 16 * (num_rewards as u64);

        overhead_key
            + amount_bytes
            + lockup_end_bytes
            + reward_debt_bytes
            + accrued_rewards_bytes
    }

    fn assert_storage_sufficient(&self, user: AccountId, bytes_needed: u64) {
        let deposit = self.storage_deposits.get(&user).unwrap_or(0);
        let cost = (bytes_needed as u128) * env::storage_byte_cost().as_yoctonear();

        assert!(
            deposit >= cost,
            "Insufficient storage. Need {} more yoctoNEAR.",
            cost.saturating_sub(deposit)
        );
    }

    #[payable]
    pub fn storage_deposit(&mut self) {
        let account_id = env::predecessor_account_id();
        let attached_deposit = env::attached_deposit();
        let current = self.storage_deposits.get(&account_id).unwrap_or(0);
        self.storage_deposits.insert(&account_id, &(current + attached_deposit.as_yoctonear()));
    }

    #[payable]
    pub fn storage_withdraw(&mut self, amount: Option<U128>) {
        near_sdk::assert_one_yocto();
        let account_id = env::predecessor_account_id();
        let mut current = self.storage_deposits.get(&account_id).unwrap_or(0);
        let to_withdraw = amount.map(|v| v.0).unwrap_or(current);
        assert!(to_withdraw <= current, "Not enough storage to withdraw");

        current -= to_withdraw;
        self.storage_deposits.insert(&account_id, &current);
        Promise::new(account_id).transfer(NearToken::from_yoctonear(to_withdraw));
    }

    #[payable]
    pub fn create_farm(&mut self, input: FarmInput) -> u64 {
        let creator = env::predecessor_account_id();

        // Validate that session_interval_sec is not zero.
        assert!(
            input.session_interval_sec > 0,
            "Session interval must be greater than 0"
        );

        let num_rewards = input.reward_tokens.len();
        let required_bytes = Self::estimate_farm_storage(num_rewards);
        self.assert_storage_sufficient(creator.clone(), required_bytes);
        assert_eq!(
            num_rewards,
            input.reward_per_session.len(),
            "Must provide reward_per_session for each reward token"
        );

        let lockup_ns = input.lockup_period_sec * 1_000_000_000;
        let interval_ns = input.session_interval_sec * 1_000_000_000;
        let start_ns = input.start_at_sec * 1_000_000_000;

        let farm_id = self.farm_count;
        self.farm_count += 1;

        let initial_dist = if input.start_at_sec == 0 {
            env::block_timestamp()
        } else {
            start_ns
        };

        let mut rps = Vec::with_capacity(num_rewards);
        for _ in 0..num_rewards {
            rps.push(0_u128);
        }

        let mut rpsession_values = vec![];
        for x in &input.reward_per_session {
            rpsession_values.push(x.0);
        }

        // Initially, the remaining reward pool is zero; rewards must be funded via ADD_REWARD.
        let remaining_reward = vec![0_u128; num_rewards];

        let farm = FarmParams {
            staking_token: input.staking_token,
            reward_tokens: input.reward_tokens,
            reward_per_session: rpsession_values,
            session_interval: interval_ns,
            start_time: start_ns,
            last_distribution: initial_dist,
            total_staked: 0,
            reward_per_share: rps,
            lockup_period: lockup_ns,
            remaining_reward,
            status: FarmStatus::Active,
        };

        self.farms.insert(&farm_id, &farm);

        env::log_str(
            format!(
                "Created farm {} with session_interval_sec: {}, reward_per_session: {:?}",
                farm_id, input.session_interval_sec, input.reward_per_session
            )
            .as_str()
        );

        farm_id
    }

    /// Internal method to update this farm’s distribution 
    /// based on how many sessions have elapsed.
    fn update_farm(&mut self, farm_id: u64) {
        let mut farm = self.farms.get(&farm_id).expect("Farm not found");
        let current_time = env::block_timestamp();

        // Do not update if the farm already ended.
        if farm.status == FarmStatus::Ended {
            self.farms.insert(&farm_id, &farm);
            return;
        }

        if current_time < farm.start_time {
            // not started yet
            self.farms.insert(&farm_id, &farm);
            return;
        }

        if farm.total_staked == 0 {
            // no stakers => no distribution
            farm.last_distribution = current_time;
            self.farms.insert(&farm_id, &farm);
            return;
        }

        let elapsed = current_time.saturating_sub(farm.last_distribution);
        let sessions_elapsed = elapsed / farm.session_interval;
        if sessions_elapsed == 0 {
            self.farms.insert(&farm_id, &farm);
            return;
        }

        for i in 0..farm.reward_tokens.len() {
            // Calculate how many tokens should be distributed for these sessions.
            let potential_reward = (sessions_elapsed as u128).saturating_mul(farm.reward_per_session[i]);
            // Only distribute up to the available reward tokens.
            let reward_to_distribute = if potential_reward > farm.remaining_reward[i] {
                farm.remaining_reward[i]
            } else {
                potential_reward
            };
            if reward_to_distribute > 0 {
                // Use the multiplier to update reward per share.
                let inc = reward_to_distribute.saturating_mul(ACC_REWARD_MULTIPLIER) / farm.total_staked;
                farm.reward_per_share[i] = farm.reward_per_share[i].saturating_add(inc);
                // Deduct the distributed reward from the remaining pool.
                farm.remaining_reward[i] = farm.remaining_reward[i].saturating_sub(reward_to_distribute);
            }
        }

        let dist_ns = sessions_elapsed * farm.session_interval;
        farm.last_distribution = farm.last_distribution.saturating_add(dist_ns);
        if farm.last_distribution > current_time {
            farm.last_distribution = current_time;
        }

        // If all reward pools are empty, mark the farm as ended.
        if farm.remaining_reward.iter().all(|&r| r == 0) {
            farm.status = FarmStatus::Ended;
            env::log_str(format!("Farm {} has ended due to exhausted rewards.", farm_id).as_str());
        }

        self.farms.insert(&farm_id, &farm);
    }

    #[payable]
    pub fn ft_on_transfer(
        &mut self,
        sender_id:  AccountId,
        amount: U128,
        msg: String
    ) -> PromiseOrValue<U128> {
        let token_in = env::predecessor_account_id(); 
        let sender = sender_id.into();

        let parts: Vec<&str> = msg.split(':').collect();
        if parts.len() < 2 {
            // unknown message => we reject by returning the amount
            return PromiseOrValue::Value(amount);
        }
        let action = parts[0];
        let farm_id: u64 = parts[1].parse().expect("Invalid farm_id in ft_on_transfer");

        match action {
            MSG_STAKE => {
                self.stake_tokens(farm_id, token_in, amount.0, &sender);
                PromiseOrValue::Value(U128(0))
            }
            MSG_ADD_REWARD => {
                self.add_reward(farm_id, token_in, amount.0, &sender);
                PromiseOrValue::Value(U128(0))
            }
            _ => PromiseOrValue::Value(amount),
        }
    }

    /// Updates the reward pool for a farm.
    fn add_reward(&mut self, farm_id: u64, token_in: AccountId, amount: u128, sender: &AccountId) {
        let mut farm = self.farms.get(&farm_id).expect("Farm not found");
        let pos = farm.reward_tokens.iter().position(|t| t == &token_in)
            .expect("This token is not a valid reward token for the farm.");
        // Add the incoming reward tokens to the reward pool.
        farm.remaining_reward[pos] = farm.remaining_reward[pos].saturating_add(amount);
        self.farms.insert(&farm_id, &farm);
        env::log_str(
            format!(
                "User {} added {} tokens as reward to farm {}",
                sender, amount, farm_id
            )
            .as_str(),
        );
    }

    fn simulate_update_farm(&self, farm: &FarmParams) -> FarmParams {
        let mut sim = farm.clone();
        let current_time = env::block_timestamp();
        if current_time >= sim.start_time && sim.total_staked > 0 {
            let elapsed = current_time.saturating_sub(sim.last_distribution);
            let sessions_elapsed = elapsed / sim.session_interval;
            if sessions_elapsed > 0 {
                for i in 0..sim.reward_tokens.len() {
                    let potential_reward = (sessions_elapsed as u128)
                        .saturating_mul(sim.reward_per_session[i]);
                    let reward_to_distribute = if potential_reward > sim.remaining_reward[i] {
                        sim.remaining_reward[i]
                    } else {
                        potential_reward
                    };
                    if reward_to_distribute > 0 {
                        let inc = reward_to_distribute
                            .saturating_mul(ACC_REWARD_MULTIPLIER)
                            / sim.total_staked;
                        sim.reward_per_share[i] = sim.reward_per_share[i].saturating_add(inc);
                        sim.remaining_reward[i] = sim.remaining_reward[i].saturating_sub(reward_to_distribute);
                    }
                }
                let dist_ns = sessions_elapsed * sim.session_interval;
                sim.last_distribution = sim.last_distribution.saturating_add(dist_ns);
                if sim.last_distribution > current_time {
                    sim.last_distribution = current_time;
                }
                if sim.remaining_reward.iter().all(|&r| r == 0) {
                    sim.status = FarmStatus::Ended;
                }
            }
        }
        sim
    }

    fn stake_tokens(&mut self, farm_id: u64, token_in: AccountId, amount: u128, sender: &AccountId) {
        let mut farm = self.farms.get(&farm_id).expect("Farm not found");

        // Reject staking if the farm is ended.
        assert_eq!(farm.status, FarmStatus::Active, "Farm is ended, staking not allowed");

        assert_eq!(farm.staking_token, token_in, "Not the correct staking token");
        let stake_key = (sender.clone(), farm_id);
        if self.stakes.get(&stake_key).is_none() {
            let required_bytes = Self::estimate_stake_storage(farm.reward_tokens.len());
            self.assert_storage_sufficient(sender.clone(), required_bytes);
        }

        self.update_farm(farm_id);

        // Either create or load existing stake.
        let mut stake_info = self
            .stakes
            .get(&stake_key)
            .unwrap_or_else(|| StakeInfo {
                amount: 0,
                lockup_end: env::block_timestamp() + farm.lockup_period,
                reward_debt: vec![0; farm.reward_tokens.len()],
                accrued_rewards: vec![0; farm.reward_tokens.len()],
            });

            // Settle any pending rewards.
        for i in 0..farm.reward_tokens.len() {
            let pending = self.calculate_pending(&farm, &stake_info, i);
            if pending > 0 {
                stake_info.accrued_rewards[i] =
                    stake_info.accrued_rewards[i].saturating_add(pending);
            }
            stake_info.reward_debt[i] = farm.reward_per_share[i];
        }

        // Increase staked amount.
        stake_info.amount = stake_info.amount.saturating_add(amount);

        // Optionally extend lockup.
        let new_lockup = env::block_timestamp() + farm.lockup_period;
        if new_lockup > stake_info.lockup_end {
            stake_info.lockup_end = new_lockup;
        }

        farm.total_staked = farm.total_staked.saturating_add(amount);

        self.stakes.insert(&stake_key, &stake_info);
        self.farms.insert(&farm_id, &farm);

        env::log_str(
            format!(
                "User {} staked {} of token {} in farm {}",
                sender, amount, token_in, farm_id
            )
            .as_str(),
        );
    }

    /// Calculates the pending reward for a given reward token index.
    fn calculate_pending(&self, farm: &FarmParams, stake_info: &StakeInfo, i: usize) -> u128 {
        let diff = farm.reward_per_share[i].saturating_sub(stake_info.reward_debt[i]);
        // Unscale the pending reward.
        stake_info.amount.saturating_mul(diff) / ACC_REWARD_MULTIPLIER
    }

    #[payable]
    pub fn claim_rewards(&mut self, farm_id: u64) {
        near_sdk::assert_one_yocto();
        let user = env::predecessor_account_id();
        self.update_farm(farm_id);

        let farm = self.farms.get(&farm_id).expect("Farm not found");
        let stake_key = (user.clone(), farm_id);
        let mut stake_info = self.stakes.get(&stake_key).expect("No stake found");

        for i in 0..farm.reward_tokens.len() {
            let pending = self.calculate_pending(&farm, &stake_info, i);
            if pending > 0 {
                stake_info.accrued_rewards[i] = stake_info.accrued_rewards[i].saturating_add(pending);
            }
            stake_info.reward_debt[i] = farm.reward_per_share[i];
        }

        // Cross-contract transfer each accrued reward.
        for i in 0..farm.reward_tokens.len() {
            let amount = stake_info.accrued_rewards[i];
            if amount > 0 {
                stake_info.accrued_rewards[i] = 0;
                let reward_token = farm.reward_tokens[i].clone();
                Promise::new(reward_token).function_call(
                    "ft_transfer".to_string().into(),
                    near_sdk::serde_json::to_vec(&serde_json::json!({
                        "receiver_id": user,
                        "amount": U128(amount),
                    }))
                    .unwrap(),
                    NearToken::from_yoctonear(1),
                    GAS_FOR_FT_TRANSFER,
                );
            }
        }

        self.stakes.insert(&stake_key, &stake_info);

        env::log_str(
            format!("User {} claimed all rewards in farm {}", user, farm_id).as_str(),
        );
    }

    #[payable]
    pub fn withdraw(&mut self, farm_id: u64, amount: U128) {
        near_sdk::assert_one_yocto();
        let user = env::predecessor_account_id();
        let to_withdraw = amount.0;

        let mut farm = self.farms.get(&farm_id).expect("Farm not found");
        let stake_key = (user.clone(), farm_id);
        let mut stake_info = self.stakes.get(&stake_key).expect("No stake found");

        assert!(
            env::block_timestamp() >= stake_info.lockup_end,
            "Lockup period not expired"
        );
        assert!(stake_info.amount >= to_withdraw, "Insufficient staked balance");

        self.update_farm(farm_id);

        // Settle pending rewards.
        for i in 0..farm.reward_tokens.len() {
            let pending = self.calculate_pending(&farm, &stake_info, i);
            if pending > 0 {
                stake_info.accrued_rewards[i] = stake_info.accrued_rewards[i].saturating_add(pending);
            }
            stake_info.reward_debt[i] = farm.reward_per_share[i];
        }

        stake_info.amount = stake_info.amount.saturating_sub(to_withdraw);
        farm.total_staked = farm.total_staked.saturating_sub(to_withdraw);

        if stake_info.amount == 0 {
            self.stakes.remove(&stake_key);
        } else {
            self.stakes.insert(&stake_key, &stake_info);
        }
        self.farms.insert(&farm_id, &farm);

        // Cross-contract ft_transfer of staking tokens.
        let staking_token_id = farm.staking_token.clone();
        Promise::new(staking_token_id).function_call(
            "ft_transfer".to_string().into(),
            near_sdk::serde_json::to_vec(&serde_json::json!({
                "receiver_id": user,
                "amount": U128(to_withdraw),
            }))
            .unwrap(),
            NearToken::from_yoctonear(1),
            GAS_FOR_FT_TRANSFER,
        );

        env::log_str(
            format!(
                "User {} withdrew {} staked tokens from farm {}",
                user, to_withdraw, farm_id
            ).as_str()
        );
    }
}

//------------------------------------
//            TESTS
//------------------------------------
#[cfg(test)]
mod tests {
    use near_sdk::test_utils::accounts;
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use core::convert::TryFrom;
    use near_sdk::testing_env;

    fn get_context(
        predecessor: AccountId,
        block_timestamp_nanos: u64,
        attached_deposit: u128,
    ) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .predecessor_account_id(predecessor)
            .block_timestamp(block_timestamp_nanos)
            .attached_deposit(NearToken::from_yoctonear(attached_deposit));
        builder
    }

    #[test]
    fn test_storage_deposit_and_create_farm() {
        let mut context = get_context(accounts(0), 0, 0);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());

        // deposit 10 NEAR for storage
        context = get_context(accounts(0), 0, 10_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        contract.storage_deposit();

        // create farm with 1 reward token => should pass
        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 60,
            reward_per_session: vec![U128(100)],
            session_interval_sec: 10,
            start_at_sec: 0,
        };
        let farm_id = contract.create_farm(input);
        assert_eq!(farm_id, 0);

        // check stored
        let farm = contract.farms.get(&0).unwrap();
        assert_eq!(farm.staking_token, "staking.token");
        assert_eq!(farm.reward_tokens.len(), 1);
        assert_eq!(farm.status, FarmStatus::Active);
    }

    /// Should panic if user has no storage deposit
    #[test]
    #[should_panic(expected = "Insufficient storage. Need")]
    fn test_create_farm_insufficient_storage() {
        let context = get_context(accounts(0), 0, 0);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());

        let input = FarmInput {
            staking_token: "token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 30,
            reward_per_session: vec![U128(10)],
            session_interval_sec: 5,
            start_at_sec: 0,
        };
        // no deposit => create_farm fails
        contract.create_farm(input);
    }

    #[test]
    #[should_panic(expected = "Insufficient storage. Need")]
    fn test_create_farm_insufficient_storage_multitoken() {
        let context = get_context(accounts(0), 0, 1);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();

        // tries to create a farm with 2 reward tokens 
        // => we likely need more deposit
        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward1.token".parse().unwrap(), "reward2.token".parse().unwrap()],
            lockup_period_sec: 60,
            reward_per_session: vec![U128(100), U128(200)],
            session_interval_sec: 10,
            start_at_sec: 0,
        };
        contract.create_farm(input);
    }

    /// Test staking via ft_on_transfer
    #[test]
    fn test_staking_flow() {
        let mut context = get_context(accounts(0), 0, 10_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();

        // create farm
        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 10,
            reward_per_session: vec![U128(100)],
            session_interval_sec: 5,
            start_at_sec: 0,
        };
        let farm_id = contract.create_farm(input);

        // call ft_on_transfer from "staking.token"
        let msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(), 
            U128(500), 
            msg
        );

        // check user stake
        let stake_key = (accounts(0), farm_id);
        let stake_info = contract.stakes.get(&stake_key).unwrap();
        assert_eq!(stake_info.amount, 500);
    }

    #[test]
    #[should_panic(expected = "Insufficient storage. Need")]
    fn test_stake_insufficient_storage() {
        // 1) Setup contract & deposit enough for farm creation
        let context = get_context(accounts(0), 0, 10_u128.pow(24)); // 1 NEAR
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit(); // now user(0) can create a farm

        // create farm
        let farm_id = contract.create_farm(FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 10,
            reward_per_session: vec![U128(100)],
            session_interval_sec: 5,
            start_at_sec: 0,
        });

        // 2) Now reset context for the same user or a different user but with minimal deposit
        //    e.g. user has 0 deposit. 
        let new_ctx = get_context("staking.token".parse().unwrap(), 0, 1); 
        testing_env!(new_ctx.build());
        // staker calls ft_on_transfer with no deposit in `storage_deposits`.
        let msg = format!("STAKE:{}", farm_id);
        contract.ft_on_transfer(
            AccountId::try_from(accounts(1)).unwrap(),
            U128(100), 
            msg
        );
    }

    /// Test adding reward tokens
    #[test]
    fn test_add_reward() {
        let mut context = get_context(accounts(0), 0, 10_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();

        // create farm
        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 0,
            reward_per_session: vec![U128(100)],
            session_interval_sec: 5,
            start_at_sec: 0,
        };
        let farm_id = contract.create_farm(input);

        // add reward
        let msg = format!("ADD_REWARD:{}", farm_id);
        context = get_context("reward.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(), 
            U128(10_000), 
            msg
        );
        // no direct checks here
        assert!(true);
    }

    #[test]
    fn test_session_based_distribution() {
        let mut context = get_context(accounts(0), 0, 10_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();

        // create farm: interval=10s, reward_per_session=100
        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 0,
            reward_per_session: vec![U128(100)],
            session_interval_sec: 10,
            start_at_sec: 0,
        };
        let farm_id = contract.create_farm(input);

        // Fund the farm with enough reward tokens for 2 sessions.
        let add_reward_msg = "ADD_REWARD:0".to_string();
        context = get_context("reward.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        // For 2 sessions, we need 2 * 100 = 200 tokens.
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(),
             U128(200), 
             add_reward_msg
            );

        // stake 100 tokens
        let msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(), 
            U128(100), 
            msg
        );

        // move time forward => 25s => 2 sessions have elapsed.
        context = get_context(accounts(0), 25_000_000_000, 1);
        testing_env!(context.build());
        contract.claim_rewards(farm_id);

        let farm = contract.farms.get(&farm_id).unwrap();
        // With 2 sessions and 100 tokens per session distributed over 100 staked tokens,
        // the raw reward_per_share should have increased by 2 * ACC_REWARD_MULTIPLIER.
        // We check the unscaled value.
        assert_eq!(farm.reward_per_share[0] / ACC_REWARD_MULTIPLIER, 2);

        // after claim => accrued rewards should be 0.
        let stake_key = (accounts(0), farm_id);
        let stake_info = contract.stakes.get(&stake_key).unwrap();
        assert_eq!(stake_info.accrued_rewards[0], 0);
    }

    #[test]
    #[should_panic(expected = "Lockup period not expired")]
    fn test_withdraw_lockup_fail() {
        let mut context = get_context(accounts(0), 0, 10_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();

        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 2,
            reward_per_session: vec![U128(10)],
            session_interval_sec: 5,
            start_at_sec: 0,
        };
        let farm_id = contract.create_farm(input);

        // stake tokens
        let msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(), 
            U128(100), 
            msg
        );

        // at t=1s => withdraw should fail due to lockup.
        context = get_context(accounts(0), 1_000_000_000, 1);
        testing_env!(context.build());
        contract.withdraw(farm_id, U128(50));
    }

    #[test]
    fn test_withdraw_lockup_success() {
        let mut context = get_context(accounts(0), 0, 10_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();

        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 2,
            reward_per_session: vec![U128(10)],
            session_interval_sec: 5,
            start_at_sec: 0,
        };
        let farm_id = contract.create_farm(input);

        // stake tokens
        let msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(),
            U128(100), 
            msg
        );

        // at t=1s => still locked
        context = get_context(accounts(0), 1_000_000_000, 0);
        testing_env!(context.build());

        // now at t=3s (beyond lockup) => withdraw half.
        context = get_context(accounts(0), 3_000_000_000, 1);
        testing_env!(context.build());
        contract.withdraw(farm_id, U128(50));

        let stake_key = (accounts(0), farm_id);
        let stake_info = contract.stakes.get(&stake_key).unwrap();
        // withdrew half, leaving 50 staked.
        assert_eq!(stake_info.amount, 50);
    }

    #[test]
    fn test_future_start_time() {
        let mut context = get_context(accounts(0), 0, 10_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();

        // Create a farm that starts at sec=100.
        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 0,
            reward_per_session: vec![U128(10)],
            session_interval_sec: 5,
            start_at_sec: 100,
        };
        let farm_id = contract.create_farm(input);

        // Stake at time=0.
        let msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(),
            U128(100), 
             msg
        );

        // Advance time to 50 seconds => still before the start time.
        context = get_context(accounts(0), 50_000_000_000, 1);
        testing_env!(context.build());
        contract.claim_rewards(farm_id);

        let farm = contract.farms.get(&farm_id).unwrap();
        // No sessions have elapsed so reward_per_share should be 0.
        assert_eq!(farm.reward_per_share[0], 0);
    }

    #[test]
    #[should_panic(expected = "Farm is ended, staking not allowed")]
    fn test_stake_on_ended_farm() {
        // Set up contract and deposit storage for accounts(0) and accounts(1).
        let deposit = 1_000_000_000_000_000_000_000_000;
        let mut context = get_context(accounts(0), 0, deposit);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();
        // Also deposit storage for accounts(1).
        context = get_context(accounts(1), 0, deposit);
        testing_env!(context.build());
        contract.storage_deposit();
        // Create a farm.
        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 10,
            reward_per_session: vec![U128(100)],
            session_interval_sec: 5,
            start_at_sec: 0,
        };
        let farm_id = contract.create_farm(input);
        // Fund the farm with 50 tokens (insufficient for one full session).
        let add_reward_msg = "ADD_REWARD:0".to_string();
        context = get_context("reward.token".parse().unwrap(), 0, 1);
        testing_env!(context.build());
        contract.ft_on_transfer(AccountId::try_from(accounts(0)).unwrap(), U128(50), add_reward_msg);
        let stake_msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 1);
        testing_env!(context.build());
        contract.ft_on_transfer(AccountId::try_from(accounts(0)).unwrap(), U128(100), stake_msg.clone());
        context = get_context(accounts(0), 10_000_000_000, 1);
        testing_env!(context.build());
        contract.claim_rewards(farm_id);
        context = get_context("staking.token".parse().unwrap(), 10_000_000_000, 1);
        testing_env!(context.build());
        contract.ft_on_transfer(AccountId::try_from(accounts(1)).unwrap(), U128(50), stake_msg);
    }
}
