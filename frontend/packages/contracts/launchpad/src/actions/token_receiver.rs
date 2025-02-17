/// Implement receivers for NEP-141
/// Redirects to other methods according to
/// msg logic
use crate::*;

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde", tag = "type")]
pub enum CallType {
  FundListing { listing_id: U64 },
  BuyAllocation { listing_id: U64 },
  VerifyAccount { membership_tier: U64 },
}

#[near_bindgen]
impl Contract {
  #[allow(unreachable_patterns)]
  pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> U128 {
    match serde_json::from_str::<CallType>(&msg).expect(ERR_301) {
      CallType::FundListing { listing_id } => {
        self.fund_listing(
          listing_id.0,
          amount.0,
          TokenType::FT {
            account_id: env::predecessor_account_id(),
          },
        );
        U128(0)
      }
      CallType::BuyAllocation { listing_id } => U128(self.buy_allocation(
        listing_id.0,
        amount.0,
        sender_id,
        TokenType::FT {
          account_id: env::predecessor_account_id(),
        },
      )),
      CallType::VerifyAccount { membership_tier } => U128(self.increase_membership_tier(
        sender_id,
        amount.0,
        membership_tier.0 as usize,
        env::predecessor_account_id(),
      )),
      _ => unimplemented!(),
    }
  }
}

#[cfg(test)]
mod tests {

  use crate::tests::*;
  use crate::listing::{SalePhase};

