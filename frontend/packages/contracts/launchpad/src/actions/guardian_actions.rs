// ### Guardian

// 1. Create new listings;
// 2. Alter listings non critical information before sale starts;

use crate::*;

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
#[cfg_attr(test, derive(Clone))]
pub struct ListingData {
  pub project_owner: AccountId,
  pub project_token: AccountId,
  pub price_token: AccountId,
  pub listing_type: ListingType,
  pub open_sale_1_timestamp_seconds: U64,
  pub open_sale_2_timestamp_seconds: U64,
  pub final_sale_2_timestamp_seconds: U64,
  pub liquidity_pool_timestamp_seconds: U64,
  pub total_amount_sale_project_tokens: U128,
  pub token_allocation_size: U128,
  pub token_allocation_price: U128,
  pub liquidity_pool_project_tokens: U128,
  pub liquidity_pool_price_tokens: U128,
  pub fraction_instant_release: U128,
  pub fraction_cliff_release: U128,
  pub cliff_timestamp_seconds: U64,
  pub end_cliff_timestamp_seconds: U64,
  pub fee_price_tokens: U128,
  pub fee_liquidity_tokens: U128,
}
#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  #[payable]
  pub fn create_new_listing(&mut self, listing_data: ListingData) -> u64 {
    assert!(
      listing_data.liquidity_pool_project_tokens == U128(0)
        && listing_data.liquidity_pool_price_tokens == U128(0),
      "Jump Dex integration not yet available, {}, {}",
      listing_data.liquidity_pool_project_tokens.0,
      listing_data.liquidity_pool_price_tokens.0
    );

    self.assert_owner_or_guardian();
    let initial_storage = env::storage_usage();
    let project_owner_account_id = listing_data.project_owner.clone();
    let mut project_owner_account = self
      .internal_get_investor(&project_owner_account_id)
      .expect(ERR_010);

    assert!(
      project_owner_account.authorized_listing_creation,
      "{}",
      ERR_115
    );

    let listing_id = self.internal_create_new_listing(listing_data);
    project_owner_account.track_storage_usage(initial_storage);
    project_owner_account.is_listing_owner = true;
    project_owner_account.authorized_listing_creation = false;
    self.internal_update_investor(&project_owner_account_id, project_owner_account);
    listing_id
  }

  #[payable]
  pub fn cancel_listing(&mut self, listing_id: U64) {
    self.assert_owner_or_guardian();
    self.internal_cancel_listing(listing_id.0);
  }
}

#[cfg(test)]
mod tests {

  use crate::tests::*;
  pub use super::*;

