#[cfg(test)]
mod tests {

  use crate::*;

  /// integration test happy case - normal listing
  /// aims to test full aplication fliw for a single listing
  /// 1. Initialize contracts
  /// 2. Assign guardian
  /// 3. Create new listing
  /// 4. Fund listing
  /// 5. Time travel to phase 1 sale
  /// 6. Launchpad members buy
  /// 7. Non members try to buy and fail
  /// 8. Time travel to phase 2 sale
  /// 9. everyone buys
  /// 10. Time travel to phase 2 end
  /// 11. Project owner withdraws
  /// 12. Investors withdraw initial release
  /// 13. Time travel to dex launch time
  /// 14. Launch on dex
  /// 15. Time travel to cliff period
  /// 16. Investors withdraw vested tokens
  /// 17. Time travel to after cliff end
  /// 18. Investors withdraw full token amount
  #[tokio::test]
  async fn test_normal_flow() -> anyhow::Result<()> {
    let worker: Worker<Sandbox> = workspaces::sandbox().await?;

    let root = worker.root_account().unwrap();

    // CREATE USER ACCOUNTS
    let owner = create_user_account(&root, "owner").await;
    let guardian = create_user_account(&root, "guardian").await;
    let project_owner = create_user_account(&root, "project_owner").await;
    let investor_1 = create_user_account(&root, "investor1").await;
    let investor_2 = create_user_account(&root, "investor2").await;
    let investor_3 = create_user_account(&root, "investor3").await;

    // 1. Initialize contracts
    // DEPLOY & INITIALIZE FT CONTRACTS

    let ft_wasm = get_wasm("token_contract.wasm")?;
    let ft_price = deploy_contract(&root, "ft_contract_price", &ft_wasm).await;
    initialize_ft_contract(&ft_price, &root).await;
    let ft_project = deploy_contract(&root, "ft_contract_project", &ft_wasm).await;
    initialize_ft_contract(&ft_project, &project_owner).await;
    let ft_xtoken = deploy_contract(&root, "ft_contract_xtoken", &ft_wasm).await;
    initialize_ft_contract(&ft_xtoken, &root).await;

    // SPOON REF.FINANCE FROM MAINNET

    let ref_finance = spoon_contract(REF_FINANCE_ID, &worker).await?;
    transact_call(
      owner
        .call(ref_finance.id(), "new")
        .args_json(json!({
          "owner_id": owner.id(),
          "exchange_fee": 10u32,
          "referral_fee": 10u32
        }))
        .gas(DEFAULT_GAS),
    )
    .await;

    // initialize relevant ref state
    transact_call(
      owner
        .call(ref_finance.id(), "extend_whitelisted_tokens")
        .args_json(json!({
          "tokens": vec![ft_project.id().to_string(), ft_price.id().to_string()]
        }))
        .deposit(1)
        .gas(GAS_LIMIT),
    )
    .await;
    // DEPLOY & INITIALIZE LAUNCHPAD CONTRACT

    let launchpad_wasm = get_wasm("launchpad.wasm").unwrap();
    let launchpad = deploy_contract(&root, "launchpad", &launchpad_wasm).await;

    let token_lock_period: u64 = 60 * 60 * 24 * 14 * TO_NANO;
    let tiers_minimum_tokens: Vec<u128> = vec![1000, 2000, 3000, 4000, 5000, 6000, 7000]
      .into_iter()
      .map(|v| v * FT_DECIMALS as u128)
      .collect();
    let tiers_entitled_allocations: Vec<u64> = vec![1, 2, 3, 4, 5, 6, 7];
    let allowance_phase_2: u64 = 2;

    transact_call(
      launchpad
      .call("new")
      .args_json(json!({
        "owner": owner.id(),
        "contract_settings": {
          "membership_token": ft_xtoken.id(),
          "token_lock_period": token_lock_period.to_string(),
          "tiers_minimum_tokens": tiers_minimum_tokens.iter().map(|v| v.to_string()).collect::<Vec<String>>(),
          "tiers_entitled_allocations": tiers_entitled_allocations.iter().map(|v| v.to_string()).collect::<Vec<String>>(),
          "allowance_phase_2": allowance_phase_2.to_string(),
          "partner_dex": ref_finance.id(),
        }
      }))
      .gas(DEFAULT_GAS)
    )
    .await;

    let accounts = vec![
      &owner,
      &guardian,
      &project_owner,
      &investor_1,
      &investor_2,
      &investor_3,
      launchpad.as_account(),
      ref_finance.as_account(),
    ];

    let contracts = vec![&launchpad, &ref_finance, &ft_price, &ft_project, &ft_xtoken];

    bulk_register_storage(accounts, contracts).await?;

    // 2. Assign guardian
    transact_call(
      owner
        .call(launchpad.id(), "assign_guardian")
        .args_json(json!({
          "new_guardian": guardian.id()
        }))
        .deposit(1),
    )
    .await;

    // 3. Create new listing

    // timestamps
    let half_hour: u64 = 60 * 30;
    let block_info = worker.view_latest_block().await?;
    let current_ts = block_info.timestamp() / TO_NANO;
    let open_sale_1_timestamp_seconds = current_ts + half_hour;
    let open_sale_2_timestamp_seconds = open_sale_1_timestamp_seconds + half_hour;
    let final_sale_2_timestamp_seconds = open_sale_2_timestamp_seconds + half_hour;
    let liquidity_pool_timestamp_seconds = final_sale_2_timestamp_seconds + half_hour;
    let cliff_timestamp_seconds = liquidity_pool_timestamp_seconds + half_hour;
    let end_cliff_timestamp_seconds = cliff_timestamp_seconds + half_hour;

    // token amounts
    let total_amount_sale_project_tokens = 1_000_000_000;

    // temporarily comented out see audit(1)
    // let liquidity_pool_project_tokens = 500_000_000;
    let liquidity_pool_project_tokens = 0;

    let token_allocation_size = 1_000;
    let token_allocation_price: u128 = 500;
    // temporarily comented out see audit(1)
    // let liquidity_pool_price_tokens = 400_000_000;
    let liquidity_pool_price_tokens = 0;

    // vesting shares
    let fraction_instant_release = 4_000;
    let fraction_cliff_release = 5_000;

    // launchpad fees
    let fee_price_tokens = 100;
    let fee_liquidity_tokens = 100;

    transact_call(
      project_owner.call(launchpad.id(), "toggle_authorize_listing_creation").deposit(1)
    ).await;

    let listing_id: u64 = transact_call(
      guardian
        .call(launchpad.id(), "create_new_listing")
        .args_json(json!({
          "listing_data": {
            "project_owner": project_owner.id(),
            "project_token": ft_project.id(),
            "price_token": ft_price.id(),
            "listing_type": "Public",
            "open_sale_1_timestamp_seconds": open_sale_1_timestamp_seconds.to_string(),
            "open_sale_2_timestamp_seconds": open_sale_2_timestamp_seconds.to_string(),
            "final_sale_2_timestamp_seconds": final_sale_2_timestamp_seconds.to_string(),
            "liquidity_pool_timestamp_seconds": liquidity_pool_timestamp_seconds.to_string(),
            "total_amount_sale_project_tokens": total_amount_sale_project_tokens.to_string(),
            "token_allocation_size": token_allocation_size.to_string(),
            "token_allocation_price": token_allocation_price.to_string(),
            "liquidity_pool_project_tokens": liquidity_pool_project_tokens.to_string(),
            "liquidity_pool_price_tokens": liquidity_pool_price_tokens.to_string(),
            "fraction_instant_release": fraction_instant_release.to_string(),
            "fraction_cliff_release": fraction_cliff_release.to_string(),
            "cliff_timestamp_seconds": cliff_timestamp_seconds.to_string(),
            "end_cliff_timestamp_seconds": end_cliff_timestamp_seconds.to_string(),
            "fee_price_tokens": fee_price_tokens.to_string(),
            "fee_liquidity_tokens": fee_liquidity_tokens.to_string(),
          }
        }))
        .deposit(1),
    )
    .await
    .json()?;

    // 4. Fund listing

    ft_transfer_call(
      &project_owner,
      &ft_project,
      launchpad.as_account(),
      total_amount_sale_project_tokens + liquidity_pool_project_tokens,
      json!({
        "type": "FundListing",
        "listing_id": listing_id.to_string()
      })
      .to_string(),
    )
    .await;

    // 5. Time travel to phase 1 sale
    time_travel(&worker, 60 * 30).await?;

    // 6. Launchpad members buy
    // 7. Non members try to buy and fail

    let seed_size = 1_000_000;
    // seed all investors with price tokens
    ft_transfer(&root, &ft_price, &investor_1, seed_size).await;
    ft_transfer(&root, &ft_price, &investor_2, seed_size).await;
    ft_transfer(&root, &ft_price, &investor_3, seed_size).await;

    // seed all investors with xtokens
    ft_transfer(&root, &ft_xtoken, &investor_1, seed_size).await;
    ft_transfer(&root, &ft_xtoken, &investor_2, seed_size).await;
    ft_transfer(&root, &ft_xtoken, &investor_3, seed_size).await;

    let tier_investor_1 = 2;
    let tier_investor_2 = 5;

    // stake membership tokens
    ft_transfer_call(
      &investor_1,
      &ft_xtoken,
      launchpad.as_account(),
      tiers_minimum_tokens[tier_investor_1 - 1],
      json!({
        "type": "VerifyAccount",
        "membership_tier": tier_investor_1.to_string()
      })
      .to_string(),
    )
    .await;

    ft_transfer_call(
      &investor_2,
      &ft_xtoken,
      launchpad.as_account(),
      tiers_minimum_tokens[tier_investor_2 - 1],
      json!({
        "type": "VerifyAccount",
        "membership_tier": tier_investor_2.to_string()
      })
      .to_string(),
    )
    .await;

    // buy allocations

    ft_transfer_call(
      &investor_1,
      &ft_price,
      launchpad.as_account(),
      tiers_entitled_allocations[tier_investor_1 - 1] as u128 * token_allocation_price,
      json!({
        "type": "BuyAllocation",
        "listing_id": listing_id.to_string()
      })
      .to_string(),
    )
    .await;

    ft_transfer_call(
      &investor_2,
      &ft_price,
      launchpad.as_account(),
      tiers_entitled_allocations[tier_investor_2 - 1] as u128 * token_allocation_price,
      json!({
        "type": "BuyAllocation",
        "listing_id": listing_id.to_string()
      })
      .to_string(),
    )
    .await;

    ft_transfer_call(
      &investor_3,
      &ft_price,
      launchpad.as_account(),
      tiers_entitled_allocations[tier_investor_2 - 1] as u128 * token_allocation_price,
      json!({
        "type": "BuyAllocation",
        "listing_id": listing_id.to_string()
      })
      .to_string(),
    )
    .await;

    // assert allocations owned
    let investor_1_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_1, listing_id).await?;
    let investor_2_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_2, listing_id).await?;
    let investor_3_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_3, listing_id).await?;

    let investor_1_allocations = investor_1_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_2_allocations = investor_2_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_3_allocations = investor_3_allocations.unwrap_or((0.to_string(), 0.to_string()));

    assert_eq!(
      investor_1_allocations,
      (
        tiers_entitled_allocations[tier_investor_1 - 1].to_string(),
        0.to_string()
      )
    );
    assert_eq!(
      investor_2_allocations,
      (
        tiers_entitled_allocations[tier_investor_2 - 1].to_string(),
        0.to_string()
      )
    );
    assert_eq!(investor_3_allocations, (0.to_string(), 0.to_string()));

    // assert price token balances
    // launchpad balance must equal cost of all purchased allocations
    let launchpad_balance = ft_balance_of(&ft_price, launchpad.as_account())
      .await?
      .parse::<u128>()
      .unwrap();
    let investor_1_balance = ft_balance_of(&ft_price, &investor_1)
      .await?
      .parse::<u128>()
      .unwrap();
    let investor_2_balance = ft_balance_of(&ft_price, &investor_2)
      .await?
      .parse::<u128>()
      .unwrap();
    let investor_3_balance = ft_balance_of(&ft_price, &investor_3)
      .await?
      .parse::<u128>()
      .unwrap();

    assert_eq!(
      launchpad_balance,
      (investor_1_allocations.0.parse::<u128>().unwrap()
        + investor_2_allocations.0.parse::<u128>().unwrap()
        + investor_3_allocations.0.parse::<u128>().unwrap())
        * token_allocation_price
    );
    assert_eq!(
      investor_1_balance,
      seed_size - investor_1_allocations.0.parse::<u128>().unwrap() * token_allocation_price
    );
    assert_eq!(
      investor_2_balance,
      seed_size - investor_2_allocations.0.parse::<u128>().unwrap() * token_allocation_price
    );
    assert_eq!(investor_3_balance, seed_size);

    // 8. Time travel to phase 2 sale
    time_travel(&worker, 60 * 30).await?;

    // 9. everyone buys

    let expected_allocations_1: u64 =
      investor_1_allocations.0.parse::<u64>().unwrap() + allowance_phase_2;
    let expected_allocations_2: u64 =
      investor_2_allocations.0.parse::<u64>().unwrap() + allowance_phase_2;
    let expected_allocations_3: u64 =
      investor_3_allocations.0.parse::<u64>().unwrap() + allowance_phase_2;

    ft_transfer_call(
      &investor_1,
      &ft_price,
      launchpad.as_account(),
      allowance_phase_2 as u128 * token_allocation_price,
      json!({
        "type": "BuyAllocation",
        "listing_id": listing_id.to_string()
      })
      .to_string(),
    )
    .await;

    ft_transfer_call(
      &investor_2,
      &ft_price,
      launchpad.as_account(),
      allowance_phase_2 as u128 * token_allocation_price,
      json!({
        "type": "BuyAllocation",
        "listing_id": listing_id.to_string()
      })
      .to_string(),
    )
    .await;

    ft_transfer_call(
      &investor_3,
      &ft_price,
      launchpad.as_account(),
      allowance_phase_2 as u128 * token_allocation_price,
      json!({
        "type": "BuyAllocation",
        "listing_id": listing_id.to_string()
      })
      .to_string(),
    )
    .await;

    // assert allocations owned
    let investor_1_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_1, listing_id).await?;
    let investor_2_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_2, listing_id).await?;
    let investor_3_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_3, listing_id).await?;

    let investor_1_allocations = investor_1_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_2_allocations = investor_2_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_3_allocations = investor_3_allocations.unwrap_or((0.to_string(), 0.to_string()));

    assert_eq!(investor_1_allocations.0, expected_allocations_1.to_string());
    assert_eq!(investor_2_allocations.0, expected_allocations_2.to_string());
    assert_eq!(investor_3_allocations.0, expected_allocations_3.to_string());

    // assert price token balances
    // launchpad balance must equal cost of all purchased allocations
    let launchpad_balance_2 = ft_balance_of(&ft_price, launchpad.as_account())
      .await?
      .parse::<u128>()
      .unwrap();
    let investor_1_balance_2 = ft_balance_of(&ft_price, &investor_1)
      .await?
      .parse::<u128>()
      .unwrap();
    let investor_2_balance_2 = ft_balance_of(&ft_price, &investor_2)
      .await?
      .parse::<u128>()
      .unwrap();
    let investor_3_balance_2 = ft_balance_of(&ft_price, &investor_3)
      .await?
      .parse::<u128>()
      .unwrap();

    assert_eq!(
      launchpad_balance_2,
      (investor_1_allocations.0.parse::<u128>().unwrap()
        + investor_2_allocations.0.parse::<u128>().unwrap()
        + investor_3_allocations.0.parse::<u128>().unwrap())
        * token_allocation_price
    );
    assert_eq!(
      investor_1_balance_2,
      seed_size - investor_1_allocations.0.parse::<u128>().unwrap() * token_allocation_price
    );
    assert_eq!(
      investor_2_balance_2,
      seed_size - investor_2_allocations.0.parse::<u128>().unwrap() * token_allocation_price
    );
    assert_eq!(
      investor_3_balance_2,
      seed_size - investor_3_allocations.0.parse::<u128>().unwrap() * token_allocation_price
    );

    // 10. Time travel to phase 2 end
    time_travel(&worker, 60 * 30).await?;

    // 11. Project owner withdraws
    let op_listing_data = view_listing(&launchpad, listing_id).await?;
    let listing_data = op_listing_data.unwrap();

    let allocations_sold = listing_data["allocations_sold"]
      .as_str()
      .unwrap()
      .parse::<u128>()
      .unwrap();

    let expected_project_tokens_withdraw =
      total_amount_sale_project_tokens - allocations_sold * token_allocation_size;
    let effective_project_tokens_liquidity = (allocations_sold * liquidity_pool_project_tokens)
      / (total_amount_sale_project_tokens / token_allocation_size);
    let total_project_tokens_withdraw = expected_project_tokens_withdraw
      + liquidity_pool_project_tokens
      - effective_project_tokens_liquidity;

    let effective_price_tokens_liquidity = (allocations_sold * liquidity_pool_price_tokens)
      / (total_amount_sale_project_tokens / token_allocation_size);

    let expected_fee_price_tokens_withdraw = ((allocations_sold * token_allocation_price
      - effective_price_tokens_liquidity)
      * fee_price_tokens)
      / FRACTION_BASE;
    let expected_price_tokens_withdraw = (allocations_sold * token_allocation_price
      - effective_price_tokens_liquidity)
      - expected_fee_price_tokens_withdraw;

    let pre_balance_price: u128 = ft_balance_of(&ft_price, &project_owner).await?.parse()?;
    let pre_balance_project: u128 = ft_balance_of(&ft_project, &project_owner).await?.parse()?;

    transact_call(
      project_owner
        .call(launchpad.id(), "withdraw_tokens_project")
        .args_json(json!({
          "listing_id": listing_id.to_string()
        }))
        .deposit(1)
        .gas(GAS_LIMIT),
    )
    .await;

    let after_balance_price: u128 = ft_balance_of(&ft_price, &project_owner).await?.parse()?;
    let after_balance_project: u128 = ft_balance_of(&ft_project, &project_owner).await?.parse()?;

    assert_eq!(
      pre_balance_price + expected_price_tokens_withdraw,
      after_balance_price
    );
    assert_eq!(
      pre_balance_project + total_project_tokens_withdraw,
      after_balance_project
    );

    // assert fee was charged
    let contract_treasury_balance = view_contract_treasury_balance(&launchpad).await?;
    for pair in contract_treasury_balance.iter() {
      match pair.0.get("FT") {
        Some(value) => {
          if value["account_id"].as_str().unwrap().to_string() == ft_price.id().to_string() {
            assert_eq!(
              pair.1.parse::<u128>().unwrap(),
              expected_fee_price_tokens_withdraw
            );
          } else {
            assert_eq!(pair.1.parse::<u128>().unwrap(), 0);
          }
        }
        None => (),
      }
    }

    // 12. Investors withdraw initial release

    let expected_withdraw_1 = (investor_1_allocations.0.parse::<u128>()?
      * token_allocation_size
      * fraction_instant_release)
      / FRACTION_BASE;
    let expected_withdraw_2 = (investor_2_allocations.0.parse::<u128>()?
      * token_allocation_size
      * fraction_instant_release)
      / FRACTION_BASE;
    let expected_withdraw_3 = (investor_3_allocations.0.parse::<u128>()?
      * token_allocation_size
      * fraction_instant_release)
      / FRACTION_BASE;

    let pre_balance_investor_1 = ft_balance_of(&ft_project, &investor_1)
      .await?
      .parse::<u128>()?;
    let pre_balance_investor_2 = ft_balance_of(&ft_project, &investor_2)
      .await?
      .parse::<u128>()?;
    let pre_balance_investor_3 = ft_balance_of(&ft_project, &investor_3)
      .await?
      .parse::<u128>()?;

    withdraw_allocations(&launchpad, &investor_1, listing_id).await?;
    withdraw_allocations(&launchpad, &investor_2, listing_id).await?;
    withdraw_allocations(&launchpad, &investor_3, listing_id).await?;

    let after_balance_investor_1 = ft_balance_of(&ft_project, &investor_1)
      .await?
      .parse::<u128>()?;
    let after_balance_investor_2 = ft_balance_of(&ft_project, &investor_2)
      .await?
      .parse::<u128>()?;
    let after_balance_investor_3 = ft_balance_of(&ft_project, &investor_3)
      .await?
      .parse::<u128>()?;

    assert_eq!(
      pre_balance_investor_1 + expected_withdraw_1,
      after_balance_investor_1
    );
    assert_eq!(
      pre_balance_investor_2 + expected_withdraw_2,
      after_balance_investor_2
    );
    assert_eq!(
      pre_balance_investor_3 + expected_withdraw_3,
      after_balance_investor_3
    );

    // assert contract keeping track of withdrawn tokens correctly
    let investor_1_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_1, listing_id).await?;
    let investor_2_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_2, listing_id).await?;
    let investor_3_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_3, listing_id).await?;

    let investor_1_allocations = investor_1_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_2_allocations = investor_2_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_3_allocations = investor_3_allocations.unwrap_or((0.to_string(), 0.to_string()));

    assert_eq!(investor_1_allocations.1, expected_withdraw_1.to_string());
    assert_eq!(investor_2_allocations.1, expected_withdraw_2.to_string());
    assert_eq!(investor_3_allocations.1, expected_withdraw_3.to_string());

    // 13. Time travel to dex launch time
    time_travel(&worker, 60 * 30).await?;

    // 14. Launch on dex
    // temporarily comented out see audit(1)

    // let op_listing_data = view_listing(&launchpad, listing_id).await?;
    // let listing_data = op_listing_data.unwrap();
    // let mut project_tokens_liquidity = listing_data["listing_treasury"]
    //   ["liquidity_pool_project_token_balance"]
    //   .as_str()
    //   .unwrap()
    //   .parse::<u128>()
    //   .unwrap();
    // let mut price_tokens_liquidity = listing_data["listing_treasury"]
    //   ["liquidity_pool_price_token_balance"]
    //   .as_str()
    //   .unwrap()
    //   .parse::<u128>()
    //   .unwrap();
    // let project_liquidity_fee = (project_tokens_liquidity * fee_liquidity_tokens) / FRACTION_BASE;
    // let price_liquidity_fee = (price_tokens_liquidity * fee_liquidity_tokens) / FRACTION_BASE;

    // project_tokens_liquidity -= project_liquidity_fee;
    // price_tokens_liquidity -= price_liquidity_fee;

    // // assert creation of new pool
    // let initial_pool_quantity = get_number_of_pools(&ref_finance).await?;
    // launch_on_dex(&launchpad, &root, listing_id).await?;
    // let final_pool_quantity = get_number_of_pools(&ref_finance).await?;
    // let pool_info = get_pool(&ref_finance, final_pool_quantity - 1).await?;
    // assert_eq!(initial_pool_quantity + 1, final_pool_quantity);
    // assert_eq!(
    //   pool_info["token_account_ids"]
    //     .as_array()
    //     .unwrap()
    //     .iter()
    //     .map(|v| v.as_str().unwrap().to_string())
    //     .collect::<Vec<String>>(),
    //   vec![ft_project.id().to_string(), ft_price.id().to_string()]
    // );
    // assert_eq!(
    //   pool_info["amounts"]
    //     .as_array()
    //     .unwrap()
    //     .iter()
    //     .map(|v| v.as_str().unwrap().to_string())
    //     .collect::<Vec<String>>(),
    //   vec![0.to_string(), 0.to_string()]
    // );

    // // assert deposit of project token
    // let initial_balances = get_deposits(&ref_finance, launchpad.as_account()).await?;
    // launch_on_dex(&launchpad, &root, listing_id).await?;
    // let final_balances = get_deposits(&ref_finance, launchpad.as_account()).await?;
    // assert_eq!(
    //   initial_balances
    //     .get(&ft_project.id().to_string())
    //     .unwrap_or(&"0".to_string())
    //     .parse::<u128>()?
    //     + project_tokens_liquidity,
    //   final_balances
    //     .get(&ft_project.id().to_string())
    //     .unwrap_or(&"0".to_string())
    //     .parse::<u128>()?
    // );

    // // assert fee was charged
    // let contract_treasury_balance = view_contract_treasury_balance(&launchpad).await?;
    // for pair in contract_treasury_balance.iter() {
    //   match pair.0.get("FT") {
    //     Some(value) => {
    //       if value["account_id"].as_str().unwrap().to_string() == ft_price.id().to_string() {
    //         assert_eq!(
    //           pair.1.parse::<u128>().unwrap(),
    //           expected_fee_price_tokens_withdraw
    //         );
    //       } else if value["account_id"].as_str().unwrap().to_string() == ft_project.id().to_string()
    //       {
    //         assert_eq!(pair.1.parse::<u128>().unwrap(), project_liquidity_fee);
    //       }
    //     }
    //     None => (),
    //   }
    // }

    // // assert deposit of price token
    // let initial_balances = get_deposits(&ref_finance, launchpad.as_account()).await?;
    // launch_on_dex(&launchpad, &root, listing_id).await?;
    // let final_balances = get_deposits(&ref_finance, launchpad.as_account()).await?;
    // assert_eq!(
    //   initial_balances
    //     .get(&ft_price.id().to_string())
    //     .unwrap_or(&"0".to_string())
    //     .parse::<u128>()?
    //     + price_tokens_liquidity,
    //   final_balances
    //     .get(&ft_price.id().to_string())
    //     .unwrap_or(&"0".to_string())
    //     .parse::<u128>()?
    // );

    // // assert fee was charged
    // let contract_treasury_balance = view_contract_treasury_balance(&launchpad).await?;
    // for pair in contract_treasury_balance.iter() {
    //   match pair.0.get("FT") {
    //     Some(value) => {
    //       if value["account_id"].as_str().unwrap().to_string() == ft_price.id().to_string() {
    //         assert_eq!(
    //           pair.1.parse::<u128>().unwrap(),
    //           expected_fee_price_tokens_withdraw + price_liquidity_fee
    //         );
    //       } else if value["account_id"].as_str().unwrap().to_string() == ft_project.id().to_string()
    //       {
    //         assert_eq!(pair.1.parse::<u128>().unwrap(), project_liquidity_fee);
    //       }
    //     }
    //     None => (),
    //   }
    // }

    // // assert provisioning of liquidity
    // launch_on_dex(&launchpad, &root, listing_id).await?;
    // let final_balances = get_deposits(&ref_finance, launchpad.as_account()).await?;
    // assert_eq!(
    //   final_balances
    //     .get(&ft_price.id().to_string())
    //     .unwrap_or(&"0".to_string())
    //     .parse::<u128>()?,
    //   0
    // );
    // assert_eq!(
    //   final_balances
    //     .get(&ft_price.id().to_string())
    //     .unwrap_or(&"0".to_string())
    //     .parse::<u128>()?,
    //   0
    // );

    // let pool_info = get_pool(&ref_finance, final_pool_quantity - 1).await?;
    // assert_eq!(initial_pool_quantity + 1, final_pool_quantity);
    // assert_eq!(
    //   pool_info["token_account_ids"]
    //     .as_array()
    //     .unwrap()
    //     .iter()
    //     .map(|v| v.as_str().unwrap().to_string())
    //     .collect::<Vec<String>>(),
    //   vec![ft_project.id().to_string(), ft_price.id().to_string()]
    // );
    // assert_eq!(
    //   pool_info["amounts"]
    //     .as_array()
    //     .unwrap()
    //     .iter()
    //     .map(|v| v.as_str().unwrap().to_string())
    //     .collect::<Vec<String>>(),
    //   vec![
    //     project_tokens_liquidity.to_string(),
    //     price_tokens_liquidity.to_string()
    //   ]
    // );

    // 15. Time travel to cliff period
    time_travel(&worker, 60 * 30).await?;

    // 16. Investors withdraw vested tokens
    let expected_withdraw_1 =
      (investor_1_allocations.0.parse::<u128>()? * token_allocation_size * fraction_cliff_release)
        / FRACTION_BASE;
    let expected_withdraw_2 =
      (investor_2_allocations.0.parse::<u128>()? * token_allocation_size * fraction_cliff_release)
        / FRACTION_BASE;
    let expected_withdraw_3 =
      (investor_3_allocations.0.parse::<u128>()? * token_allocation_size * fraction_cliff_release)
        / FRACTION_BASE;

    let pre_balance_investor_1 = ft_balance_of(&ft_project, &investor_1)
      .await?
      .parse::<u128>()?;
    let pre_balance_investor_2 = ft_balance_of(&ft_project, &investor_2)
      .await?
      .parse::<u128>()?;
    let pre_balance_investor_3 = ft_balance_of(&ft_project, &investor_3)
      .await?
      .parse::<u128>()?;

    withdraw_allocations(&launchpad, &investor_1, listing_id).await?;
    withdraw_allocations(&launchpad, &investor_2, listing_id).await?;
    withdraw_allocations(&launchpad, &investor_3, listing_id).await?;

    let after_balance_investor_1 = ft_balance_of(&ft_project, &investor_1)
      .await?
      .parse::<u128>()?;
    let after_balance_investor_2 = ft_balance_of(&ft_project, &investor_2)
      .await?
      .parse::<u128>()?;
    let after_balance_investor_3 = ft_balance_of(&ft_project, &investor_3)
      .await?
      .parse::<u128>()?;

    assert!(after_balance_investor_1 > pre_balance_investor_1);
    assert!(after_balance_investor_1 < pre_balance_investor_1 + expected_withdraw_1);
    assert!(after_balance_investor_2 > pre_balance_investor_2);
    assert!(after_balance_investor_2 < pre_balance_investor_2 + expected_withdraw_2);
    assert!(after_balance_investor_3 > pre_balance_investor_3);
    assert!(after_balance_investor_3 < pre_balance_investor_3 + expected_withdraw_3);

    // assert contract keeping track of withdrawn tokens correctly
    let investor_1_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_1, listing_id).await?;
    let investor_2_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_2, listing_id).await?;
    let investor_3_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_3, listing_id).await?;

    let investor_1_allocations = investor_1_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_2_allocations = investor_2_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_3_allocations = investor_3_allocations.unwrap_or((0.to_string(), 0.to_string()));

    assert_eq!(
      investor_1_allocations.1,
      after_balance_investor_1.to_string()
    );
    assert_eq!(
      investor_2_allocations.1,
      after_balance_investor_2.to_string()
    );
    assert_eq!(
      investor_3_allocations.1,
      after_balance_investor_3.to_string()
    );

    // 17. Time travel to after cliff end
    time_travel(&worker, 60 * 30).await?;

    // 18. Investors withdraw full token amount
    let expected_withdraw_1 = investor_1_allocations.0.parse::<u128>()? * token_allocation_size;
    let expected_withdraw_2 = investor_2_allocations.0.parse::<u128>()? * token_allocation_size;
    let expected_withdraw_3 = investor_3_allocations.0.parse::<u128>()? * token_allocation_size;

    withdraw_allocations(&launchpad, &investor_1, listing_id).await?;
    withdraw_allocations(&launchpad, &investor_2, listing_id).await?;
    withdraw_allocations(&launchpad, &investor_3, listing_id).await?;

    let after_balance_investor_1 = ft_balance_of(&ft_project, &investor_1)
      .await?
      .parse::<u128>()?;
    let after_balance_investor_2 = ft_balance_of(&ft_project, &investor_2)
      .await?
      .parse::<u128>()?;
    let after_balance_investor_3 = ft_balance_of(&ft_project, &investor_3)
      .await?
      .parse::<u128>()?;

    assert_eq!(after_balance_investor_1, expected_withdraw_1);
    assert_eq!(after_balance_investor_2, expected_withdraw_2);
    assert_eq!(after_balance_investor_3, expected_withdraw_3);

    // assert contract keeping track of withdrawn tokens correctly
    let investor_1_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_1, listing_id).await?;
    let investor_2_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_2, listing_id).await?;
    let investor_3_allocations: Option<(String, String)> =
      view_investor_allocations(&launchpad, &investor_3, listing_id).await?;

    let investor_1_allocations = investor_1_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_2_allocations = investor_2_allocations.unwrap_or((0.to_string(), 0.to_string()));
    let investor_3_allocations = investor_3_allocations.unwrap_or((0.to_string(), 0.to_string()));

    assert_eq!(investor_1_allocations.1, 0.to_string());
    assert_eq!(investor_2_allocations.1, 0.to_string());
    assert_eq!(investor_3_allocations.1, 0.to_string());

    anyhow::Ok(())
  }
}
