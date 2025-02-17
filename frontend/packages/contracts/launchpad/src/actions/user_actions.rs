// ### Normal users

// 1. join sale_1 (if they own xJump);
// 2. join sale_2;
// 3. withdraw unlocked project_tokens from a listing they invested in;
// 4. withdraw vested project_tokens from a listing they invested in;
// 5. withdraw price_tokens from a listing they invested in in case the listing is cancelled;

use crate::*;
use crate::ext_interface::{ext_self};
use crate::token_handler::{TokenType, GAS_FOR_FT_TRANSFER_CALLBACK};
use near_sdk::{Promise};

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn withdraw_allocations(&mut self, listing_id: U64) -> Promise {
    assert_one_yocto();
    let listing_id = listing_id.0;
    let account_id = env::predecessor_account_id();
    let mut listing = self.internal_get_listing(listing_id);
    let mut investor = self.internal_get_investor(&account_id).expect(ERR_004);
    // figure if cliff has already passed
    let investor_allocations = investor.allocation_count.get(&listing_id).expect(ERR_302);
    assert!(investor_allocations.0 > 0, "{}", ERR_302);
    let vested_tokens =
      listing.calculate_vested_investor_withdraw(investor_allocations.0, env::block_timestamp());
    let tokens_to_withdraw = if vested_tokens >= investor_allocations.1 {
      vested_tokens - investor_allocations.1
    } else {
      0
    };
    let allocations_remaining = (investor_allocations.0, vested_tokens);
    investor
      .allocation_count
      .insert(&listing_id, &allocations_remaining)
      .expect(ERR_302);
    self.internal_update_investor(&account_id, investor);

    let promise = listing.withdraw_investor_funds(tokens_to_withdraw, account_id);
    self.internal_update_listing(listing_id, listing);
    promise
  }

  #[payable]
  pub fn decrease_membership_tier(&mut self, withdraw_amount: U128) -> Promise {
    assert_one_yocto();
    let account_id = env::predecessor_account_id();
    let mut investor = self.internal_get_investor(&account_id).expect(ERR_004);
    assert!(investor.staked_token >= withdraw_amount.0, "{}", ERR_208);
    assert!(
      env::block_timestamp() - investor.last_check >= self.contract_settings.token_lock_period.0,
      "{}. Will be able to retrieve at timestamp {}",
      ERR_209,
      investor.last_check + self.contract_settings.token_lock_period.0
    );

    investor.staked_token -= withdraw_amount.0;
    self.internal_update_investor(&account_id, investor);

    TokenType::FT {
      account_id: self.contract_settings.membership_token.clone(),
    }
    .transfer_token(account_id.clone(), withdraw_amount.0)
    .then(
      ext_self::ext(env::current_account_id())
        .with_static_gas(GAS_FOR_FT_TRANSFER_CALLBACK)
        .callback_membership_token_transfer_to_investor(account_id, withdraw_amount),
    )
  }
}

/// methods to be called through the token_receiver
impl Contract {
  // add logic to calculate how many user can buy and reduce the allocations
  // they already bought
  pub fn buy_allocation(
    &mut self,
    listing_id: u64,
    price_tokens_sent: u128,
    account_id: AccountId,
    token_type: TokenType,
  ) -> u128 {
    let initial_storage = env::storage_usage();
    let mut listing = self.internal_get_listing(listing_id);
    let mut investor = self.internal_get_investor(&account_id).expect(ERR_004);
    assert_eq!(token_type, listing.price_token, "{}", ERR_104);
    let current_sale_phase = listing.get_current_sale_phase();
    let previous_allocations_bought = investor
      .allocation_count
      .get(&listing.listing_id)
      .unwrap_or((0, 0));
    let investor_allocations = self.check_investor_allowance(
      &investor,
      &current_sale_phase,
      previous_allocations_bought.0,
      &listing,
    );
    assert!(investor_allocations > 0, "{}", ERR_211);
    let (allocations_bought, leftover) =
      listing.buy_allocation(price_tokens_sent, investor_allocations);

    events::investor_buy_allocations(
      &account_id,
      U64(listing_id),
      &listing.status,
      current_sale_phase,
      U64(allocations_bought),
      U64(listing.allocations_sold),
      U128(listing.token_allocation_size * (allocations_bought as u128)),
    );
    self.internal_update_listing(listing_id, listing);
    let new_allocation_balance = (
      previous_allocations_bought.0 + allocations_bought,
      previous_allocations_bought.1,
    );
    investor
      .allocation_count
      .insert(&listing_id, &new_allocation_balance);
    investor.track_storage_usage(initial_storage);
    self.internal_update_investor(&account_id, investor);

    leftover
  }

