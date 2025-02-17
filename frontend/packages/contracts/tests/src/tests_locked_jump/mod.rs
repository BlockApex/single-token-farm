#[cfg(test)]
mod tests {

  use core::panic;

use crate::*;

  /// integration test happy case
  /// aims to test full aplication flow for locked_jump
  /// 1. Initialize contracts
  /// 2. Distribute initial token allocations
  /// 3. Create minter account
  /// 4. Minter account mints locked_tokens
  /// 5. Minter account transfers to 3 regular users
  /// 6. 1 user buys fast pass others do not
  /// 7. time travel
  /// 8. withdraw tokens - assert difference between fast pass
  /// 9. another user buys fast pass
  /// 10. time machine to after vesting ended
  /// 11. assert withdraws
  #[tokio::test]
  async fn test_normal_flow() -> anyhow::Result<()> {
    let worker: Worker<Sandbox> = workspaces::sandbox().await?;

    let root = worker.root_account().unwrap();
    // CREATE USER ACCOUNTS
    let owner = create_user_account(&root, "owner").await;
    let minter = create_user_account(&root, "minter").await;
    let user = create_user_account(&root, "user").await;
    let user2 = create_user_account(&root, "user2").await;
    let user3 = create_user_account(&root, "user3").await;

    // 1. Initialize contracts
    // DEPLOY BASE TOKEN
    let ft_wasm = get_wasm("token_contract.wasm")?;
    let ft_token = deploy_contract(&root, "ft_contract_price", &ft_wasm).await;
    initialize_ft_contract(&ft_token, &owner).await;
    // DEPLOY X_TOKEN
    let x_wasm = get_wasm("x_token.wasm")?;
    let x_token = deploy_contract(&root, "x_token", &x_wasm).await;

    transact_call(owner.call(x_token.id(), "new").args_json(json!({
        "x_token_name": "x_jump".to_string(),
        "x_token_symbol": "symbol".to_string(),
        "x_token_icon": "icon".to_string(),
        "x_token_decimals": FT_DECIMALS,
        "base_token_address": ft_token.id().to_string(),
    })))
    .await;

    // DEPLOY LOCKED_TOKEN
    let locked_wasm = get_wasm("locked_token.wasm")?;
    let locked_token = deploy_contract(&root, "locked_token", &locked_wasm).await;
    let vesting_duration: u64 = 60 * 60 * TO_NANO;
    transact_call(owner.call(locked_token.id(), "new").args_json(json!({
      "locked_token_name": "locked_jump",
      "locked_token_symbol": "symbol",
      "locked_token_icon": "icon",
      "locked_token_decimals": FT_DECIMALS,
      "contract_config": {
        "owner_id": owner.id(),
        "base_token": ft_token.id(),
        "vesting_duration": vesting_duration.to_string(),
        "fast_pass_cost": 500.to_string(),
        "fast_pass_acceleration": 2.to_string(),
        "fast_pass_beneficiary": x_token.id(),
      },
    })))
    .await;

    let accounts = vec![
      &owner,
      &minter,
      &user,
      &user2,
      &user3,
      ft_token.as_account(),
      x_token.as_account(),
      locked_token.as_account(),
    ];
    let contracts = vec![&ft_token, &x_token, &locked_token];

    bulk_register_storage(accounts, contracts).await?;

    // 2. Distribute initial token allocations
    let transfer_amount = 1_000_000;
    ft_transfer(&owner, &ft_token, &user, transfer_amount).await;
    ft_transfer(&owner, &ft_token, &user2, transfer_amount).await;
    ft_transfer(&owner, &ft_token, &user3, transfer_amount).await;
    ft_transfer(&owner, &ft_token, &minter, transfer_amount).await;
    ft_transfer_call(
      &user,
      &ft_token,
      x_token.as_account(),
      transfer_amount / 10,
      "mint".to_string(),
    )
    .await;

    ft_transfer_call(
      &user2,
      &ft_token,
      x_token.as_account(),
      transfer_amount,
      "mint".to_string(),
    )
    .await;

    // 3. Create minter account

    transact_call(
      owner
        .call(locked_token.id(), "add_minter")
        .args_json(json!({
          "new_minter": minter.id()
        }))
        .deposit(1),
    )
    .await;

    // 4. Minter account mints locked_tokens
    let initial_minter: u128 = ft_balance_of(&locked_token, &minter)
      .await?
      .parse()
      .unwrap();

    let mint_amount = transfer_amount;
    ft_transfer_call(
      &owner,
      &ft_token,
      locked_token.as_account(),
      transfer_amount,
      json!({ "type": "Mint", "account_id": minter.id() }).to_string(),
    )
    .await;

    let final_minter: u128 = ft_balance_of(&locked_token, &minter)
      .await?
      .parse()
      .unwrap();
    assert_eq!(initial_minter + mint_amount, final_minter);

    // 5. Minter account transfers to 3 regular users

    let send_amount = 1000;
    ft_transfer(&minter, &locked_token, &user, send_amount).await;

    ft_transfer(&minter, &locked_token, &user2, send_amount).await;

    ft_transfer(&minter, &locked_token, &user3, send_amount).await;

    let vesting_1_1 = &view_vesting_paginated(&locked_token, &user).await?[0];
    let vesting_2_1 = &view_vesting_paginated(&locked_token, &user2).await?[0];
    let vesting_3_1 = &view_vesting_paginated(&locked_token, &user3).await?[0];

    assert_eq!(vesting_1_1["locked_value"], send_amount.to_string());
    assert_eq!(vesting_2_1["locked_value"], send_amount.to_string());
    assert_eq!(vesting_3_1["locked_value"], send_amount.to_string());

    assert!(!vesting_1_1["fast_pass"].as_bool().unwrap());
    assert!(!vesting_2_1["fast_pass"].as_bool().unwrap());
    assert!(!vesting_3_1["fast_pass"].as_bool().unwrap());

    assert_eq!(vesting_1_1["withdrawn_tokens"], 0.to_string());
    assert_eq!(vesting_2_1["withdrawn_tokens"], 0.to_string());
    assert_eq!(vesting_3_1["withdrawn_tokens"], 0.to_string());

    // 6. 1 user buys fast pass others do not

    let cost = (vesting_1_1["locked_value"]
      .as_str()
      .unwrap()
      .parse::<u128>()
      .unwrap()
      * 500)
      / 10000;
    let initial_x_token: u128 = ft_balance_of(&ft_token, x_token.as_account())
      .await?
      .parse()
      .unwrap();
    let initial_user: u128 = ft_balance_of(&ft_token, &user).await?.parse().unwrap();

    ft_transfer_call(
      &user,
      &ft_token,
      locked_token.as_account(),
      transfer_amount / 10,
      json!({ "type": "BuyFastPass", "account_id": user.id(), "vesting_index": "0" }).to_string(),
    )
    .await;

    let final_x_token: u128 = ft_balance_of(&ft_token, x_token.as_account())
      .await?
      .parse()
      .unwrap();
    let final_user: u128 = ft_balance_of(&ft_token, &user).await?.parse().unwrap();

    println!("{}", initial_x_token);
    println!("{}", final_x_token);
    assert_eq!(initial_x_token + cost as u128, final_x_token);
    assert_eq!(initial_user - cost as u128, final_user);

    // 7. time travel
    time_travel(&worker, 60 * 40).await?;

    // 8. withdraw tokens - assert difference between fast pass
    let initial_user: u128 = ft_balance_of(&ft_token, &user).await?.parse().unwrap();
    let initial_user2: u128 = ft_balance_of(&ft_token, &user2).await?.parse().unwrap();
    let initial_user3: u128 = ft_balance_of(&ft_token, &user3).await?.parse().unwrap();

    for result in withdraw_locked_tokens(&user, &locked_token, "0".to_string()).await.outcomes() {
      if result.is_failure() { panic!("Withdraw transaction failed") };
    };
    for result in withdraw_locked_tokens(&user2, &locked_token, "0".to_string()).await.outcomes() {
      if result.is_failure() { panic!("Withdraw transaction failed") };
    };
    for result in withdraw_locked_tokens(&user3, &locked_token, "0".to_string()).await.outcomes() {
      if result.is_failure() { panic!("Withdraw transaction failed") };
    };

    let final_user: u128 = ft_balance_of(&ft_token, &user).await?.parse().unwrap();
    let final_user2: u128 = ft_balance_of(&ft_token, &user2).await?.parse().unwrap();
    let final_user3: u128 = ft_balance_of(&ft_token, &user3).await?.parse().unwrap();

    let vesting_1_2 = &view_vesting_paginated(&locked_token, &user).await?[0];
    let vesting_2_2 = &view_vesting_paginated(&locked_token, &user2).await?[0];
    let vesting_3_2 = &view_vesting_paginated(&locked_token, &user3).await?[0];

    println!("{}", vesting_1_2);
    println!("{}", initial_user);
    println!("{}", final_user);

    assert_eq!(vesting_1_2["withdrawn_tokens"], vesting_1_2["locked_value"]);
    assert_eq!(
      initial_user
        + vesting_1_2["withdrawn_tokens"]
          .as_str()
          .unwrap()
          .parse::<u128>()
          .unwrap(),
      final_user
    );

    assert!(
      vesting_2_2["withdrawn_tokens"]
        .as_str()
        .unwrap()
        .parse::<u128>()
        .unwrap()
        < vesting_2_2["locked_value"]
          .as_str()
          .unwrap()
          .parse::<u128>()
          .unwrap()
    );
    assert_eq!(
      initial_user2
        + vesting_2_2["withdrawn_tokens"]
          .as_str()
          .unwrap()
          .parse::<u128>()
          .unwrap(),
      final_user2
    );

    assert!(
      vesting_3_2["withdrawn_tokens"]
        .as_str()
        .unwrap()
        .parse::<u128>()
        .unwrap()
        < vesting_3_2["locked_value"]
          .as_str()
          .unwrap()
          .parse::<u128>()
          .unwrap()
    );
    assert_eq!(
      initial_user3
        + vesting_3_2["withdrawn_tokens"]
          .as_str()
          .unwrap()
          .parse::<u128>()
          .unwrap(),
      final_user3
    );

    anyhow::Ok(())
  }
}
