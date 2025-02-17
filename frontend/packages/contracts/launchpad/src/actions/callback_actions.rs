use crate::*;
use crate::listing::{ListingStatus};
use near_sdk::utils::{is_promise_success};

#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  #[private]
  pub fn callback_token_transfer_to_owner(&mut self, token_type: TokenType, old_value: U128) {
    if !is_promise_success() {
      match self.treasury.get(&token_type) {
        Some(current_value) => {
          self
            .treasury
            .insert(&token_type, &(current_value + old_value.0));
        }
        None => panic!("{}", ERR_401),
      }
    }
  }

  #[private]
  pub fn callback_token_transfer_to_project_owner(
    &mut self,
    listing_id: U64,
    old_value: U128,
    field: String,
    fee: Option<U128>,
  ) {
    let listing_id = listing_id.0;
    let mut listing = self.internal_get_listing(listing_id);

    if !is_promise_success() {
      listing.revert_failed_project_owner_withdraw(old_value.0, field);
    } else if field == "price".to_string() {
      events::project_withdraw_listing(U64(listing_id), U128(0), old_value, &listing.status);
      self.internal_add_to_treasury(&listing.price_token, fee.unwrap().0);
    } else if field == "project".to_string() {
      events::project_withdraw_listing(U64(listing_id), old_value, U128(0), &listing.status);
    }

    self.internal_update_listing(listing_id, listing);
  }

  #[private]
  pub fn callback_token_transfer_to_investor(
    &mut self,
    investor_id: AccountId,
    listing_id: U64,
    withdraw_amount: U128,
  ) {
    let listing_id = listing_id.0;
    let withdraw_amount = withdraw_amount.0;
    let mut listing = self.internal_get_listing(listing_id);
    let mut investor = self.internal_get_investor(&investor_id).unwrap();
    let registered_withdraws = investor.allocation_count.get(&listing_id).unwrap();
    if !is_promise_success() {
      // revert changes to listing treasury and to investor's allocations
      investor.allocation_count.insert(
        &listing_id,
        &(
          registered_withdraws.0,
          registered_withdraws.1 - withdraw_amount,
        ),
      );
      listing.revert_failed_investor_withdraw(withdraw_amount);
      self.internal_update_listing(listing_id, listing);
    } else {
      // if no more allocations remaining, remove allocations storage
      // and return storage funds to investor instance
      events::investor_withdraw_allocations(
        &investor_id,
        U64(listing.listing_id),
        U128(withdraw_amount),
        U128(0),
        &listing.status,
      );
      let total_amount = listing.token_allocation_size * registered_withdraws.0 as u128;
      if total_amount == registered_withdraws.1 {
        let initial_storage = env::storage_usage();
        investor.allocation_count.remove(&listing_id);
        investor.track_storage_usage(initial_storage);
        self.internal_update_investor(&investor_id, investor);
      }
    }
  }

  #[private]
  pub fn callback_membership_token_transfer_to_investor(
    &mut self,
    investor_id: AccountId,
    amount: U128,
  ) {
    let mut investor = self.internal_get_investor(&investor_id).unwrap();
    if !is_promise_success() {
      // revert changes to listing treasury and to investor's allocations
      investor.staked_token += amount.0;
      self.internal_update_investor(&investor_id, investor);
    } else {
      events::investor_unstake_membership(
        &investor_id,
        amount,
        U64(investor.get_current_membership_level(&self.contract_settings.tiers_minimum_tokens)),
      );
    }
  }

  #[private]
  pub fn callback_dex_launch_create_pool(
    &mut self,
    listing_id: U64,
    original_deposit: U128,
  ) -> PromiseOrValue<bool> {
    let mut listing = self.internal_get_listing(listing_id.0);
    listing.dex_lock_time = 0;
    assert_eq!(env::promise_results_count(), 1, "ERR_TOO_MANY_RESULTS");
    match env::promise_result(0) {
      PromiseResult::NotReady => unreachable!(),
      PromiseResult::Successful(value) => {
        assert!(
          matches!(listing.status, ListingStatus::SaleFinalized),
          "{}",
          ERR_401
        );
        if let Ok(parsed_value) = serde_json::from_slice::<u64>(&value) {
          listing.dex_id = Some(parsed_value);
          listing.status = ListingStatus::PoolCreated;
          self.internal_update_listing(listing_id.0, listing);
        } else {
          panic!("{}", ERR_402);
        }
        PromiseOrValue::Value(true)
      }
      PromiseResult::Failed => {
        self.internal_update_listing(listing_id.0, listing);
        PromiseOrValue::Promise(Promise::new(env::signer_account_id()).transfer(original_deposit.0))
      }
    }
  }

  #[private]
  pub fn callback_dex_deposit_project_token(
    &mut self,
    listing_id: U64,
    original_deposit: U128,
    launchpad_fee: U128,
  ) {
    let mut listing = self.internal_get_listing(listing_id.0);
    listing.dex_lock_time = 0;
    assert!(
      matches!(listing.status, ListingStatus::PoolCreated),
      "{}",
      ERR_401
    );
    if !is_promise_success() {
      listing.undo_withdraw_liquidity_project_token(original_deposit.0);
    } else {
      listing.status = ListingStatus::PoolProjectTokenSent;
      listing.dex_project_tokens = Some(original_deposit.0 - launchpad_fee.0);
      self.internal_add_to_treasury(&listing.project_token, launchpad_fee.0);
    }

    self.internal_update_listing(listing_id.0, listing);
  }

  #[private]
  pub fn callback_dex_deposit_price_token(
    &mut self,
    listing_id: U64,
    original_deposit: U128,
    launchpad_fee: U128,
  ) {
    let mut listing = self.internal_get_listing(listing_id.0);
    listing.dex_lock_time = 0;
    assert!(
      matches!(listing.status, ListingStatus::PoolProjectTokenSent),
      "{}",
      ERR_401
    );

    if !is_promise_success() {
      listing.undo_withdraw_liquidity_price_token(original_deposit.0);
    } else {
      listing.status = ListingStatus::PoolPriceTokenSent;
      listing.dex_price_tokens = Some(original_deposit.0 - launchpad_fee.0);
      self.internal_add_to_treasury(&listing.price_token, launchpad_fee.0);
    }

    self.internal_update_listing(listing_id.0, listing);
  }

  #[private]
  pub fn callback_dex_add_liquidity(
    &mut self,
    listing_id: U64,
    original_deposit: U128,
  ) -> PromiseOrValue<bool> {
    let mut listing = self.internal_get_listing(listing_id.0);
    listing.dex_lock_time = 0;
    if !is_promise_success() {
      self.internal_update_listing(listing_id.0, listing);
      PromiseOrValue::Promise(Promise::new(env::signer_account_id()).transfer(original_deposit.0))
    } else {
      assert!(
        matches!(listing.status, ListingStatus::PoolPriceTokenSent),
        "{}",
        ERR_401
      );
      listing.status = ListingStatus::LiquidityPoolFinalized;
      self.internal_update_listing(listing_id.0, listing);
      PromiseOrValue::Value(true)
    }
  }
}

