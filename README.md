# Single-Token Session-Based Farming Contract

This contract allows users to **stake** a single NEP-141 token and receive **one or more** reward tokens over discrete *sessions*. It follows a Ref Finance–style distribution model where each session emits a fixed `reward_per_session[i]` for each reward token.

---

## 1. Overview

- **Session-Based Emission**: Rewards are emitted in discrete intervals (“sessions”). Once a session completes, the contract increases `reward_per_share` accordingly.  
- **Multiple Reward Tokens**: Each “farm” can have multiple reward tokens, each with its own `reward_per_session`.  
- **Lockup Logic**: Users cannot withdraw their staked tokens until the lockup period has expired.  
- **NEP-141 Integration**: Staking is done by calling `ft_transfer_call` on the staking token. Reward tokens are deposited similarly via `ft_transfer_call` with a message indicating `ADD_REWARD:<farm_id>`.  
- **Storage Deposit**: Users must pay for their storage usage via `storage_deposit`.  

---

## 2. Data Structures

1. **FarmParams**  
   - `staking_token: AccountId` – The token to stake.  
   - `reward_tokens: Vec<AccountId>` – List of tokens used to reward stakers.  
   - `reward_per_session: Vec<u128>` – Amount of each reward token emitted per session.  
   - `session_interval: u64` – Session length in nanoseconds.  
   - `start_time: u64` – When distribution can begin (in nanoseconds).  
   - `last_distribution: u64` – Last time distribution was updated.  
   - `total_staked: u128` – Total staked amount in this farm.  
   - `reward_per_share: Vec<u128>` – Tracks how many reward tokens have been distributed *per staked token* (for each reward token).  
   - `lockup_period: u64` – A time lock in nanoseconds. Users cannot withdraw before this expires.

2. **StakeInfo**  
   - `amount: u128` – How many tokens the user staked.  
   - `lockup_end: u64` – The timestamp (nanoseconds) after which the user can withdraw.  
   - `reward_debt: Vec<u128>` – A checkpoint for each reward token’s `reward_per_share`.  
   - `accrued_rewards: Vec<u128>` – The user’s unclaimed rewards for each reward token.

---

## 3. Methods

### Core Methods
- **`storage_deposit`**: Users must deposit storage to cover contract state usage.  
  - Example:  
    ```bash
    near call <contract> storage_deposit --accountId user.testnet --deposit 1
    ```

- **`create_farm(input: FarmInput)`**: Creates a new farm with specified parameters.  
  - Parameters:  
    - `staking_token`: Token to stake.  
    - `reward_tokens`: Tokens for rewards.  
    - `reward_per_session`: Rewards emitted per session.  
    - `session_interval_sec`: Session length in seconds.  
    - `lockup_period_sec`: Lockup time (in seconds).  
    - `start_at_sec`: Start time (optional).  
  - Example:  
    ```bash
    near call <contract> create_farm '{"input": {
        "staking_token": "token.testnet",
        "reward_tokens": ["reward.testnet"],
        "reward_per_session": ["100000000000000000000"],
        "session_interval_sec": 3600,
        "lockup_period_sec": 600,
        "start_at_sec": 0
    }}' --accountId user.testnet --depositYocto 1
    ```

- **`ft_on_transfer(sender_id, amount, msg)`**: Handles staking or reward deposits based on message.  
  - If `msg == "STAKE:<farm_id>"`, stakes tokens in the farm.  
  - If `msg == "ADD_REWARD:<farm_id>"`, deposits reward tokens.  
  - Example for staking:  
    ```bash
    near call staking.token ft_transfer_call '{"receiver_id": "<contract>", "amount": "1000", "msg": "STAKE:0"}' --accountId user.testnet --depositYocto 1
    ```
  - Example for adding rewards:  
    ```bash
    near call reward.token ft_transfer_call '{"receiver_id": "<contract>", "amount": "5000000000000000000", "msg": "ADD_REWARD:0"}' --accountId user.testnet --depositYocto 1
    ```

- **`claim_rewards(farm_id)`**: Claims all pending rewards for the user in a specific farm.  
  - Example:  
    ```bash
    near call <contract> claim_rewards '{"farm_id": 0}' --accountId user.testnet --depositYocto 1
    ```

- **`withdraw(farm_id, amount)`**: Withdraws the specified amount of staked tokens, if the lockup period has expired.  
  - Example:  
    ```bash
    near call <contract> withdraw '{"farm_id": 0, "amount": "1000"}' --accountId user.testnet --depositYocto 1
    ```

---

## 4. View Methods

- **`list_farms(from_index, limit)`**: Returns a paginated list of farms.  
  - Example:  
    ```bash
    near view <contract> list_farms '{"from_index": 0, "limit": 10}'
    ```