  /// create_new_listing
  /// Method must:
  /// 1. assert owner or guardian is caller;
  /// 2. assert one yocto;
  /// 3. assert listing_data is valid;
  ///    (a) Timestamps are sequential;
  ///    (b) fraction_instant_release is within FRACTION_BASE range;
  ///    (c) allocation size preciselly divides total_amount_sale_project_tokens
  ///    (d) (liquidity_pool_project_tokens / liquidity_pool_price_tokens) <=
  ///        (token_allocation_price / token_allocation_size)
  ///        to ensure that price on presale isn't larger than on DEX
  /// 4. assert enough storage in listing owner account;
  /// 5. assert listing owner is registered;
  /// 6. make listing_owner impossible to unregister;
  /// 7. create new listing in trie;
  /// 8. emit new listing event;
  #[test]
  fn test_create_new_listing() {
    fn closure_generator(
      caller: AccountId,
      deposit: u128,
      project_owner_registered: bool,
      enough_storage: bool,
      a: bool,
      b: bool,
      c: bool,
      d: bool,
      e: bool,
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
        let mut contract = init_contract(seed);
        contract
          .guardians
          .insert(&GUARDIAN_ACCOUNT.parse().unwrap());

        let mut listing_data = standard_listing_data();
        // temporarily set to 0, see audit(1)
        listing_data.liquidity_pool_project_tokens = U128(0);
        listing_data.liquidity_pool_price_tokens = U128(0);

        if a {
          listing_data.open_sale_2_timestamp_seconds =
            U64(listing_data.open_sale_1_timestamp_seconds.0 - 1);
        } else if b {
          listing_data.fraction_instant_release = U128(FRACTION_BASE + 10);
        } else if c {
          listing_data.token_allocation_size = U128(listing_data.token_allocation_size.0 + 1);
        } else if d {
          listing_data.token_allocation_price = U128(1);
          listing_data.token_allocation_size = U128(1);
          listing_data.liquidity_pool_project_tokens = U128(0);
          listing_data.liquidity_pool_price_tokens = U128(0);
          // temporarily comented out see audit(1)
          // listing_data.liquidity_pool_project_tokens = U128(2);
          // listing_data.liquidity_pool_price_tokens = U128(1);
        } else if e {
          listing_data.liquidity_pool_project_tokens = U128(0);
          listing_data.liquidity_pool_price_tokens = U128(0);
          // temporarily comented out see audit(1)
          // listing_data.liquidity_pool_project_tokens =
          //   U128(listing_data.liquidity_pool_project_tokens.0 * 1_000_000_000);
          // listing_data.liquidity_pool_price_tokens =
          //   U128(listing_data.liquidity_pool_price_tokens.0 * 1_000_000_000);
        }

        if project_owner_registered {
          let storage_deposit = if enough_storage {
            1_000_000_000_000_000_000_000_000
          } else {
            0
          };
          contract.internal_deposit_storage_investor(&listing_data.project_owner, storage_deposit);
          let mut investor = contract
            .internal_get_investor(&listing_data.project_owner)
            .unwrap();
          investor.authorized_listing_creation = true;
          contract.internal_update_investor(&listing_data.project_owner, investor)
        }

        let listing_id = contract.create_new_listing(listing_data.clone());

        let inserted_listing = contract.listings.get(listing_id).unwrap().into_current();
        assert_eq!(
          inserted_listing.open_sale_1_timestamp,
          listing_data.open_sale_1_timestamp_seconds.0 * TO_NANO
        );
        assert_eq!(
          inserted_listing.open_sale_2_timestamp,
          listing_data.open_sale_2_timestamp_seconds.0 * TO_NANO
        );
        assert_eq!(
          inserted_listing.final_sale_2_timestamp,
          listing_data.final_sale_2_timestamp_seconds.0 * TO_NANO
        );
        assert_eq!(
          inserted_listing.liquidity_pool_timestamp,
          listing_data.liquidity_pool_timestamp_seconds.0 * TO_NANO
        );
        assert_eq!(
          inserted_listing.total_amount_sale_project_tokens,
          listing_data.total_amount_sale_project_tokens.0
        );
        assert_eq!(
          inserted_listing.token_allocation_size,
          listing_data.token_allocation_size.0
        );
        assert_eq!(
          inserted_listing.token_allocation_price,
          listing_data.token_allocation_price.0
        );
        assert_eq!(
          inserted_listing.liquidity_pool_project_tokens,
          listing_data.liquidity_pool_project_tokens.0
        );
        assert_eq!(
          inserted_listing.liquidity_pool_price_tokens,
          listing_data.liquidity_pool_price_tokens.0
        );
        assert_eq!(
          inserted_listing.fraction_instant_release,
          listing_data.fraction_instant_release.0
        );
        // assert_eq!(inserted_listing.cliff_timestamp, listing.cliff_timestamp_seconds.0 * TO_NANO);
        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "jump_launchpad");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "create_listing");