#[cfg(test)]
mod tests {

  use crate::tests::*;
  use near_sdk::{VMConfig, RuntimeFeesConfig, PromiseResult};
  use std::collections::HashMap;

  /// callback_token_transfer_to_owner
  /// Method must
  /// 1. if promise fails, add back old_balance for provided token_type
  #[test]
  fn test_callback_token_transfer_to_owner() {
    fn closure_generator(promise_fails: bool, seed: u128) -> impl FnOnce() {
      move || {
        let promise_result = if promise_fails {
          vec![PromiseResult::Failed]
        } else {
          vec![PromiseResult::Successful(vec![0u8])]
        };
        testing_env!(
          get_context(
            vec![],
            1,
            1000,
            CONTRACT_ACCOUNT.parse().unwrap(),
            0,
            Gas(300u64 * 10u64.pow(12)),
          ),
          VMConfig::test(),
          RuntimeFeesConfig::test(),
          HashMap::default(),
          promise_result,
        );

        let mut contract = init_contract(seed);

        let remaining_balance = 10;
        let readd_balance = 100;
        let expected_balance = 110;

        let seed_account = format!("seed{}.testnet", seed).parse().unwrap();
        let token_type = TokenType::FT {
          account_id: seed_account,
        };
        contract.treasury.insert(&token_type, &remaining_balance);

        contract.callback_token_transfer_to_owner(token_type.clone(), U128(readd_balance));

        let new_balance = contract.treasury.get(&token_type).unwrap();
        if promise_fails {
          assert_eq!(new_balance, expected_balance);
        } else {
          assert_eq!(new_balance, remaining_balance);
        }
      }
    }

    let test_cases = [(true, None), (false, None)];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, counter), v.1);
      println!("{}", counter);
      counter += 1;
    });
  }

  /// callback_token_transfer_to_project_owner
  /// Method must:
  /// 1. if promise fails:
  ///   a. return transferred balance to listing treasury
  /// 2. if promise succeeds:
  ///   a. charge fee, adding it to contract treasury
  ///   b. emit project owner withdraw event
  #[test]
  fn test_callback_token_transfer_to_project_owner() {
    fn closure_generator(promise_fails: bool, field: String, seed: u128) -> impl FnOnce() {
      move || {
        let promise_result = if promise_fails {
          vec![PromiseResult::Failed]
        } else {
          vec![PromiseResult::Successful(vec![0u8])]
        };
        testing_env!(
          get_context(
            vec![],
            1,
            1000,
            CONTRACT_ACCOUNT.parse().unwrap(),
            0,
            Gas(300u64 * 10u64.pow(12)),
          ),
          VMConfig::test(),
          RuntimeFeesConfig::test(),
          HashMap::default(),
          promise_result,
        );

        let mut contract = init_contract(seed);

        let price_token = TokenType::FT {
          account_id: standard_listing_data().price_token,
        };

        contract.treasury.insert(&price_token, &0);

        let listing = standard_listing(contract.listings.len()).into_current();
        contract.listings.push(&VListing::V1(listing));

        let old_value = 1000;
        let fee = 100;

        contract.callback_token_transfer_to_project_owner(
          U64(0),
          U128(old_value),
          field.clone(),
          Some(U128(fee)),
        );

        let listing = contract.listings.get(0).unwrap().into_current();

        if promise_fails {
          match field.as_str() {
            "price" => {
              assert_eq!(
                listing
                  .listing_treasury
                  .total_received_presale_price_token_balance,
                old_value
              )
            }
            "project" => {
              assert_eq!(
                listing.listing_treasury.presale_project_token_balance,
                old_value
              )
            }
            _ => panic!(),
          }
        } else {
          let logs = get_logs();
          assert_eq!(logs.len(), 1);

          let event_log = logs.get(0).unwrap();
          let serde_blob: serde_json::Value =
            serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

          assert_eq!(serde_blob["standard"], "jump_launchpad");
          assert_eq!(serde_blob["version"], "1.0.0");
          assert_eq!(serde_blob["event"], "project_withdraw_listing");

          let data: serde_json::Value = serde_blob["data"][0].clone();
          assert_eq!(data["listing_id"], "0");
          assert_eq!(data["project_status"], json!(listing.status));

          match field.as_str() {
            "price" => {
              let treasury_balance = contract.treasury.get(&price_token).unwrap();
              assert_eq!(treasury_balance, fee);
              assert_eq!(data["project_tokens_withdraw"], "0");
              assert_eq!(data["price_tokens_withdraw"], old_value.to_string());
            }
            "project" => {
              assert_eq!(data["project_tokens_withdraw"], old_value.to_string());
              assert_eq!(data["price_tokens_withdraw"], "0");
            }
            _ => panic!(),
          }
        }
      }
    }

    let test_cases = [
      (true, "price".to_string(), None),
      (false, "price".to_string(), None),
      (true, "project".to_string(), None),
      (false, "project".to_string(), None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, counter), v.2);
      println!("{}", counter);
      counter += 1;
    });
  }

  /// callback_token_transfer_to_investor
  /// Method must:
  /// 1. if promise fails:
  ///   a. add back allocations attempted to withdraw to investor
  ///      allocation balance;
  /// 2. if promise succeeds:
  ///   a. if no more allocations left for this project in the investor’s balance, remove project from balance and release storage;
  ///   b. emit project owner withdraw event
  #[test]
  fn test_callback_token_transfer_to_investor() {
    fn closure_generator(promise_fails: bool, all_withdrawn: bool, seed: u128) -> impl FnOnce() {
      move || {
        let promise_result = if promise_fails {
          vec![PromiseResult::Failed]
        } else {
          vec![PromiseResult::Successful(vec![0u8])]
        };
        testing_env!(
          get_context(
            vec![],
            1,
            1000,
            CONTRACT_ACCOUNT.parse().unwrap(),
            0,
            Gas(300u64 * 10u64.pow(12)),
          ),
          VMConfig::test(),
          RuntimeFeesConfig::test(),
          HashMap::default(),
          promise_result,
        );

        let investor_correct: AccountId = format!("user{}.testnet", seed).parse().unwrap();
        let mut contract = init_contract(seed);

        let investor_allocations: u64 = 3;
        let withdrawn_tokens = if all_withdrawn {
          standard_listing_data().token_allocation_size.0 * investor_allocations as u128
        } else {
          standard_listing_data().token_allocation_size.0 * investor_allocations as u128 / 2
        };

        let mut listing = standard_listing(contract.listings.len()).into_current();
        listing.fund_listing();
        listing.buy_allocation(1_000_000_000_000_000_000_000_000, investor_allocations);
        listing.status = ListingStatus::SaleFinalized;
        listing.allocations_sold = investor_allocations;
        let initial_treasury_balance = listing.listing_treasury.all_investors_project_token_balance;
        contract.listings.push(&VListing::V1(listing));

        contract
          .internal_deposit_storage_investor(&investor_correct, 1_000_000_000_000_000_000_000_000);

        let mut investor = contract.internal_get_investor(&investor_correct).unwrap();
        investor
          .allocation_count
          .insert(&0, &(investor_allocations, withdrawn_tokens));
        investor.storage_used = 1_000_000_000_000;
        contract.internal_update_investor(&investor_correct, investor);

        contract.callback_token_transfer_to_investor(
          investor_correct.clone(),
          U64(0),
          U128(withdrawn_tokens),
        );

        let listing = contract.listings.get(0).unwrap().into_current();
        let investor = contract.internal_get_investor(&investor_correct).unwrap();
        if promise_fails {
          let allocations = investor.allocation_count.get(&0).unwrap();
          assert_eq!(allocations.0, investor_allocations);
          assert_eq!(allocations.1, 0);

          assert_eq!(
            listing.listing_treasury.all_investors_project_token_balance,
            initial_treasury_balance + withdrawn_tokens
          );
        } else {
          if all_withdrawn {
            assert!(matches!(investor.allocation_count.get(&0), None));
          }

          let logs = get_logs();
          assert_eq!(logs.len(), 2);

          let event_log = logs.get(1).unwrap();
          let serde_blob: serde_json::Value =
            serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

          assert_eq!(serde_blob["standard"], "jump_launchpad");
          assert_eq!(serde_blob["version"], "1.0.0");
          assert_eq!(serde_blob["event"], "investor_withdraw_allocations");

          let data: serde_json::Value = serde_blob["data"][0].clone();
          assert_eq!(data["listing_id"], "0");
          assert_eq!(
            data["project_tokens_withdrawn"],
            withdrawn_tokens.to_string()
          );
          assert_eq!(data["price_tokens_withdrawn"], "0");
          assert_eq!(data["project_status"], json!(listing.status));
        }
      }
    }

    let test_cases = [
      (true, true, None),
      (true, false, None),
      (false, true, None),
      (false, false, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, counter), v.2);
      println!("{}", counter);
      counter += 1;
    });
  }
}