  pub fn increase_membership_tier(
    &mut self,
    account_id: AccountId,
    token_count: u128,
    membership_tier: usize,
    token_type: AccountId,
  ) -> u128 {
    assert_eq!(
      token_type, self.contract_settings.membership_token,
      "{}",
      ERR_204
    );
    let tokens_needed = self
      .contract_settings
      .tiers_minimum_tokens
      .get(membership_tier - 1)
      .expect(ERR_205)
      .0;
    let mut investor = self.internal_get_investor(&account_id).expect(ERR_004);
    let total_tokens = token_count + investor.staked_token;
    assert!(total_tokens >= tokens_needed, "{}", ERR_206);
    assert!(
      membership_tier as u64
        >= investor.get_current_membership_level(&self.contract_settings.tiers_minimum_tokens),
      "{}",
      ERR_207
    );
    investor.staked_token = tokens_needed;
    investor.update_time_check();
    self.internal_update_investor(&account_id, investor);
    events::investor_stake_membership(
      &account_id,
      U128(tokens_needed),
      U64(membership_tier as u64),
    );
    total_tokens - tokens_needed
  }
}

#[cfg(test)]
mod tests {

  use crate::tests::*;

  /// withdraw_allocations
  /// Method must:
  /// 1. assert investor exists
  /// 2. assert investor has allocations;
  /// 3. assert sale is finalized;
  /// 4. calculate vested tokens;
  /// 6. update withdrawn count in investor balance;
  /// 7. promise to transfer tokens to investor with fail safe callback;
  #[test]
  fn test_withdraw_allocations() {
    enum VestingTime {
      NotFinalized,
      Initial,
      Cliff { passed_time: u64 },
      Finalized,
    }

    fn closure_generator(
      investor_exists: bool,
      sale_state: VestingTime,
      investor_allocations: u64,
      investor_already_withdrawn: u128,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        let investor_correct: AccountId = format!("user{}.testnet", seed).parse().unwrap();
        let investor_incorrect = "dummy.testnet".parse().unwrap();

        let predecessor = if investor_exists {
          investor_correct.clone()
        } else {
          investor_incorrect
        };

        let base_time = match sale_state {
          VestingTime::NotFinalized => {
            standard_listing_data().final_sale_2_timestamp_seconds.0 * TO_NANO - 1
          }
          VestingTime::Initial => {
            standard_listing_data().final_sale_2_timestamp_seconds.0 * TO_NANO + 1
          }
          VestingTime::Cliff { passed_time } => {
            standard_listing_data().cliff_timestamp_seconds.0 * TO_NANO + passed_time
          }
          VestingTime::Finalized => {
            standard_listing_data().end_cliff_timestamp_seconds.0 * TO_NANO + 1
          }
        };

        testing_env!(get_context(
          vec![],
          1,
          1000,
          predecessor,
          base_time,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);
        let mut listing = standard_listing(contract.listings.len()).into_current();
        let vested_tokens =
          listing.calculate_vested_investor_withdraw(investor_allocations, base_time);
        let expected_transfer = vested_tokens - investor_already_withdrawn;
        listing.fund_listing();
        listing.buy_allocation(1_000_000_000_000_000_000_000_000, investor_allocations);
        listing.status = ListingStatus::SaleFinalized;
        listing.allocations_sold = investor_allocations;
        contract.listings.push(&VListing::V1(listing));

        contract
          .internal_deposit_storage_investor(&investor_correct, 1_000_000_000_000_000_000_000_000);

        let mut investor = contract.internal_get_investor(&investor_correct).unwrap();
        investor
          .allocation_count
          .insert(&0, &(investor_allocations, investor_already_withdrawn));
        contract.internal_update_investor(&investor_correct, investor);

        contract.withdraw_allocations(U64(0));

        let investor = contract.internal_get_investor(&investor_correct).unwrap();
        let allocation_count = investor.allocation_count.get(&0).unwrap();
        assert_eq!(allocation_count.0, investor_allocations);
        assert_eq!(allocation_count.1, vested_tokens);

        let receipts = get_created_receipts();
        assert_eq!(receipts.len(), 2);

        assert_eq!(
          receipts[0].receiver_id,
          standard_listing_data().project_token
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
            assert_eq!(deposit, 1);
            let json_args: serde_json::Value =
              serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
            assert_eq!(json_args["receiver_id"], investor_correct.to_string());
            assert_eq!(json_args["amount"], expected_transfer.to_string());
          }
          _ => panic!(),
        }

        assert_eq!(receipts[1].receiver_id, CONTRACT_ACCOUNT.parse().unwrap());
        assert_eq!(receipts[1].actions.len(), 1);
        match receipts[1].actions[0].clone() {
          VmAction::FunctionCall {
            function_name,
            args,
            gas: _,
            deposit,
          } => {
            assert_eq!(function_name, "callback_token_transfer_to_investor");
            assert_eq!(deposit, 0);
            let json_args: serde_json::Value =
              serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
            assert_eq!(json_args["investor_id"], investor_correct.to_string());
            assert_eq!(json_args["listing_id"], "0");
            assert_eq!(json_args["withdraw_amount"], expected_transfer.to_string());
          }
          _ => panic!(),
        }
      }
    }

