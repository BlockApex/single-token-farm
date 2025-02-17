#[cfg(test)]
mod tests {
  use std::{collections::HashMap};

  use rstest::rstest;
  use serde_json::json;
  use workspaces::{Account, network::Sandbox, Worker, Contract};

  use crate::{
    methods::{
      token::initialize_ft_contract,
      nep145::storage_withdraw,
      nft_staking::{
        initialize_nft_staking, add_guardian, transfer, deposit, create_staking_program, stake,
        alter_rewards, unstake, withdraw_reward, DENOM,
      },
      nft::{initialize_nft_contract, nft_mint, view_nft_token},
    },
    lib::events::{parse_event_logs, find_event_type},
    create_user_account, get_wasm, deploy_contract, deploy_contract_from_wasm_path, register_user,
  };

  #[derive(Debug, Clone)]
  struct NftStakingAccounts {
    root: Account,
    owner: Account,
    guardian: Account,
    collection_owner: Account,
    staker: Account,
  }

  #[derive(Debug, Clone)]
  struct NftStakingContracts {
    nft_staking: Contract,

    contract_token: Contract,
    program_token: Contract,

    nft_collection: Contract,
  }

  #[derive(Debug, Clone)]
  struct NftStakingFixtures {
    accounts: NftStakingAccounts,
    contracts: NftStakingContracts,
  }

  async fn worker() -> Worker<Sandbox> {
    workspaces::sandbox().await.unwrap()
  }

  fn root(worker: Worker<Sandbox>) -> Account {
    worker.root_account().unwrap()
  }

  async fn accounts(root: Account) -> NftStakingAccounts {
    NftStakingAccounts {
      owner: create_user_account(&root, "owner").await,
      guardian: create_user_account(&root, "guardian").await,
      collection_owner: create_user_account(&root, "collection_owner").await,
      staker: create_user_account(&root, "staker").await,

      root,
    }
  }

  async fn contracts(accounts: &NftStakingAccounts) -> NftStakingContracts {
    // FT is used more than once
    let ft_wasm_path = "token_contract.wasm";
    let ft_wasm = get_wasm(ft_wasm_path).unwrap();

    let contract_token = deploy_contract(&accounts.root, "contract_token", &ft_wasm).await;
    initialize_ft_contract(&contract_token, &accounts.owner).await;

    let program_token = deploy_contract(&accounts.root, "program_token", &ft_wasm).await;
    initialize_ft_contract(&program_token, &accounts.collection_owner).await;

    let nft_staking =
      deploy_contract_from_wasm_path(&accounts.root, "nft_staking", "nft_staking.wasm").await;
    initialize_nft_staking(&nft_staking, &accounts.owner, vec![contract_token.id()]).await;

    let nft_collection =
      deploy_contract_from_wasm_path(&accounts.root, "nft_collection", "nft_contract.wasm").await;
    initialize_nft_contract(&nft_collection, &accounts.collection_owner).await;

    NftStakingContracts {
      nft_staking,

      contract_token,
      program_token,

      nft_collection,
    }
  }

  async fn register_users(fixtures: &NftStakingFixtures) {
    let contracts = &fixtures.contracts;
    let accounts = &fixtures.accounts;

    register_user(
      &contracts.contract_token,
      &accounts.owner,
      &contracts.nft_staking.as_account(),
    )
    .await;
    register_user(&contracts.contract_token, &accounts.owner, &accounts.staker).await;

    register_user(
      &contracts.program_token,
      &accounts.collection_owner,
      &contracts.nft_staking.as_account(),
    )
    .await;
    register_user(
      &contracts.program_token,
      &accounts.collection_owner,
      &accounts.staker,
    )
    .await;

    register_user(&contracts.nft_staking, &accounts.owner, &accounts.staker).await;
  }

  async fn setup_test() -> NftStakingFixtures {
    let worker = worker().await;
    let root = root(worker);
    let accounts = accounts(root).await;
    let contracts = contracts(&accounts).await;

    let fixtures = NftStakingFixtures {
      accounts,
      contracts,
    };

    register_users(&fixtures).await;

    fixtures
  }

