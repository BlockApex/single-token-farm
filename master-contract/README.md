# Master Contract for Child Contract Management

The master contract is designed to manage multiple child contracts (for example, farming, NFT, or LP farming contracts) by registering, unregistering, invoking methods on them, and even deploying new child contracts.

## Features

- **Register / Unregister Child Contracts:**  
  The contract allows the owner to register already-deployed child contracts and unregister them if necessary.

- **List Child Contracts:**  
  Retrieve a list of all registered child contracts along with their metadata.

- **Generic Cross-Contract Calls:**  
  Call any function on a child contract by specifying the child account, method name, arguments, deposit, and gas.

- **Specialized Calls:**  
  For instance, the `call_create_farm` method shows how to call a `create_farm` function on a farming child contract.

- **Deploy New Child Contracts:**  
  An owner-only method is provided to deploy a new child contract to a sub-account. After a successful deployment, the contract registers the new child via a callback.

## Code Overview

The key parts of the contract are:

### 1. ChildContractType Enum

Defines the types of child contracts managed by the master contract.

```rust
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Debug, PartialEq, Eq, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum ChildContractType {
    Farming,
    NFT,
    LP,
}
```

# Master Contract Documentation

This document describes the structure and functionality of the Master Contract used for managing multiple child contracts on NEAR Protocol.

---

## 2. ChildContractMetadata

The `ChildContractMetadata` struct holds the metadata for each registered child contract. It stores the type of the child contract and the timestamp at which the contract was deployed. This metadata is useful for auditing and management.

```rust
#[derive(BorshDeserialize, BorshSerialize)]
pub struct ChildContractMetadata {
    pub contract_type: ChildContractType,
    pub deployed_at: u64,
}
```

### Fields

- **`contract_type`**:  
  Specifies the type of the child contract. It can be one of:
  - `Farming`
  - `NFT`
  - `LP`

- **`deployed_at`**:  
  A timestamp (in nanoseconds) indicating when the contract was deployed.

---

## 3. MasterContract

The `MasterContract` manages all child contracts. It stores a mapping from child contract account IDs to their metadata and provides functions to register, unregister, list, call, and deploy child contracts.

```rust
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct MasterContract {
    child_contracts: UnorderedMap<AccountId, ChildContractMetadata>,
    owner: AccountId,
}
```

### Key Functions

#### Initialization

Initializes the master contract with an owner.

```rust
#[init]
pub fn new(owner: AccountId) -> Self {
    Self {
        child_contracts: UnorderedMap::new(b"childs".to_vec()),
        owner,
    }
}
```

#### Registering a Child Contract

Registers an already-deployed child contract.  
**Owner-only function.**

```rust
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
```

#### Unregistering a Child Contract

Removes a registered child contract from the mapping.  
**Owner-only function.**

```rust
pub fn unregister_child_contract(&mut self, child_account_id: AccountId) {
    self.assert_owner();
    self.child_contracts.remove(&child_account_id);
    env::log_str(format!("Unregistered child contract: {}", child_account_id).as_str());
}
```

#### Listing Child Contracts

Returns a list of all registered child contracts along with their metadata.

```rust
pub fn list_child_contracts(&self) -> Vec<(AccountId, ChildContractMetadata)> {
    self.child_contracts.iter().collect()
}
```

#### Generic Cross-Contract Call

Calls any method on a child contract by specifying the contract account, method name, arguments, deposit, and gas.

```rust
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
```

#### Specialized Call: `create_farm`

A specialized method to call the `create_farm` function on a farming child contract. It builds the expected JSON arguments and makes the cross-contract call.

```rust
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
    let args = near_sdk::serde_json::json!({
        "staking_token": staking_token,
        "reward_tokens": reward_tokens,
        "lockup_period_sec": lockup_period_sec,
        "reward_per_session": reward_per_session,
        "session_interval_sec": session_interval_sec,
        "start_at_sec": start_at_sec,
    });
    let args_vec = near_sdk::serde_json::to_vec(&args).unwrap();
    let gas_amount = Gas::from_tgas(50);
    Promise::new(child_account_id).function_call(
        "create_farm".to_string(),
        args_vec,
        attached_deposit,
        gas_amount,
    )
}
```

#### Deploying a New Child Contract

Deploys a new child contract to a sub-account and registers it upon successful deployment.  
**Owner-only function.**

```rust
#[payable]
pub fn deploy_child_contract(
    &mut self,
    child_account_id: AccountId,
    contract_type: ChildContractType,
    child_contract_wasm: Vec<u8>,
    initial_balance: NearToken,
) -> Promise {
    self.assert_owner();
    Promise::new(child_account_id.clone())
        .create_account()
        .transfer(initial_balance)
        .deploy_contract(child_contract_wasm)
        .then(
            Self::ext(env::current_account_id())
                .with_static_gas(Gas::from_tgas(10))
                .on_child_deploy(child_account_id, contract_type)
        )
}
```

#### Callback Function: `on_child_deploy`

This function is called after attempting to deploy a child contract. It registers the child if the deployment is successful.

```rust
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
```

#### Owner-Only Access Helper

Ensures that only the owner can perform certain operations.

```rust
fn assert_owner(&self) {
    assert_eq!(
        env::predecessor_account_id(),
        self.owner,
        "Only owner can call this method"
    );
}
```

---

## 4. Example Usage

### Initializing the Contract

```rust
let master_contract = MasterContract::new("owner.testnet".parse().unwrap());
```

### Registering a Child Contract

```rust
master_contract.register_child_contract(
    "child1.testnet".parse().unwrap(),
    ChildContractType::Farming,
);
```

### Listing Registered Child Contracts

```rust
let child_contracts = master_contract.list_child_contracts();
for (account, metadata) in child_contracts {
    println!("Child Account: {}, Type: {:?}, Deployed At: {}", account, metadata.contract_type, metadata.deployed_at);
}
```

### Unregistering a Child Contract

```rust
master_contract.unregister_child_contract("child1.testnet".parse().unwrap());
```

### Making a Generic Cross-Contract Call

```rust
let args = near_sdk::serde_json::to_vec(&serde_json::json!({ "dummy": "data" })).unwrap();
let promise = master_contract.call_child_contract(
    "child1.testnet".parse().unwrap(),
    "dummy_method".to_string(),
    args,
    NearToken::from_yoctonear(0),
    Gas::from_tgas(10)
);
```

### Calling `create_farm` on a Child Contract

```rust
let promise = master_contract.call_create_farm(
    "child1.testnet".parse().unwrap(), 
    "staking.token".parse().unwrap(),
    vec!["reward.token".parse().unwrap()],
    60,              // lockup period in seconds
    vec![U128(100)], // reward per session
    10,              // session interval in seconds
    0,               // start time (0 for immediate start)
    NearToken::from_yoctonear(1) // attached deposit
);
```

### Deploying a New Child Contract

```rust
// Read the WASM file for the child contract
let wasm_code = std::fs::read("child_contract.wasm").expect("WASM file not found");
let promise = master_contract.deploy_child_contract(
    "newchild.owner.testnet".parse().unwrap(), 
    ChildContractType::Farming, 
    wasm_code, 
    NearToken::from_yoctonear(10)
);
```

---

## 5. Running Tests

Unit tests for the contract are included in the source code. To run the tests, execute:

```bash
cargo test -- --nocapture
```

This command will run all unit tests and display the output.

---

## Conclusion

The Master Contract provides a flexible and robust solution for managing various types of child contracts on the NEAR blockchain. Its features include registration,cross-contract calls, specialized method calls, and deployment of new child contracts—all secured by owner-only access control.
