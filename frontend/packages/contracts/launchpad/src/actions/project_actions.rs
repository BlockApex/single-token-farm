// ### Project owner

// 1. Send funds to their listing in order to fill out the treasury and allow the presale to start;
// 2. Withdraw the price token received after the end of presale (must discount the needed price_token for the dex liquidity pool);
// 3. Withdraw remaining project_tokens after the end of presale;
// 4. Withdraw all funds in case of cancelled listing;
use crate::*;

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn withdraw_tokens_project(&mut self, listing_id: U64) -> Promise {
    let listing_id = listing_id.0;
    let listing = self.assert_project_owner(listing_id);
    self.internal_withdraw_project_funds(listing, listing_id)
  }
  //temp fix
  #[payable]
  pub fn modify_listing_cliff(&mut self, listing_id: U64, initial_release: U128, cliff: U128) {
    assert_one_yocto();
    self.assert_owner_or_guardian();
    let mut listing = self.internal_get_listing(listing_id.0);
    assert!(initial_release.0 + cliff.0 <= FRACTION_BASE, "{}", ERR_110);
    listing.fraction_instant_release = initial_release.0;
    listing.fraction_cliff_release = cliff.0;
    self.internal_update_listing(listing_id.0, listing);
  }

  #[payable]
  pub fn modify_listing_time(
    &mut self,
    listing_id: U64,
    open_sale_1_timestamp_seconds: U64,
    open_sale_2_timestamp_seconds: U64,
    final_sale_2_timestamp_seconds: U64,
    liquidity_pool_timestamp_seconds: U64,
  ) {
    assert_one_yocto();
    self.assert_owner_or_guardian();
    assert!(
      open_sale_1_timestamp_seconds.0 < open_sale_2_timestamp_seconds.0,
      "{}",
      ERR_108
    );
    assert!(
      open_sale_2_timestamp_seconds < final_sale_2_timestamp_seconds,
      "{}",
      ERR_108
    );
    assert!(
      final_sale_2_timestamp_seconds < liquidity_pool_timestamp_seconds,
      "{}",
      ERR_108
    );
    let mut listing = self.internal_get_listing(listing_id.0);

    listing.open_sale_1_timestamp = open_sale_1_timestamp_seconds.0 * TO_NANO;
    listing.open_sale_2_timestamp = open_sale_2_timestamp_seconds.0 * TO_NANO;
    listing.final_sale_2_timestamp = final_sale_2_timestamp_seconds.0 * TO_NANO;
    listing.liquidity_pool_timestamp = liquidity_pool_timestamp_seconds.0 * TO_NANO;

    self.internal_update_listing(listing_id.0, listing);
  }

  #[payable]
  pub fn add_investor_private_sale_whitelist(
    &mut self,
    listing_id: U64,
    account_id: AccountId,
    allocations: U64,
  ) {
    let listing_id = listing_id.0;
    let listing = self.assert_project_owner(listing_id);
    let project_owner_id = listing.project_owner.clone();
    let initial_storage = env::storage_usage();
    let mut project_owner_account = self.internal_get_investor(&project_owner_id).unwrap();
    assert!(
      matches!(listing.listing_type, ListingType::Private),
      "{}",
      ERR_107
    );
    let previous_allowance = listing.check_private_sale_investor_allowance(&account_id);
    listing.update_private_sale_investor_allowance(&account_id, previous_allowance + allocations.0);
    project_owner_account.track_storage_usage(initial_storage);
    self.internal_update_investor(&project_owner_id, project_owner_account);
  }

  #[payable]
  pub fn alter_investor_private_sale_whitelist(
    &mut self,
    listing_id: U64,
    account_id: AccountId,
    allocations: U64,
  ) {
    let listing_id = listing_id.0;
    let listing = self.assert_project_owner(listing_id);
    let project_owner_id = listing.project_owner.clone();
    let initial_storage = env::storage_usage();
    let mut project_owner_account = self.internal_get_investor(&project_owner_id).unwrap();

    assert!(
      matches!(listing.listing_type, ListingType::Private),
      "{}",
      ERR_107
    );
    listing.update_private_sale_investor_allowance(&account_id, allocations.0);
    project_owner_account.track_storage_usage(initial_storage);
    self.internal_update_investor(&project_owner_id, project_owner_account);
  }

  #[payable]
  pub fn toggle_authorize_listing_creation(&mut self) {
    assert_one_yocto();
    let investor = env::predecessor_account_id();
    let mut investor_account = self.internal_get_investor(&investor).expect(ERR_010);

    investor_account.authorized_listing_creation = !investor_account.authorized_listing_creation;

    self.internal_update_investor(&investor, investor_account);
  }
}