  /*
   * 1. Add guardian (owner)
   * 2. Deposit contract token to contract treasury (anyone)
   * 3. Create staking program (guardian)
   * 4. Transfer contract token (owner; contract -> collection -> distribution)
   * 5. Deposit program token to collection treasury (collection owner)
   * 6. Transfer program token (collection owner; collection -> distribution)
   * 7. Mint a NFT (staker)
   * 8. Stake NFT in staking program (staker)
   * 9. Time-travel to staking program start + 1 round
   * 10. Unstake the NFT (staker)
   * 11. Assert the NFT went back to the owner
   * 12. Outer withdraw staker balance (staker)
   * 13. Assert the claimed reward is correct, considering early-withdraw penalty
   * 14. Withdraw available storage deposit (staker)
   */
  #[rstest]
  #[tokio::test]
  async fn test_normal_flow() -> anyhow::Result<()> {
    let worker = &worker().await;

    let fixtures = setup_test().await;
    let accounts = fixtures.accounts;
    let contracts = fixtures.contracts;

    let owner = accounts.owner;
    let guardian = accounts.guardian;
    let collection_owner = accounts.collection_owner;
    let staker = accounts.staker;

    let nft_staking = contracts.nft_staking;
    let contract_token = contracts.contract_token;
    let program_token = contracts.program_token;
    let nft_collection = contracts.nft_collection;

    add_guardian(&nft_staking, &owner, guardian.id()).await;

    let contract_token_funds = 60000000000000000;

    deposit(
      &nft_staking,
      &contract_token,
      &owner,
      contract_token_funds,
      json!({ "type": "ContractTreasury" }),
    )
    .await;

    let mut collection_rps = HashMap::new();
    let contract_reward: u128 = 20000000000000;
    let program_reward: u128 = 30000000000000;
    collection_rps.insert(
      contract_token.as_account().id(),
      format!("{contract_reward}"),
    );
    collection_rps.insert(program_token.as_account().id(), format!("{program_reward}"));

    let early_withdraw_penalty: u128 = 1000000000000;
    let round_interval_ms: u64 = 1200;
    let start_in_ms: u64 = 3000;

    create_staking_program(
      &nft_staking,
      &guardian,
      json!({
        "collection_address": nft_collection.as_account().id(),
        "collection_owner": collection_owner.id(),
        "token_address": program_token.as_account().id(),
        "collection_rps": collection_rps,
        "min_staking_period": "20000",
        "early_withdraw_penalty": early_withdraw_penalty.to_string(),
        "round_interval": round_interval_ms.to_string(),
        "start_in": start_in_ms.to_string(),
      }),
    )
    .await;

    let initial_timestamp = worker.view_latest_block().await?.timestamp();
    let start_at_ms = (initial_timestamp / 10_u64.pow(6)) + start_in_ms;

    transfer(
      &nft_staking,
      &owner,
      json!({
        "operation": { "type": "ContractToCollection" },
        "collection": {
          "type": "NFTContract",
          "account_id": nft_collection.as_account().id(),
        },
        "token_id": contract_token.as_account().id(),
        "amount": contract_token_funds.to_string(),
      }),
    )
    .await;

    transfer(
      &nft_staking,
      &owner,
      json!({
        "operation": { "type": "CollectionToDistribution" },
        "collection": {
          "type": "NFTContract",
          "account_id": nft_collection.as_account().id(),
        },
        "token_id": contract_token.as_account().id(),
        "amount": contract_token_funds.to_string(),
      }),
    )
    .await;

    let program_token_funds = 6000000000000000;

    deposit(
      &nft_staking,
      &program_token,
      &collection_owner,
      program_token_funds,
      json!({
        "type": "CollectionTreasury",
        "collection": { "type": "NFTContract", "account_id": &nft_collection.as_account().id() }
      }),
    )
    .await;

    transfer(
      &nft_staking,
      &collection_owner,
      json!({
        "operation": { "type": "CollectionToDistribution" },
        "collection": {
          "type": "NFTContract",
          "account_id": nft_collection.as_account().id(),
        },
        "token_id": program_token.as_account().id(),
        "amount": program_token_funds.to_string(),
      }),
    )
    .await;

    nft_mint(&nft_collection, &collection_owner, Some(&staker)).await;
    let nft_id = "#1"; // TODO: get this value from result

    // TODO: traverse execution outcomes for possible cross-contract calls errors
    stake(&nft_staking, &nft_collection, &staker, nft_id).await;

    let stake_timestamp_ms = worker.view_latest_block().await?.timestamp() / 10_u64.pow(6);
    let stake_round = stake_timestamp_ms.checked_sub(start_at_ms).unwrap_or(0) / round_interval_ms;

    /*
        For some unknown reason time travel actually makes it difficult to get accurate block timestamps.
      The behavior I was experiencing while using time-travel is that the block timestamp for the unstaking
      transaction would be lesser than the latests block timestamp before it, which violates causality and a
      lot of the invariants assumed in this test.
    */
    // time_travel(worker, 6).await?;

    unstake(&nft_staking, &nft_collection, &staker, nft_id).await;

    let unstake_timestamp_ms = worker.view_latest_block().await?.timestamp() / 10_u64.pow(6);
    let unstake_round =
      unstake_timestamp_ms.checked_sub(start_at_ms).unwrap_or(0) / round_interval_ms;

    let rounds: u128 = (unstake_round - stake_round).into();

    let nft = view_nft_token(&nft_collection, nft_id).await?.unwrap();
    assert_eq!(nft.owner_id.as_str(), staker.id().as_str());

    let assert_withdraw_reward = |event: serde_json::Value, reward: u128| -> anyhow::Result<()> {
      let tokens_json = event
        .get("data")
        .and_then(|d| d.get(0))
        .and_then(|d| d.get("amount"))
        .and_then(|d| Some(d.clone()))
        .unwrap();
      let tokens = u128::from_str_radix(tokens_json.as_str().unwrap(), 10)?;

      let real_reward_per_round = reward * (DENOM - early_withdraw_penalty);
      let withdrawn_reward = tokens * DENOM;

      /*
          As we have no way way to get the exact block timestamp, and the test environment is not consistent
        with the execution time of each transaction, it is possible that our estimated unstake timestamp
        is actually 1 round higher than the actual one.

          We mitigate the impact of this issue on our test case assertiveness by using a small round interval,
        so that multiple rounds should pass, ensuring that this inconsistency shouldn't result in false-negatives.
      */
      assert!(
        withdrawn_reward == real_reward_per_round * (rounds - 1)
          || withdrawn_reward == real_reward_per_round * rounds
      );

      Ok(())
    };

    let program_withdraw_result =
      withdraw_reward(&nft_staking, &nft_collection, &staker, &program_token).await;
    let program_withdraw_event = find_event_type(
      parse_event_logs(program_withdraw_result)?,
      "withdraw_reward",
    )
    .unwrap();
    assert_withdraw_reward(program_withdraw_event, program_reward)?;

    let contract_withdraw_result =
      withdraw_reward(&nft_staking, &nft_collection, &staker, &contract_token).await;
    let contract_withdraw_event = find_event_type(
      parse_event_logs(contract_withdraw_result)?,
      "withdraw_reward",
    )
    .unwrap();
    assert_withdraw_reward(contract_withdraw_event, contract_reward)?;

    // Redo stake, unstake, confirm rewards after changing reward amounts
    let new_contract_reward = contract_reward * 3;

    println!("{:#?}", alter_rewards(
      &owner,
      &nft_staking,
      &nft_collection,
      &contract_token.id(),
      new_contract_reward,
    )
    .await);

    stake(&nft_staking, &nft_collection, &staker, nft_id).await;

    let stake_timestamp_ms = worker.view_latest_block().await?.timestamp() / 10_u64.pow(6);
    let stake_round = stake_timestamp_ms.checked_sub(start_at_ms).unwrap_or(0) / round_interval_ms;

    unstake(&nft_staking, &nft_collection, &staker, nft_id).await;

    let unstake_timestamp_ms = worker.view_latest_block().await?.timestamp() / 10_u64.pow(6);
    let unstake_round =
      unstake_timestamp_ms.checked_sub(start_at_ms).unwrap_or(0) / round_interval_ms;

    let rounds: u128 = (unstake_round - stake_round).into();
    println!("{}", rounds);

    let nft = view_nft_token(&nft_collection, nft_id).await?.unwrap();
    assert_eq!(nft.owner_id.as_str(), staker.id().as_str());

    let assert_withdraw_reward = |event: serde_json::Value, reward: u128| -> anyhow::Result<()> {
      let tokens_json = event
        .get("data")
        .and_then(|d| d.get(0))
        .and_then(|d| d.get("amount"))
        .and_then(|d| Some(d.clone()))
        .unwrap();
      let tokens = u128::from_str_radix(tokens_json.as_str().unwrap(), 10)?;

      let real_reward_per_round = reward * (DENOM - early_withdraw_penalty);
      let withdrawn_reward = tokens * DENOM;
      println!("real_reward_per_round: {}", real_reward_per_round);
      println!("withdrawn_reward: {}", withdrawn_reward);

      assert!(
        withdrawn_reward == real_reward_per_round * (rounds - 1)
          || withdrawn_reward == real_reward_per_round * rounds
      );

      Ok(())
    };

    let program_withdraw_result =
      withdraw_reward(&nft_staking, &nft_collection, &staker, &program_token).await;
    let program_withdraw_event = find_event_type(
      parse_event_logs(program_withdraw_result)?,
      "withdraw_reward",
    )
    .unwrap();
    assert_withdraw_reward(program_withdraw_event, program_reward)?;

    println!("program done");

    let contract_withdraw_result =
      withdraw_reward(&nft_staking, &nft_collection, &staker, &contract_token).await;
    let contract_withdraw_event = find_event_type(
      parse_event_logs(contract_withdraw_result)?,
      "withdraw_reward",
    )
    .unwrap();
    assert_withdraw_reward(contract_withdraw_event, new_contract_reward)?;

    storage_withdraw(&nft_staking, &staker, None).await;

    anyhow::Ok(())
  }

  // TODO: implement this
  #[rstest]
  #[tokio::test]
  async fn test_retroactive_funds() {}
}