  /// fund_listing
  /// Method must:
  /// 1. assert transferred token is project token;
  /// 2. assert transferred quantity is correct;
  /// 3. assert listing has not yet been funded;
  /// 4. assert listing start time was not reached yet;
  /// 5. update listing treasury to reflect deposit;
  /// 6. update listing status to Funded;
  /// 7. emit funding event;
  #[test]
  fn test_fund_listing() {
    fn closure_generator(
      predecessor: AccountId,
      token_deposit: u128,
      status: ListingStatus,
      timestamp_passed: bool,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        let timestamp = if timestamp_passed {
          standard_listing_data().open_sale_1_timestamp_seconds.0 * TO_NANO + 10
        } else {
          standard_listing_data().open_sale_1_timestamp_seconds.0 * TO_NANO - 10
        };

        testing_env!(get_context(
          vec![],
          0,
          0,
          predecessor,
          timestamp,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);

        let mut listing = standard_listing(contract.listings.len()).into_current();

        listing.status = status;
        contract.listings.push(&VListing::V1(listing));

        contract.ft_on_transfer(
          USER_ACCOUNT.parse().unwrap(),
          U128(token_deposit),
          json!({
            "type": "FundListing",
            "listing_id": "0"
          })
          .to_string(),
        );

        let listing = contract.internal_get_listing(0);

        assert!(matches!(listing.status, ListingStatus::Funded));
        assert_eq!(
          listing.listing_treasury.presale_project_token_balance,
          listing.total_amount_sale_project_tokens
        );
        assert_eq!(
          listing
            .listing_treasury
            .liquidity_pool_project_token_balance,
          listing.liquidity_pool_project_tokens
        );

        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "jump_launchpad");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "project_fund_listing");

        let data: serde_json::Value = serde_blob["data"][0].clone();
        assert_eq!(data["listing_id"], "0");
        assert_eq!(
          data["tokens_sale"],
          listing.total_amount_sale_project_tokens.to_string()
        );
        assert_eq!(
          data["tokens_liquidity"],
          listing.liquidity_pool_project_tokens.to_string()
        );
      }
    }

    let correct_deposit = standard_listing_data().liquidity_pool_project_tokens.0
      + standard_listing_data().total_amount_sale_project_tokens.0;

    let test_cases = [
      // 1. assert transferred token is project token;
      (
        USER_ACCOUNT.parse().unwrap(),
        correct_deposit,
        ListingStatus::Unfunded,
        false,
        Some(ERR_104.to_string()),
      ),
      // 2. assert transferred quantity is correct;
      (
        TOKEN_ACCOUNT.parse().unwrap(),
        correct_deposit + 1,
        ListingStatus::Unfunded,
        false,
        Some(ERR_105.to_string()),
      ),
      // 3. assert listing has not yet been funded;
      (
        TOKEN_ACCOUNT.parse().unwrap(),
        correct_deposit,
        ListingStatus::Funded,
        false,
        Some(ERR_113.to_string()),
      ),
      // 4. assert listing start time was not reached yet;
      (
        TOKEN_ACCOUNT.parse().unwrap(),
        correct_deposit,
        ListingStatus::Unfunded,
        true,
        Some(ERR_114.to_string()),
      ),
      // 5. update listing treasury to reflect deposit;
      // 6. update listing status to Funded;
      // 7. emit funding event;
      (
        TOKEN_ACCOUNT.parse().unwrap(),
        correct_deposit,
        ListingStatus::Unfunded,
        false,
        None,
      ),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, v.3, counter), v.4);
      println!("{}", counter);
      counter += 1;
    });
  }

  /// buy_allocation
  /// Method must:
  /// 1. assert investor exists;
  /// 2. assert sent token is price_token;
  /// 3. assert investor is entitle to required quantity of allocations;
  /// 4. assert listing is open for sale
  /// 5. assert enough allocations left in listing
  /// 6. increase investor’s allocation count;
  /// 7. check investor storage deposit;
  /// 8. emit buy allocations event;
  /// 9. return leftover tokens to user;
  /// - Must not allow investor to decrease allocation count through this call
  #[test]
  fn test_buy_allocation() {
    fn closure_generator(
      investor_exists: bool,
      correct_token: bool,
      sale_phase: SalePhase,
      sale_not_initialized: bool,
      enough_price_token: bool,
      enough_allocations_left: bool,
      enough_storage: bool,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        let timestamp = if sale_not_initialized {
          standard_listing_data().open_sale_1_timestamp_seconds.0 * TO_NANO - 10
        } else {
          match sale_phase {
            SalePhase::Phase1 => {
              standard_listing_data().open_sale_1_timestamp_seconds.0 * TO_NANO + 10
            }
            SalePhase::Phase2 => {
              standard_listing_data().open_sale_2_timestamp_seconds.0 * TO_NANO + 10
            }
          }
        };

        let predecessor = if correct_token {
          standard_listing_data().price_token
        } else {
          USER_ACCOUNT.parse().unwrap()
        };

        testing_env!(get_context(
          vec![],
          0,
          0,
          predecessor,
          timestamp,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);
        let mut listing = standard_listing(contract.listings.len()).into_current();
        listing.fund_listing();

        listing.allocations_sold = if enough_allocations_left {
          0
        } else {
          ((listing.total_amount_sale_project_tokens / listing.token_allocation_size) - 1)
            .try_into()
            .unwrap()
        };
        let sale_phase = listing.get_current_sale_phase();

        let investor_correct = format!("user{}.testnet", seed).parse().unwrap();
        let investor_incorrect = "dummy.testnet".parse().unwrap();
        contract.internal_deposit_storage_investor(
          &investor_correct,
          if enough_storage {
            1_000_000_000_000_000_000_000_000
          } else {
            0
          },
        );
        let mut investor = contract.internal_get_investor(&investor_correct).unwrap();
        investor.staked_token = 1_000_000_000_000_000_000_000_000_000_000;
        contract.internal_update_investor(&investor_correct, investor);

        let mut allocations_to_buy = 3;
        let transfer_size = if enough_price_token {
          (allocations_to_buy * listing.token_allocation_price) + 10
        } else {
          (allocations_to_buy * listing.token_allocation_price) - 10
        };

        contract.listings.push(&VListing::V1(listing));

        let leftover = contract.ft_on_transfer(
          if investor_exists {
            investor_correct.clone()
          } else {
            investor_incorrect
          },
          U128(transfer_size),
          json!({
            "type": "BuyAllocation",
            "listing_id": "0"
          })
          .to_string(),
        );

        let mut leftover_goal = 10;
        let listing = contract.internal_get_listing(0);
        let investor = contract.internal_get_investor(&investor_correct).unwrap();

        if !enough_allocations_left {
          allocations_to_buy = 1;
          leftover_goal += listing.token_allocation_price * 2;
        }

        let allocations_sold = if enough_allocations_left {
          allocations_to_buy
        } else {
          listing.total_amount_sale_project_tokens / listing.token_allocation_size
        };

        assert_eq!(leftover.0, leftover_goal);
        assert_eq!(listing.allocations_sold as u128, allocations_sold);
        let expected_count: (u64, u128) = (allocations_to_buy.try_into().unwrap(), 0);
        assert_eq!(investor.allocation_count.get(&0).unwrap(), expected_count);

        let logs = get_logs();
        assert_eq!(logs.len(), 2);

        let event_log = logs.get(1).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "jump_launchpad");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "investor_buy_allocations");

        let data: serde_json::Value = serde_blob["data"][0].clone();
        assert_eq!(data["investor_id"], investor_correct.to_string());
        assert_eq!(data["listing_id"], "0");
        assert_eq!(data["sale_phase"], json!(sale_phase));
        assert_eq!(
          data["allocations_purchased"],
          allocations_to_buy.to_string()
        );
        assert_eq!(
          data["total_allocations_sold"],
          listing.allocations_sold.to_string()
        );
      }
    }

    let test_cases = [
      // 1. assert investor exists;
      (
        false,
        true,
        SalePhase::Phase1,
        false,
        true,
        true,
        true,
        Some(ERR_004.to_string()),
      ),
      // 2. assert sent token is price_token;
      (
        true,
        false,
        SalePhase::Phase1,
        false,
        true,
        true,
        true,
        Some(ERR_104.to_string()),
      ),
      // 3. assert investor is entitled to required quantity of allocations;
      (
        true,
        false,
        SalePhase::Phase1,
        false,
        true,
        true,
        true,
        Some(ERR_104.to_string()),
      ),
      // 4. assert listing is open for sale
      (
        true,
        true,
        SalePhase::Phase1,
        true,
        true,
        true,
        true,
        Some(ERR_106.to_string()),
      ),
      // 5. check investor storage deposit;
      (
        true,
        true,
        SalePhase::Phase1,
        false,
        true,
        true,
        false,
        Some(ERR_201.to_string()),
      ),
      // 6. assert enough allocations left in listing
      // 7. increase investor’s allocation count;
      // 8. emit buy allocations event;
      // 9. return leftover tokens to user;
      (
        true,
        true,
        SalePhase::Phase1,
        false,
        true,
        false,
        true,
        None,
      ),
      (true, true, SalePhase::Phase1, false, true, true, true, None),
      (
        true,
        true,
        SalePhase::Phase2,
        false,
        true,
        false,
        true,
        None,
      ),
      (true, true, SalePhase::Phase2, false, true, true, true, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(
        closure_generator(v.0, v.1, v.2, v.3, v.4, v.5, v.6, counter),
        v.7,
      );
      println!("{}", counter);
      counter += 1;
    });
  }

  /// increase_membership_tier
  /// Method must:
  /// 1. assert investor is registered in storage;
  /// 2. assert correct token was sent;
  /// 3. assert investor has enough staked tokens to reach desired membership level;
  /// 4. assert investor is trying to upgrade membership level (not trying to maliciously use the call to withdraw staked tokens)
  /// 5. update staked tokens in investor data;
  /// 6. emit stake event;
  /// 7. return excess tokens sent;
  #[test]
  fn test_increase_membership_tier() {
    fn closure_generator(
      investor_exists: bool,
      correct_token: bool,
      enough_to_upgrade: bool,
      initial_balance: u128,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        let predecessor = if correct_token {
          standard_settings().membership_token
        } else {
          USER_ACCOUNT.parse().unwrap()
        };

        let desired_tier: u64 = 4;
        let desired_tier_requirement = standard_settings()
          .tiers_minimum_tokens
          .get(desired_tier as usize - 1)
          .unwrap()
          .0;
        let deposit_value = if enough_to_upgrade {
          desired_tier_requirement + 150
        } else {
          desired_tier_requirement - 5 - initial_balance
        };

        let excess_tokens = if enough_to_upgrade {
          initial_balance + deposit_value - desired_tier_requirement
        } else {
          0
        };

        testing_env!(get_context(
          vec![],
          0,
          0,
          predecessor,
          0,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);
        let investor_correct = format!("user{}.testnet", seed).parse().unwrap();
        let investor_incorrect = "dummy.testnet".parse().unwrap();
        contract
          .internal_deposit_storage_investor(&investor_correct, 1_000_000_000_000_000_000_000_000);

        let mut investor = contract.internal_get_investor(&investor_correct).unwrap();
        investor.staked_token = initial_balance;
        contract.internal_update_investor(&investor_correct, investor);

        println!("{}", deposit_value);
        println!(
          "{}",
          json!({
            "type": "VerifyAccount",
            "membership_tier": U64(desired_tier)
          })
          .to_string(),
        );
        let leftover = contract.ft_on_transfer(
          if investor_exists {
            investor_correct.clone()
          } else {
            investor_incorrect
          },
          U128(deposit_value),
          json!({
            "type": "VerifyAccount",
            "membership_tier": U64(desired_tier)
          })
          .to_string(),
        );

        let investor = contract.internal_get_investor(&investor_correct).unwrap();

        assert_eq!(investor.staked_token, desired_tier_requirement);
        assert_eq!(leftover.0, excess_tokens);

        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "jump_launchpad");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "investor_stake_membership");

        let data: serde_json::Value = serde_blob["data"][0].clone();
        assert_eq!(data["investor_id"], investor_correct.to_string());
        assert_eq!(data["token_quantity"], desired_tier_requirement.to_string());
        assert_eq!(data["new_membership_level"], desired_tier.to_string());
      }
    }

    let test_cases = [
      // 1. assert investor is registered in storage;
      (false, true, true, 0, Some(ERR_004.to_string())),
      // 2. assert correct token was sent;
      (true, false, true, 0, Some(ERR_204.to_string())),
      // 3. assert investor has enough staked tokens to reach desired membership level;
      (true, true, false, 0, Some(ERR_206.to_string())),
      // 4. assert investor is trying to upgrade membership level (not trying to maliciously use the call to withdraw staked tokens)
      (
        true,
        true,
        true,
        standard_settings().tiers_minimum_tokens.get(4).unwrap().0,
        Some(ERR_207.to_string()),
      ),
      (true, true, true, 1040, Some(ERR_207.to_string())),
      // 5. update staked tokens in investor data;
      // 6. emit stake event;
      // 7. return excess tokens sent;
      (true, true, true, 0, None),
      (true, true, true, 3, None),
      (true, true, true, 30, None),
      (true, true, true, 40, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, v.3, counter), v.4);
      println!("{}", counter);
      counter += 1;
    });
  }
}
