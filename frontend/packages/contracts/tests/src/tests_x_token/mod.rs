#[cfg(test)]
mod tests {

  use crate::*;

  /// integration test happy case
  /// aims to test full aplication flow for x_token
  /// 1. Initialize contracts
  /// 2. User mints x_tokens - assert 1:1 ratio
  /// 3. Owner deposits reward tokens
  /// 4. User withdraws x_tokens - assert new ratio
  /// 5. User mints new x_tokens - assert new ratio
  /// 6. User transfer x_tokens to user2 - assert normal behaviour for NEP-141
  #[tokio::test]
  async fn test_normal_flow() -> anyhow::Result<()> {
    let worker: Worker<Sandbox> = workspaces::sandbox().await?;

    let root = worker.root_account().unwrap();
    // CREATE USER ACCOUNTS
    let owner = create_user_account(&root, "owner").await;
    let user = create_user_account(&root, "user").await;
    let user2 = create_user_account(&root, "user2").await;

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

    let accounts = vec![
      &owner,
      &user,
      &user2,
      ft_token.as_account(),
      x_token.as_account(),
    ];
    let contracts = vec![&ft_token, &x_token];

    bulk_register_storage(accounts, contracts).await?;
    ft_transfer(&owner, &ft_token, &user, 1_000_000).await;

    // 2. User mints x_tokens - assert 1:1 ratio

    let initial_token_balance = ft_balance_of(&ft_token, &user).await?.parse::<u128>()?;
    let initial_x_token_balance = ft_balance_of(&x_token, &user).await?.parse::<u128>()?;

    let initial_contract_balance = ft_balance_of(&ft_token, x_token.as_account())
      .await?
      .parse::<u128>()?;
    let initial_x_token_supply = view_token_ratio(&x_token)
      .await?
      .get("x_token")
      .unwrap()
      .parse::<u128>()?;

    assert_eq!(initial_contract_balance, 0);
    assert_eq!(initial_x_token_supply, 0);

    let transfer_amount = 500;
    ft_transfer_call(
      &user,
      &ft_token,
      x_token.as_account(),
      transfer_amount,
      "mint".to_string(),
    )
    .await;

    let final_token_balance = ft_balance_of(&ft_token, &user).await?.parse::<u128>()?;
    let final_x_token_balance = ft_balance_of(&x_token, &user).await?.parse::<u128>()?;

    let final_contract_balance = ft_balance_of(&ft_token, x_token.as_account())
      .await?
      .parse::<u128>()?;
    let final_x_token_supply = view_token_ratio(&x_token)
      .await?
      .get("x_token")
      .unwrap()
      .parse::<u128>()?;

    assert_eq!(initial_token_balance - transfer_amount, final_token_balance);
    assert_eq!(
      initial_x_token_balance + transfer_amount,
      final_x_token_balance
    );

    assert_eq!(final_contract_balance, 500);
    assert_eq!(final_x_token_supply, 500);

    // 3. Owner deposits reward tokens

    let initial_contract_balance = ft_balance_of(&ft_token, x_token.as_account())
      .await?
      .parse::<u128>()?;
    let initial_x_token_supply = view_token_ratio(&x_token)
      .await?
      .get("x_token")
      .unwrap()
      .parse::<u128>()?;

    let increase_amount = 500;
    ft_transfer_call(
      &owner,
      &ft_token,
      x_token.as_account(),
      increase_amount,
      "deposit_profit".to_string(),
    )
    .await;

    let final_contract_balance = ft_balance_of(&ft_token, x_token.as_account())
      .await?
      .parse::<u128>()?;
    let final_x_token_supply = view_token_ratio(&x_token)
      .await?
      .get("x_token")
      .unwrap()
      .parse::<u128>()?;

    assert_eq!(
      final_contract_balance,
      initial_contract_balance + increase_amount
    );
    assert_eq!(final_x_token_supply, initial_x_token_supply);

    // 4. User withdraws x_tokens - assert new ratio

    let initial_token_balance = ft_balance_of(&ft_token, &user).await?.parse::<u128>()?;
    let initial_x_token_balance = ft_balance_of(&x_token, &user).await?.parse::<u128>()?;

    let quantity_to_burn = 200;
    transact_call(
      user
        .call(x_token.id(), "burn_x_token")
        .args_json(json!({
          "quantity_to_burn": quantity_to_burn.to_string()
        }))
        .deposit(1)
        .gas(GAS_LIMIT),
    )
    .await;

    let final_token_balance = ft_balance_of(&ft_token, &user).await?.parse::<u128>()?;
    let final_x_token_balance = ft_balance_of(&x_token, &user).await?.parse::<u128>()?;

    assert_eq!(
      initial_x_token_balance - quantity_to_burn,
      final_x_token_balance
    );
    assert_eq!(
      initial_token_balance + quantity_to_burn * 2,
      final_token_balance
    );

    // 5. User mints new x_tokens - assert new ratio

    let initial_token_balance = ft_balance_of(&ft_token, &user).await?.parse::<u128>()?;
    let initial_x_token_balance = ft_balance_of(&x_token, &user).await?.parse::<u128>()?;

    let initial_contract_balance = ft_balance_of(&ft_token, x_token.as_account())
      .await?
      .parse::<u128>()?;
    let initial_x_token_supply = view_token_ratio(&x_token)
      .await?
      .get("x_token")
      .unwrap()
      .parse::<u128>()?;

    let transfer_amount = 100;
    ft_transfer_call(
      &user,
      &ft_token,
      x_token.as_account(),
      transfer_amount,
      "mint".to_string(),
    )
    .await;

    let final_token_balance = ft_balance_of(&ft_token, &user).await?.parse::<u128>()?;
    let final_x_token_balance = ft_balance_of(&x_token, &user).await?.parse::<u128>()?;

    let final_contract_balance = ft_balance_of(&ft_token, x_token.as_account())
      .await?
      .parse::<u128>()?;
    let final_x_token_supply = view_token_ratio(&x_token)
      .await?
      .get("x_token")
      .unwrap()
      .parse::<u128>()?;

    assert_eq!(initial_token_balance - transfer_amount, final_token_balance);
    assert_eq!(
      initial_x_token_balance + transfer_amount / 2,
      final_x_token_balance
    );

    assert_eq!(
      final_contract_balance,
      initial_contract_balance + transfer_amount
    );
    assert_eq!(
      final_x_token_supply,
      initial_x_token_supply + transfer_amount / 2
    );

    // 6. User transfer x_tokens to user2 - assert normal behaviour for NEP-141
    let initial_x_token_balance_1 = ft_balance_of(&x_token, &user).await?.parse::<u128>()?;
    let initial_x_token_balance_2 = ft_balance_of(&x_token, &user2).await?.parse::<u128>()?;

    let amount = 200;
    ft_transfer(&user, &x_token, &user2, amount).await;

    let final_x_token_balance_1 = ft_balance_of(&x_token, &user).await?.parse::<u128>()?;
    let final_x_token_balance_2 = ft_balance_of(&x_token, &user2).await?.parse::<u128>()?;

    assert_eq!(initial_x_token_balance_1 - amount, final_x_token_balance_1);
    assert_eq!(initial_x_token_balance_2 + amount, final_x_token_balance_2);

    anyhow::Ok(())
  }
}