- **`get_farm(farm_id)`**: Returns the details of a specific farm.  
  - Example:  
    ```bash
    near view <contract> get_farm '{"farm_id": 0}'
    ```

- **`get_stake_info(account_id, farm_id)`**: Returns the staking details for a user in a specific farm.  
  - Example:  
    ```bash
    near view <contract> get_stake_info '{"account_id": "user.testnet", "farm_id": 0}'
    ```

- **`list_stakes_by_user(account_id, from_index, limit)`**: Returns a paginated list of all stakes for a specific user.  
  - Example:  
    ```bash
    near view <contract> list_stakes_by_user '{"account_id": "user.testnet", "from_index": 0, "limit": 10}'
    ```

---

## 5. Storage Management

- **`storage_deposit`**: Deposits NEAR to cover storage costs.  
- **`storage_withdraw`**: Withdraws unused storage deposit.  
  - Example:  
```bash
near call <contract> storage_withdraw '{"amount": "1000000000000000000"}' --accountId user.testnet --depositYocto 1
```

---

## 6. Example Workflows

### 1. **Farm Creation**
   - **Deposit storage** (Required before creating a farm):  
     ```bash
     near call <contract> storage_deposit --accountId user.testnet --deposit 1
     ```
   - **Create a farm** with a staking token, multiple reward tokens, session-based distribution, and a lockup period:  
     ```bash
     near call <contract> create_farm '{"input": {
         "staking_token": "staking.testnet",
         "reward_tokens": ["reward1.testnet", "reward2.testnet"],
         "reward_per_session": ["1000000000000000000", "500000000000000000"],
         "session_interval_sec": 3600,
         "lockup_period_sec": 600,
         "start_at_sec": 0
     }}' --accountId user.testnet --depositYocto 1
     ```

### 2. **Staking Tokens**
   - Users stake tokens by sending `ft_transfer_call` to the contract:  
     ```bash
     near call staking.token ft_transfer_call '{"receiver_id": "<contract>", "amount": "1000", "msg": "STAKE:0"}' --accountId user.testnet --depositYocto 1
     ```
   - This will add `1000` staking tokens to **farm 0**.

### 3. **Adding Reward Tokens**
   - The farm owner (or anyone allowed) can add reward tokens:  
     ```bash
     near call reward.token ft_transfer_call '{"receiver_id": "<contract>", "amount": "100000000000000000000", "msg": "ADD_REWARD:0"}' --accountId user.testnet --depositYocto 1
     ```
   - This adds `100` reward tokens to **farm 0**.

### 4. **Claiming Rewards**
   - Users can claim their earned rewards:  
     ```bash
     near call <contract> claim_rewards '{"farm_id": 0}' --accountId user.testnet --depositYocto 1
     ```
   - This will transfer accumulated rewards to `user.testnet`.

### 5. **Withdrawing Staked Tokens (after lockup)**
   - Users can withdraw their staked tokens after the lockup period expires:  
     ```bash
     near call <contract> withdraw '{"farm_id": 0, "amount": "500"}' --accountId user.testnet --depositYocto 1
     ```
   - This withdraws `500` staking tokens from **farm 0**.

---

## 7. Notes

- **Storage Deposit Requirement**:  
  Users must deposit **NEAR** before interacting with the contract. If they don't, storage-related transactions will fail.
  ```bash
  near call <contract> storage_deposit --accountId user.testnet --deposit 1


- **Session-Based Reward Distribution**: 
	- Rewards are only distributed at session intervals and do not accumulate continuously.
	- A session is defined by session_interval_sec, and rewards are emitted only at the end of a session.

- **Reward Per Share Mechanism**:
	- 	Reward Calculation:
	- The contract updates reward_per_share when a session completes.
	- Users accumulate rewards proportionally to their stake.
	•	Users who stake for longer durations benefit from multiple sessions of reward accumulation.
	
  **Example Reward Calculation**:

  **Suppose**:
	- The total farm reward per session = 100 tokens.
	- total_staked = 1000 tokens.
	- Each staked token earns:
100 / 1000 = 0.1 tokens per session.
	- If a user stakes 500 tokens for 2 sessions, they will receive:
500 * 0.1 * 2 = 100 reward tokens.

- **Lockup Period Enforcement**
	- 	Users cannot withdraw their staked tokens until the lockup period expires.
	- The contract enforces this by checking lockup_end before allowing withdrawals.
	**Example scenario:**

	- A user stakes at timestamp t0.
	- Lockup period = 600 seconds.
	-  The user cannot withdraw before t0 + 600.
