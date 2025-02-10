use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize}, collections::UnorderedMap, env, ext_contract, near_bindgen, AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseResult
};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};


#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Debug, PartialEq, Eq, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum ChildContractType {
    Farming,
    NFT,
    LP,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct ChildContractMetadata {
    pub contract_type: ChildContractType,
    pub deployed_at: u64,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct MasterContract {
    child_contracts: UnorderedMap<AccountId, ChildContractMetadata>,
    owner: AccountId,
}

#[near_bindgen]
impl MasterContract {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            child_contracts: UnorderedMap::new(b"childs".to_vec()),
            owner,
        }
    }

    /// **(Owner-only)** Register an already-deployed child contract.
    /// This is useful if the child contract was deployed externally.
    pub fn register_child_contract(&mut self, child_account_id: AccountId, contract_type: ChildContractType) {
        self.assert_owner();
        let metadata = ChildContractMetadata {
            contract_type: contract_type.clone(),
            deployed_at: env::block_timestamp(),
        };
        self.child_contracts.insert(&child_account_id, &metadata);
        env::log_str(
            format!(
                "Registered child contract: {} with type {:?}",
                child_account_id, contract_type
            )
            .as_str(),
        );
    }

    /// **(Owner-only)** Unregister a child contract.
    pub fn unregister_child_contract(&mut self, child_account_id: AccountId) {
        self.assert_owner();
        self.child_contracts.remove(&child_account_id);
        env::log_str(format!("Unregistered child contract: {}", child_account_id).as_str());
    }

    /// Returns a list of all registered child contracts (account and metadata).
    pub fn list_child_contracts(&self) -> Vec<(AccountId, ChildContractMetadata)> {
        self.child_contracts.iter().collect()
    }

    /// A generic method to call a function on a child contract.
    /// You must supply:
    /// - the child contract account id,
    /// - the method name,
    /// - the arguments (as serialized bytes),
    /// - the deposit (as U128),
    /// - and the amount of gas.
    pub fn call_child_contract(
        &self,
        child_account_id: AccountId,
        method_name: String,
        args: Vec<u8>,
        deposit: NearToken,
        gas: Gas,
    ) -> Promise {
        Promise::new(child_account_id).function_call(
            method_name,
            args,
            deposit,
            gas,
        )
    }

    pub fn call_create_farm(
        &self,
        child_account_id: AccountId,
        staking_token: AccountId,
        reward_tokens: Vec<AccountId>,
        lockup_period_sec: u64,
        reward_per_session: Vec<U128>,
        session_interval_sec: u64,
        start_at_sec: u64,
        attached_deposit: NearToken,
    ) -> Promise {
        // Build the JSON arguments expected by the child contract's create_farm.
        let args = near_sdk::serde_json::json!({
            "staking_token": staking_token,
            "reward_tokens": reward_tokens,
            "lockup_period_sec": lockup_period_sec,
            "reward_per_session": reward_per_session,
            "session_interval_sec": session_interval_sec,
            "start_at_sec": start_at_sec,
        });
        let args_vec = near_sdk::serde_json::to_vec(&args).unwrap();

        // Specify the gas to be attached; you can adjust this value as needed.
        let gas_amount = Gas::from_tgas(50);

        Promise::new(child_account_id).function_call(
            "create_farm".to_string(),
            args_vec,
            attached_deposit,
            gas_amount,
        )
    }

    /// **(Owner-only) [Advanced Option]**
    /// Deploy a new child contract to a sub-account and register it.
    ///
    /// In this example you provide:
    /// - the sub-account id (which will be the new child contract),
    /// - the contract type,
    /// - the WASM code for the child contract,
    /// - and an initial balance to fund the new account.
    ///
    /// After the deployment, a callback (`on_child_deploy`) is executed to
    /// register the new child contract.
    #[payable]
    pub fn deploy_child_contract(
        &mut self,
        child_account_id: AccountId,
        contract_type: ChildContractType,
        child_contract_wasm: Vec<u8>,
        initial_balance: NearToken,
    ) -> Promise {
        self.assert_owner();
        // Create a new account for the child contract, fund it, and deploy the given WASM code.
        Promise::new(child_account_id.clone())
            .create_account()
            .transfer(initial_balance)
            .deploy_contract(child_contract_wasm)
            .then(
                // After deployment, call our private callback to register the child contract.
                Self::ext(env::current_account_id())
                    .with_static_gas(Gas::from_tgas(10))
                    .on_child_deploy(child_account_id, contract_type)
            )
    }

    /// Private callback after deploying a child contract.
    #[private]
    pub fn on_child_deploy(&mut self, child_account_id: AccountId, contract_type: ChildContractType) {
        assert_eq!(
            env::promise_results_count(),
            1,
            "Expected one promise result."
        );
        match env::promise_result(0) {
            PromiseResult::Successful(_) => {
                self.register_child_contract(child_account_id, contract_type);
                env::log_str("Child contract deployed and registered.");
            }
            _ => {
                env::panic_str("Child contract deployment failed");
            }
        }
    }

    /// Simple helper: only the owner may call certain methods.
    fn assert_owner(&self) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only owner can call this method"
        );
    }
}

#[ext_contract(ext_self)]
pub trait ExtSelf {
    fn on_child_deploy(&mut self, child_account_id: AccountId, contract_type: ChildContractType);
}