    let allocation_size = standard_listing_data().token_allocation_size.0;
    let test_cases = [
      // 1. assert investor exists
      (
        false,
        VestingTime::Finalized,
        3,
        0,
        Some(ERR_004.to_string()),
      ),
      // 2. assert investor has allocations;
      (
        true,
        VestingTime::Finalized,
        0,
        0,
        Some(ERR_302.to_string()),
      ),
      // 3. assert sale is finalized;
      (true, VestingTime::NotFinalized, 3, 0, None),
      // 4. calculate vested tokens;
      // 6. update withdrawn count in investor balance;
      // 7. promise to transfer tokens to investor with fail safe callback;
      (true, VestingTime::Initial, 3, 0, None),
      (
        true,
        VestingTime::Cliff {
          passed_time: 100 * TO_NANO,
        },
        3,
        0,
        None,
      ),
      (
        true,
        VestingTime::Cliff {
          passed_time: 1000 * TO_NANO,
        },
        3,
        0,
        None,
      ),
      (
        true,
        VestingTime::Cliff {
          passed_time: 1_000_000_000 * TO_NANO,
        },
        3,
        0,
        None,
      ),
      (
        true,
        VestingTime::Cliff {
          passed_time: 1_500_000_000 * TO_NANO,
        },
        3,
        0,
        None,
      ),
      (true, VestingTime::Finalized, 3, 0, None),
      (true, VestingTime::Initial, 3, 0, None),
      (
        true,
        VestingTime::Cliff {
          passed_time: 1_000_000_000 * TO_NANO,
        },
        3,
        allocation_size,
        None,
      ),
      (
        true,
        VestingTime::Cliff {
          passed_time: 1_500_000_000 * TO_NANO,
        },
        3,
        allocation_size,
        None,
      ),
      (true, VestingTime::Finalized, 3, allocation_size * 2, None),
      (true, VestingTime::Initial, 3, 0, None),
      (
        true,
        VestingTime::Cliff {
          passed_time: 100 * TO_NANO,
        },
        3,
        allocation_size / 2,
        None,
      ),
      (
        true,
        VestingTime::Cliff {
          passed_time: 1000 * TO_NANO,
        },
        3,
        allocation_size / 2,
        None,
      ),
      (
        true,
        VestingTime::Cliff {
          passed_time: 1_000_000_000 * TO_NANO,
        },
        3,
        allocation_size / 2,
        None,
      ),
      (
        true,
        VestingTime::Cliff {
          passed_time: 1_500_000_000 * TO_NANO,
        },
        3,
        allocation_size / 2,
        None,
      ),
      (true, VestingTime::Finalized, 3, allocation_size / 2, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, v.3, counter), v.4);
      println!("{}", counter);
      counter += 1;
    });
  }

  /// decrease_membership_tier
  /// Method must:
  /// 1. assert one yocto;
  /// 2. assert investor is registered in storage;
  /// 3. assert lock period for staked tokens has passed;
  /// 4. assert withdraw requested amount is smaller or equal to staked balance;
  /// 5. reduce staked balance in the amount requested for withdrawal;
  /// 6. promise transfer staked tokens with fail safe callback;
  #[test]
  fn test_decrease_membership_tier() {
    fn closure_generator(
      one_yocto: bool,
      investor_exists: bool,
      lock_passed: bool,
      withdraw_size: u128,
      initial_balance: u128,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        let investor_correct: AccountId = format!("user{}.testnet", seed).parse().unwrap();
        let investor_incorrect = "dummy.testnet".parse().unwrap();

        let predecessor = if investor_exists {
          investor_correct.clone()
        } else {
          investor_incorrect
        };

        let deposit = if one_yocto { 1 } else { 0 };

        let base_time = 1_000_000_000_000_000_000;

        testing_env!(get_context(
          vec![],
          deposit,
          0,
          predecessor,
          base_time,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);
        contract
          .internal_deposit_storage_investor(&investor_correct, 1_000_000_000_000_000_000_000_000);

        let mut investor = contract.internal_get_investor(&investor_correct).unwrap();
        investor.staked_token = initial_balance;
        investor.last_check = if lock_passed {
          base_time - standard_settings().token_lock_period.0 - 1
        } else {
          base_time
        };
        contract.internal_update_investor(&investor_correct, investor);

        contract.decrease_membership_tier(U128(withdraw_size));

        let investor = contract.internal_get_investor(&investor_correct).unwrap();
        assert_eq!(investor.staked_token, initial_balance - withdraw_size);

        let receipts = get_created_receipts();
        assert_eq!(receipts.len(), 2);

        assert_eq!(
          receipts[0].receiver_id,
          contract.contract_settings.membership_token.clone()
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
            assert_eq!(deposit, 1);
            let json_args: serde_json::Value =
              serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
            assert_eq!(json_args["receiver_id"], investor_correct.to_string());
            assert_eq!(json_args["amount"], withdraw_size.to_string());
          }
          _ => panic!(),
        }

        assert_eq!(receipts[1].receiver_id, CONTRACT_ACCOUNT.parse().unwrap());
        assert_eq!(receipts[1].actions.len(), 1);
        match receipts[1].actions[0].clone() {
          VmAction::FunctionCall {
            function_name,
            args,
            gas: _,
            deposit,
          } => {
            assert_eq!(
              function_name,
              "callback_membership_token_transfer_to_investor"
            );
            assert_eq!(deposit, 0);
            let json_args: serde_json::Value =
              serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
            assert_eq!(json_args["investor_id"], investor_correct.to_string());
            assert_eq!(json_args["amount"], withdraw_size.to_string());
          }
          _ => panic!(),
        }
      }
    }

    let test_cases = [
      // 1. assert one yocto;
      (
        false,
        true,
        true,
        50,
        100,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 2. assert investor is registered in storage;
      (true, false, true, 50, 100, Some(ERR_004.to_string())),
      // 3. assert lock period for staked tokens has passed;
      (true, true, false, 50, 100, Some(ERR_209.to_string())),
      // 4. assert withdraw requested amount is smaller or equal to staked balance;
      (true, true, true, 150, 100, Some(ERR_208.to_string())),
      (true, true, true, 250, 100, Some(ERR_208.to_string())),
      (true, true, true, 101, 100, Some(ERR_208.to_string())),
      // 5. reduce staked balance in the amount requested for withdrawal;
      // 6. promise transfer staked tokens with fail safe callback;
      (true, true, true, 50, 100, None),
      (true, true, true, 1000, 5000, None),
      (true, true, true, 737, 6890, None),
    ];

    // one_yocto: bool,
    // investor_exists: bool,
    // lock_passed: bool,
    // withdraw_size: u128,
    // initial_balance: u128,
    // seed: u128,

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, v.3, v.4, counter), v.5);
      println!("{}", counter);
      counter += 1;
    });
  }
}