/// Actions to be called through token_receiver functions
impl Contract {
  pub fn fund_listing(&mut self, listing_id: u64, token_quantity: u128, token_type: TokenType) {
    let mut listing = self.internal_get_listing(listing_id);

    listing.assert_funding_token(token_type, token_quantity);
    assert!(
      matches!(listing.status, ListingStatus::Unfunded),
      "{}",
      ERR_113
    );
    assert!(
      env::block_timestamp() < listing.open_sale_1_timestamp,
      "{}",
      ERR_114
    );
    listing.fund_listing();
    self.internal_update_listing(listing_id, listing);
  }
}

#[cfg(test)]
mod tests {

  use crate::tests::*;

  /// withdraw_tokens_project
  /// Method must:
  /// 1. Assert caller is project owner
  /// 2. Assert 1 yocto near was deposited
  /// 3. Assert listing is either Cancelled or SaleFinalized
  /// 4. if sale is finalized:
  ///    a. return unsused liquidity project tokens to project owner;
  ///    b. lock required price tokens for liquidity from received tokens;
  ///    c. reduce price tokens in treasury to 0;
  ///    d. reduce leftover project tokens in treasury to 0;
  ///    e. send ft_transfer promise for price tokens
  ///       with failsafe callback
  ///    f. send ft_transfer promise for leftover project tokens
  ///       with failsafe callback
  /// 5. is sale is cancelled:
  ///    a. reduce project tokens in treasury to 0;
  ///    b. send ft_transfer promise for leftover project tokens
  ///       with failsafe callback
  #[test]
  fn test_withdraw_tokens_project() {
    fn closure_generator(
      caller: AccountId,
      deposit: u128,
      status: ListingStatus,
      sold_out: bool,
      timestamp_passed: bool,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        let timestamp = if timestamp_passed {
          standard_listing_data().final_sale_2_timestamp_seconds.0 + 10
        } else {
          standard_listing_data().final_sale_2_timestamp_seconds.0 - 10
        };

        testing_env!(get_context(
          vec![],
          deposit,
          2,
          caller,
          timestamp * TO_NANO,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);
        contract
          .listings
          .push(&standard_listing(contract.listings.len()));
        let mut listing = contract.listings.get(0).unwrap().into_current();
        let total_allocations =
          listing.total_amount_sale_project_tokens / listing.token_allocation_size;
        listing.status = status.clone();

        match listing.status {
          ListingStatus::Cancelled => {
            listing.fund_listing();
          }
          ListingStatus::SaleFinalized
          | ListingStatus::PoolProjectTokenSent
          | ListingStatus::PoolPriceTokenSent
          | ListingStatus::PoolCreated
          | ListingStatus::LiquidityPoolFinalized
          | ListingStatus::Funded => {
            listing.fund_listing();
            if sold_out {
              listing.buy_allocation(
                1_000_000_000_000_000_000_000_000,
                total_allocations.try_into().unwrap(),
              )
            } else {
              listing.buy_allocation(
                1_000_000_000_000_000_000_000_000,
                (total_allocations / 2).try_into().unwrap(),
              )
            };
          }
          _ => (),
        }
        listing.status = status.clone();

        contract.listings.replace(0, &VListing::V1(listing));

        contract.withdraw_tokens_project(U64(0));

        let listing = contract.internal_get_listing(0);

        //calculate amount of tokens in balance afer sale
        let project_tokens_not_sold = listing.total_amount_sale_project_tokens
          - ((listing.allocations_sold as u128 * listing.total_amount_sale_project_tokens)
            / total_allocations);
        let price_tokens_received =
          listing.allocations_sold as u128 * listing.token_allocation_price;

        // calculate returned project tokens
        // calculate how many price tokens will be directed to liquidity
        let excess_liquidity_project_tokens = (listing.liquidity_pool_project_tokens
          * project_tokens_not_sold)
          / listing.total_amount_sale_project_tokens;
        let to_liquidity_received_price_tokens = listing.liquidity_pool_price_tokens
          - (listing.liquidity_pool_price_tokens * project_tokens_not_sold)
            / listing.total_amount_sale_project_tokens;

        let withdraw_fee = (listing.fee_price_tokens
          * (price_tokens_received - to_liquidity_received_price_tokens))
          / FRACTION_BASE;

        let project_tokens_withdraw = project_tokens_not_sold + excess_liquidity_project_tokens;
        let price_tokens_withdraw =
          price_tokens_received - to_liquidity_received_price_tokens - withdraw_fee;

        assert_eq!(listing.listing_treasury.presale_project_token_balance, 0);
        assert_eq!(
          listing
            .listing_treasury
            .total_received_presale_price_token_balance,
          0
        );
        assert_eq!(
          listing.listing_treasury.liquidity_pool_price_token_balance,
          to_liquidity_received_price_tokens
        );
        assert_eq!(
          listing
            .listing_treasury
            .liquidity_pool_project_token_balance,
          listing.liquidity_pool_project_tokens - excess_liquidity_project_tokens
        );

        let receipts = get_created_receipts();
        println!("{:#?}", receipts);
        assert_eq!(receipts.len(), 4);
        assert_eq!(
          receipts[2].receiver_id,
          listing.project_token.ft_get_account_id()
        );
        assert_eq!(receipts[2].actions.len(), 1);
        match receipts[2].actions[0].clone() {
          VmAction::FunctionCall {
            function_name,
            args,
            gas: _,
            deposit,
          } => {
            assert_eq!(function_name, "ft_transfer");
            let json_args: serde_json::Value =
              serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
            assert_eq!(json_args["receiver_id"], PROJECT_ACCOUNT);
            assert_eq!(json_args["amount"], project_tokens_withdraw.to_string());
            assert_eq!(deposit, 1);
          }
          _ => panic!(),
        };

        assert_eq!(receipts[3].receiver_id, CONTRACT_ACCOUNT.parse().unwrap());
        assert_eq!(receipts[3].actions.len(), 1);
        match receipts[3].actions[0].clone() {
          VmAction::FunctionCall {
            function_name,
            args: _,
            gas: _,
            deposit,
          } => {
            assert_eq!(function_name, "callback_token_transfer_to_project_owner");
            assert_eq!(deposit, 0);
          }
          _ => panic!(),
        };

        assert_eq!(
          receipts[0].receiver_id,
          listing.price_token.ft_get_account_id()
        );
        assert_eq!(receipts[0].actions.len(), 1);
        match receipts[0].actions[0].clone() {
          VmAction::FunctionCall {
            function_name,
            args,
            gas: _,
            deposit,
          } => {
            assert_eq!(function_name, "ft_transfer");
            let json_args: serde_json::Value =
              serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
            assert_eq!(json_args["receiver_id"], PROJECT_ACCOUNT);
            assert_eq!(json_args["amount"], price_tokens_withdraw.to_string());
            assert_eq!(deposit, 1);
          }
          _ => panic!(),
        };

        assert_eq!(receipts[1].receiver_id, CONTRACT_ACCOUNT.parse().unwrap());
        assert_eq!(receipts[1].actions.len(), 1);
        match receipts[1].actions[0].clone() {
          VmAction::FunctionCall {
            function_name,
            args: _,
            gas: _,
            deposit,
          } => {
            assert_eq!(function_name, "callback_token_transfer_to_project_owner");
            assert_eq!(deposit, 0);
          }
          _ => panic!(),
        };
      }
    }

    let test_cases = [
      // 1. Assert caller is owner or guardian
      (
        USER_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::SaleFinalized,
        true,
        true,
        Some(ERR_102.to_string()),
      ),
      // 2. Assert 1 yocto near was deposited
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        0,
        ListingStatus::SaleFinalized,
        true,
        true,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 3. Assert listing is either Cancelled or SaleFinalized
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::Unfunded,
        true,
        true,
        Some(ERR_103.to_string()),
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::Funded,
        true,
        false,
        Some(ERR_103.to_string()),
      ),
      // 4. if sale is finalized:
      //    a. return unsused liquidity project tokens to project owner;
      //    b. lock required price tokens for liquidity from received tokens;
      //    c. reduce price tokens in treasury to 0;
      //    d. reduce leftover project tokens in treasury to 0;
      //    e. send ft_transfer promise for price tokens
      //       with failsafe callback
      //    f. send ft_transfer promise for leftover project tokens
      //       with failsafe callback
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::Funded,
        true,
        true,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::LiquidityPoolFinalized,
        true,
        true,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::PoolCreated,
        true,
        false,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::PoolPriceTokenSent,
        true,
        false,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::SaleFinalized,
        true,
        true,
        None,
      ),
      // 5. is sale is cancelled:
      //    a. reduce project tokens in treasury to 0;
      //    b. send ft_transfer promise for leftover project tokens
      //       with failsafe callback
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::Cancelled,
        true,
        false,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::Cancelled,
        true,
        true,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::Cancelled,
        false,
        false,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        ListingStatus::Cancelled,
        false,
        true,
        None,
      ),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, v.3, v.4, counter), v.5);
      println!("{}", counter);
      counter += 1;
    });
  }

  /// add_investor_private_sale_whitelist
  /// Method must:
  /// 1. Assert caller is project owner;
  /// 2. Assert one yocto;
  /// 3. Assert listing is private sale;
  /// 4. Track new storage costs and charge to project_owner;
  /// 5. update whitelist to add param allocations to account_id (+=);
  #[test]
  fn test_add_investor_private_sale_whitelist() {
    fn closure_generator(
      caller: AccountId,
      deposit: u128,
      account: AccountId,
      listing_type: ListingType,
      add: bool,
      enough_storage: bool,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        testing_env!(get_context(
          vec![],
          deposit,
          0,
          caller,
          0,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let initial_allocations = 20;
        let allocations = 74;

        let mut contract = init_contract(seed);
        let mut listing = standard_listing(contract.listings.len()).into_current();
        listing.listing_type = listing_type;

        let hash_seed = env::keccak256(&(seed + 100).to_be_bytes());
        let hash_seed_2 = env::keccak256(&hash_seed);
        listing.whitelist = LazyOption::new(hash_seed, Some(&LookupMap::new(hash_seed_2)));
        if add {
          listing
            .whitelist
            .get()
            .unwrap()
            .insert(&account, &initial_allocations);
        }

        let storage_deposit = if enough_storage {
          1_000_000_000_000_000_000_000_000
        } else {
          0
        };

        contract.internal_deposit_storage_investor(&listing.project_owner, storage_deposit);

        contract.listings.push(&VListing::V1(listing));

        contract.add_investor_private_sale_whitelist(U64(0), account.clone(), U64(allocations));
        let listing = contract.internal_get_listing(0);
        assert_eq!(
          listing.whitelist.get().unwrap().get(&account).unwrap(),
          if add {
            allocations + initial_allocations
          } else {
            allocations
          }
        )
      }
    }

    let test_cases = [
      // 1. Assert caller is owner or guardian
      (
        USER_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        true,
        true,
        Some(ERR_102.to_string()),
      ),
      // 2. Assert 1 yocto near was deposited
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        0,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        true,
        true,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 3. Assert listing is private sale
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Public,
        true,
        true,
        Some(ERR_107.to_string()),
      ),
      // 4. Track new storage costs and charge to project_owner;
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        false,
        false,
        Some(ERR_201.to_string()),
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        true,
        false,
        None,
      ),
      // 5. update whitelist to add param allocations to account_id (+=);
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        true,
        true,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        false,
        true,
        None,
      ),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(
        closure_generator(v.0, v.1, v.2, v.3, v.4, v.5, counter),
        v.6,
      );
      println!("{}", counter);
      counter += 1;
    });
  }

  /// add_investor_private_sale_whitelist
  /// Method must:
  /// 1. Assert caller is project owner;
  /// 2. Assert one yocto;
  /// 3. Assert listing is private sale;
  /// 4. Track new storage costs and charge to project_owner;
  /// 5. update whitelist to be param allocations to account_id (=);
  #[test]
  fn test_alter_investor_private_sale_whitelist() {
    fn closure_generator(
      caller: AccountId,
      deposit: u128,
      account: AccountId,
      listing_type: ListingType,
      add: bool,
      enough_storage: bool,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        testing_env!(get_context(
          vec![],
          deposit,
          0,
          caller,
          0,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let initial_allocations = 20;
        let allocations = 74;

        let mut contract = init_contract(seed);
        let mut listing = standard_listing(contract.listings.len()).into_current();
        listing.listing_type = listing_type;

        let hash_seed = env::keccak256(&(seed + 100).to_be_bytes());
        let hash_seed_2 = env::keccak256(&hash_seed);
        listing.whitelist = LazyOption::new(hash_seed, Some(&LookupMap::new(hash_seed_2)));
        if add {
          listing
            .whitelist
            .get()
            .unwrap()
            .insert(&account, &initial_allocations);
        }

        let storage_deposit = if enough_storage {
          1_000_000_000_000_000_000_000_000
        } else {
          0
        };

        contract.internal_deposit_storage_investor(&listing.project_owner, storage_deposit);

        contract.listings.push(&VListing::V1(listing));

        contract.alter_investor_private_sale_whitelist(U64(0), account.clone(), U64(allocations));
        let listing = contract.internal_get_listing(0);
        assert_eq!(
          listing.whitelist.get().unwrap().get(&account).unwrap(),
          allocations
        )
      }
    }

    let test_cases = [
      // 1. Assert caller is owner or guardian
      (
        USER_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        true,
        true,
        Some(ERR_102.to_string()),
      ),
      // 2. Assert 1 yocto near was deposited
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        0,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        true,
        true,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 3. Assert listing is private sale
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Public,
        true,
        true,
        Some(ERR_107.to_string()),
      ),
      // 4. Track new storage costs and charge to project_owner
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        false,
        false,
        Some(ERR_201.to_string()),
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        true,
        false,
        None,
      ),
      // 5. update whitelist to be param allocations to account_id (=)
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        true,
        true,
        None,
      ),
      (
        PROJECT_ACCOUNT.parse().unwrap(),
        1,
        USER_ACCOUNT.parse().unwrap(),
        ListingType::Private,
        false,
        true,
        None,
      ),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(
        closure_generator(v.0, v.1, v.2, v.3, v.4, v.5, counter),
        v.6,
      );
      println!("{}", counter);
      counter += 1;
    });
  }
}