///////////////////////////////////////////
//           UNIT TESTS BELOW            //
///////////////////////////////////////////

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{VMContextBuilder, accounts};
    use near_sdk::{testing_env};

    /// Helper to build the testing context.
    fn get_context(predecessor: AccountId, deposit: NearToken, block_timestamp: u64) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .predecessor_account_id(predecessor)
            .attached_deposit(deposit)
            .block_timestamp(block_timestamp);
        builder
    }

    #[test]
    fn test_new_and_list_child_contracts_empty() {
        let context = get_context(accounts(0), NearToken::from_yoctonear(0), 0);
        testing_env!(context.build());
        let contract = MasterContract::new(accounts(0));
        let list = contract.list_child_contracts();
        assert_eq!(list.len(), 0, "Expected empty child contract list");
    }

    #[test]
    fn test_register_child_contract_success() {
        let owner = accounts(0);
        let context = get_context(owner.clone(), NearToken::from_yoctonear(0), 0);
        testing_env!(context.build());
        let mut contract = MasterContract::new(owner.clone());

        let child_account: AccountId = "child1.testnet".parse().unwrap();
        contract.register_child_contract(child_account.clone(), ChildContractType::Farming);

        let list = contract.list_child_contracts();
        assert_eq!(list.len(), 1, "Expected one child contract registered");
        let (registered_account, metadata) = list.get(0).unwrap();
        assert_eq!(registered_account, &child_account);
        assert_eq!(metadata.contract_type, ChildContractType::Farming);
    }

    #[test]
    #[should_panic(expected = "Only owner can call this method")]
    fn test_register_child_contract_non_owner() {
        let owner = accounts(0);
        let non_owner = accounts(1);
        let context = get_context(non_owner.clone(), NearToken::from_yoctonear(0), 0);
        testing_env!(context.build());
        let mut contract = MasterContract::new(owner);
        let child_account: AccountId = "child1.testnet".parse().unwrap();
        contract.register_child_contract(child_account, ChildContractType::Farming);
    }

    #[test]
    fn test_unregister_child_contract_success() {
        let owner = accounts(0);
        let context = get_context(owner.clone(), NearToken::from_yoctonear(0), 0);
        testing_env!(context.build());
        let mut contract = MasterContract::new(owner.clone());

        let child_account: AccountId = "child1.testnet".parse().unwrap();
        contract.register_child_contract(child_account.clone(), ChildContractType::Farming);
        // Unregister the child contract.
        contract.unregister_child_contract(child_account.clone());
        let list = contract.list_child_contracts();
        assert_eq!(list.len(), 0, "Expected child contract list to be empty after unregistering");
    }

    #[test]
    #[should_panic(expected = "Only owner can call this method")]
    fn test_unregister_child_contract_non_owner() {
        let owner = accounts(0);
        let non_owner = accounts(1);
        let context = get_context(owner.clone(), NearToken::from_yoctonear(0), 0);
        testing_env!(context.build());
        let mut contract = MasterContract::new(owner);
        let child_account: AccountId = "child1.testnet".parse().unwrap();
        contract.register_child_contract(child_account.clone(), ChildContractType::Farming);

        // Switch to non-owner and try to unregister.
        let context = get_context(non_owner.clone(), NearToken::from_yoctonear(0), 0);
        testing_env!(context.build());
        contract.unregister_child_contract(child_account);
    }

    #[test]
    fn test_call_child_contract() {
        let owner = accounts(0);
        // Setting a nonzero deposit (e.g. 1 yoctoNEAR) to simulate a cross-contract call.
        let context = get_context(owner.clone(), NearToken::from_yoctonear(1), 0);
        testing_env!(context.build());
        let contract = MasterContract::new(owner.clone());

        let child_account: AccountId = "child1.testnet".parse().unwrap();
        // Prepare arbitrary arguments.
        let args = b"{\"dummy\": \"data\"}".to_vec();
        let deposit = NearToken::from_yoctonear(0);
        let gas = Gas::from_tgas(10);
        // This call returns a Promise. We cannot inspect the Promise internals in unit tests,
        // but we ensure that the call does not panic.
        let _promise = contract.call_child_contract(child_account, "dummy_method".to_string(), args, deposit, gas);
    }

    #[test]
    fn test_call_create_farm() {
        let owner = accounts(0);
        let context = get_context(owner.clone(), NearToken::from_yoctonear(1), 0);
        testing_env!(context.build());
        let contract = MasterContract::new(owner.clone());

        let child_account: AccountId = "child1.testnet".parse().unwrap();
        let staking_token: AccountId = "staking.token".parse().unwrap();
        let reward_tokens: Vec<AccountId> = vec!["reward.token".parse().unwrap()];
        let lockup_period_sec = 60;
        let reward_per_session = vec![U128(100)];
        let session_interval_sec = 10;
        let start_at_sec = 0;
        let attached_deposit= NearToken::from_yoctonear(1); // deposit in yoctoNEAR

        let _promise = contract.call_create_farm(
            child_account,
            staking_token,
            reward_tokens,
            lockup_period_sec,
            reward_per_session,
            session_interval_sec,
            start_at_sec,
            attached_deposit,
        );
    }

    #[test]
    #[should_panic(expected = "Only owner can call this method")]
    fn test_deploy_child_contract_non_owner() {
        let owner = accounts(0);
        let non_owner = accounts(1);
        let context = get_context(non_owner.clone(), NearToken::from_yoctonear(1), 0);
        testing_env!(context.build());
        let mut contract = MasterContract::new(owner.clone());

        let child_account: AccountId = "child1.testnet".parse().unwrap();
        let wasm_code = vec![0u8; 10]; // dummy WASM bytes
        let initial_balance = NearToken::from_yoctonear(10);
        contract.deploy_child_contract(child_account, ChildContractType::Farming, wasm_code, initial_balance);
    }
}
