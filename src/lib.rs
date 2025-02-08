use near_contract_standards::fungible_token::Balance;
use near_sdk::{
    env, near_bindgen, AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue};
use near_sdk::collections::UnorderedMap;
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

const NO_DEPOSIT: NearToken = NearToken::from_yoctonear(0);
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(50);
const MSG_ADD_REWARD: &str = "ADD_REWARD";
const MSG_STAKE: &str = "STAKE";

#[derive(BorshDeserialize, BorshSerialize)]
pub enum StorageKey {
    Farms,
    Stakes,
    StorageDeposits,
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
    pub reward_per_share: Vec<u128>,
    pub lockup_period: u64,
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
    admin: AccountId
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
            admin
        }
    }

    fn estimate_farm_storage(num_rewards: usize) -> u64 {
        let overhead = 40;
        let base_bytes = 8 + 8 + 8 + 16 + 8; 
        let reward_per_share_bytes = 16 * (num_rewards as u64);
        let reward_per_session_bytes = 16 * (num_rewards as u64);

        let staking_token_bytes = 32;
        let reward_tokens_bytes = 32 * (num_rewards as u64);

        overhead
            + base_bytes
            + reward_per_share_bytes
            + reward_per_session_bytes
            + staking_token_bytes
            + reward_tokens_bytes
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
        };

        self.farms.insert(&farm_id, &farm);

        env::log_str(
            format!(
                "Created farm {} with session_interval_sec: {}, reward_per_session: {:?}",
                farm_id, input.session_interval_sec, input.reward_per_session
            ).as_str()
        );

        farm_id
    }

    /// Internal method to update this farm’s distribution 
    /// based on how many sessions have elapsed.
    fn update_farm(&mut self, farm_id: u64) {
        let mut farm = self.farms.get(&farm_id).expect("Farm not found");
        let current_time = env::block_timestamp();

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
            // not enough time for a full session
            self.farms.insert(&farm_id, &farm);
            return;
        }

        for i in 0..farm.reward_tokens.len() {
            let total_reward = (sessions_elapsed as u128)
                .saturating_mul(farm.reward_per_session[i]);
            if total_reward > 0 {
                let inc = total_reward / farm.total_staked;
                farm.reward_per_share[i] = farm.reward_per_share[i].saturating_add(inc);
            }
        }

        let dist_ns = sessions_elapsed * farm.session_interval;
        farm.last_distribution = farm.last_distribution.saturating_add(dist_ns);
        if farm.last_distribution > current_time {
            farm.last_distribution = current_time;
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

    fn add_reward(&mut self, farm_id: u64, token_in: AccountId, amount: u128, sender: &AccountId) {
        let farm = self.farms.get(&farm_id).expect("Farm not found");
        let pos = farm.reward_tokens.iter().position(|t| t == &token_in);
        if pos.is_none() {
            env::panic_str("This token is not a valid reward token for the farm.");
        }
        env::log_str(
            format!(
                "User {} added {} tokens as reward to farm {}",
                sender, amount, farm_id
            )
            .as_str(),
        );
    }

    fn stake_tokens(&mut self, farm_id: u64, token_in: AccountId, amount: u128, sender: &AccountId) {
        let mut farm = self.farms.get(&farm_id).expect("Farm not found");
        assert_eq!(farm.staking_token, token_in, "Not the correct staking token");
        let stake_key = (sender.clone(), farm_id);
        if self.stakes.get(&stake_key).is_none() {
            let required_bytes = Self::estimate_stake_storage(farm.reward_tokens.len());
            self.assert_storage_sufficient(sender.clone(), required_bytes);
        }

        self.update_farm(farm_id);

        // either create or load existing stake
        let mut stake_info = self
            .stakes
            .get(&stake_key)
            .unwrap_or_else(|| StakeInfo {
                amount: 0,
                lockup_end: env::block_timestamp() + farm.lockup_period,
                reward_debt: vec![0; farm.reward_tokens.len()],
                accrued_rewards: vec![0; farm.reward_tokens.len()],
            });

        // settle existing pending
        for i in 0..farm.reward_tokens.len() {
            let pending = self.calculate_pending(&farm, &stake_info, i);
            if pending > 0 {
                stake_info.accrued_rewards[i] =
                    stake_info.accrued_rewards[i].saturating_add(pending);
            }
            stake_info.reward_debt[i] = farm.reward_per_share[i];
        }

        // increase staked
        stake_info.amount = stake_info.amount.saturating_add(amount);

        // optionally extend lockup
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

    fn calculate_pending(&self, farm: &FarmParams, stake_info: &StakeInfo, i: usize) -> u128 {
        let rps_now = farm.reward_per_share[i];
        let rps_debt = stake_info.reward_debt[i];
        let diff = rps_now.saturating_sub(rps_debt);
        stake_info.amount.saturating_mul(diff)
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

        // Cross-contract transfer each accrued reward
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
                    NO_DEPOSIT,
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

        // settle new pending
        for i in 0..farm.reward_tokens.len() {
            let pending = self.calculate_pending(&farm, &stake_info, i);
            if pending > 0 {
                stake_info.accrued_rewards[i] =
                    stake_info.accrued_rewards[i].saturating_add(pending);
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

        // cross-contract ft_transfer
        let staking_token_id = farm.staking_token.clone();
        Promise::new(staking_token_id).function_call(
            "ft_transfer".to_string().into(),
            near_sdk::serde_json::to_vec(&serde_json::json!({
                "receiver_id": user,
                "amount": U128(to_withdraw),
            }))
            .unwrap(),
            NO_DEPOSIT,
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
            AccountId::try_from(accounts(1)).unwrap(), // or still accounts(0)
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

        // stake 100
        let msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(),
            U128(100),
            msg
        );

        // move time forward => 25s => 2 sessions
        context = get_context(accounts(0), 25_000_000_000, 1);
        testing_env!(context.build());
        contract.claim_rewards(farm_id);

        let farm = contract.farms.get(&farm_id).unwrap();
        // 2 sessions => total=200 => reward_per_share=200/100=2
        assert_eq!(farm.reward_per_share[0], 2);

        // after claim => accrued=0
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

        // stake
        let msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(),
            U128(100),
            msg
        );

        // at t=1s => fail
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

        // stake
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

        // now t=3s => beyond lockup
        context = get_context(accounts(0), 3_000_000_000, 1);
        testing_env!(context.build());
        contract.withdraw(farm_id, U128(50));

        let stake_key = (accounts(0), farm_id);
        let stake_info = contract.stakes.get(&stake_key).unwrap();
        // withdrew half
        assert_eq!(stake_info.amount, 50);
    }

    #[test]
    fn test_future_start_time() {
        let mut context = get_context(accounts(0), 0, 10_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        let mut contract = ChildFarmingContract::new("owner.testnet".parse().unwrap());
        contract.storage_deposit();

        // farm that starts at sec=100
        let input = FarmInput {
            staking_token: "staking.token".parse().unwrap(),
            reward_tokens: vec!["reward.token".parse().unwrap()],
            lockup_period_sec: 0,
            reward_per_session: vec![U128(10)],
            session_interval_sec: 5,
            start_at_sec: 100,
        };
        let farm_id = contract.create_farm(input);

        // stake at time=0
        let msg = "STAKE:0".to_string();
        context = get_context("staking.token".parse().unwrap(), 0, 0);
        testing_env!(context.build());
        contract.ft_on_transfer(
            AccountId::try_from(accounts(0)).unwrap(),
            U128(100),
            msg
        );

        // time => 50 => still before start(=100)
        context = get_context(accounts(0), 50_000_000_000, 1);
        testing_env!(context.build());
        contract.claim_rewards(farm_id);

        let farm = contract.farms.get(&farm_id).unwrap();
        // no sessions => reward_per_share=0
        assert_eq!(farm.reward_per_share[0], 0);
    }
}