        let data: serde_json::Value = serde_blob["data"][0].clone();
        assert_eq!(data["listing_data"], json!(VListing::V1(inserted_listing)));
      }
    }

    let test_cases = [
      // 1. assert owner or guardian is caller;
      (
        USER_ACCOUNT.parse().unwrap(),
        1,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        Some(ERR_002.to_string()),
      ),
      // 2. assert one yocto;
      (
        OWNER_ACCOUNT.parse().unwrap(),
        0,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 3. assert listing_data is valid;
      //    (a) Timestamps are sequential;
      (
        OWNER_ACCOUNT.parse().unwrap(),
        1,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        Some(ERR_108.to_string()),
      ),
      //    (b) fraction_instant_release is within FRACTION_BASE range;
      (
        OWNER_ACCOUNT.parse().unwrap(),
        1,
        true,
        true,
        false,
        true,
        false,
        false,
        false,
        Some(ERR_110.to_string()),
      ),
      //    (c) allocation size preciselly divides total_amount_sale_project_tokens
       
      // temporarily comented out see audit(1)
      // (
      //   OWNER_ACCOUNT.parse().unwrap(),
      //   1,
      //   true,
      //   true,
      //   false,
      //   false,
      //   true,
      //   false,
      //   false,
      //   Some(ERR_109.to_string()),
      // ),

      //    (d) (liquidity_pool_project_tokens / liquidity_pool_price_tokens) <=
      //        (token_allocation_price / token_allocation_size)
      //        to ensure that price on presale isn't larger than on DEX
      
      // temporarily comented out see audit(1)
      // (
      //   OWNER_ACCOUNT.parse().unwrap(),
      //   1,
      //   true,
      //   true,
      //   false,
      //   false,
      //   false,
      //   true,
      //   false,
      //   Some(ERR_111.to_string()),
      // ),

      //    (e) liquidity_pool_price_tokens) <=
      //        (token_allocation_price * token_allocation_size)
      //        to ensure there will be enough price tokens to build
      //        dex liquidity
      
      // temporarily comented out see audit(1)
      // (
      //   OWNER_ACCOUNT.parse().unwrap(),
      //   1,
      //   true,
      //   true,
      //   false,
      //   false,
      //   false,
      //   false,
      //   true,
      //   Some(ERR_112.to_string()),
      // ),

      // 4. assert enough storage in listing owner account;
      (
        OWNER_ACCOUNT.parse().unwrap(),
        1,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        Some(ERR_201.to_string()),
      ),
      (
        OWNER_ACCOUNT.parse().unwrap(),
        1,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        Some(ERR_010.to_string()),
      ),
      // 5. assert listing owner is registered;
      // 6. make listing_owner impossible to unregister;
      // 7. create new listing in trie;
      // 8. emit new listing event;
      (
        OWNER_ACCOUNT.parse().unwrap(),
        1,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        None,
      ),
      (
        GUARDIAN_ACCOUNT.parse().unwrap(),
        1,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        None,
      ),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(
        closure_generator(v.0, v.1, v.2, v.3, v.4, v.5, v.6, v.7, v.8, counter),
        v.9,
      );
      println!("counter: {}", counter);
      counter += 1;
    });
  }

  /// cancel_listing
  /// Method must:
  /// 1. assert owner or guardian is caller;
  /// 2. assert one yocto;
  /// 3. assert sale phase has not yet started
  /// 4. change listing status to cancelled;
  /// 5. emit cancel listing event;
  #[test]
  fn test_cancel_listing() {
    fn closure_generator(
      caller: AccountId,
      deposit: u128,
      sale_started: bool,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        let timestamp: u64;

        timestamp = if sale_started {
          standard_listing_data().open_sale_1_timestamp_seconds.0 * TO_NANO + 1
        } else {
          standard_listing_data().open_sale_1_timestamp_seconds.0 * TO_NANO - 1
        };

        testing_env!(get_context(
          vec![],
          deposit,
          0,
          caller,
          timestamp,
          Gas(300u64 * 10u64.pow(12)),
        ));
        let mut contract = init_contract(seed);
        contract
          .guardians
          .insert(&GUARDIAN_ACCOUNT.parse().unwrap());

        let mut listing = standard_listing(contract.listings.len()).into_current();

        listing.status = ListingStatus::Funded;

        contract.listings.push(&VListing::V1(listing));

        contract.cancel_listing(U64(0));

        let listing = contract.listings.get(0).unwrap().into_current();

        assert!(matches!(listing.status, ListingStatus::Cancelled));

        // assert_eq!(inserted_listing.cliff_timestamp, listing.cliff_timestamp_seconds.0 * TO_NANO);
        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "jump_launchpad");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "cancel_listing");

        let data: serde_json::Value = serde_blob["data"][0].clone();
        assert_eq!(data["listing_id"], "0");
      }
    }

    let test_cases = [
      // 1. assert owner or guardian is caller;
      (
        USER_ACCOUNT.parse().unwrap(),
        1,
        true,
        Some(ERR_002.to_string()),
      ),
      // 2. assert one yocto;
      (
        OWNER_ACCOUNT.parse().unwrap(),
        0,
        true,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 3. assert sale phase has not yet started
      (
        OWNER_ACCOUNT.parse().unwrap(),
        1,
        true,
        Some(ERR_101.to_string()),
      ),
      // 4. change listing status to cancelled;
      // 5. emit cancel listing event;
      (OWNER_ACCOUNT.parse().unwrap(), 1, false, None),
      (GUARDIAN_ACCOUNT.parse().unwrap(), 1, false, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, counter), v.3);
      println!("counter: {}", counter);
      counter += 1;
    });
  }
}
