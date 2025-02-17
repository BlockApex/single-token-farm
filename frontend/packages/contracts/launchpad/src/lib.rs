use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedSet, Vector, LookupMap, UnorderedMap};
use near_sdk::json_types::{U128, U64};
use near_sdk::{
  env, near_bindgen, AccountId, Gas, Promise, PromiseResult, PromiseOrValue, PanicOnDefault,
  BorshStorageKey,
  utils::{assert_one_yocto},
};
use near_sdk::serde::{Serialize, Deserialize};
use near_sdk::serde_json;

use std::collections::{HashSet};

use crate::actions::guardian_actions::{ListingData};
use crate::token_handler::{TokenType};

pub use crate::listing::{VListing, Listing, SalePhase, ListingType, ListingStatus};
use crate::investor::{VInvestor, Investor};
use crate::errors::*;

mod actions;
mod errors;
mod events;
mod ext_interface;
mod investor;
mod listing;
mod token_handler;

pub const TO_NANO: u64 = 1_000_000_000;
pub const FRACTION_BASE: u128 = 10_000;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
#[cfg_attr(test, derive(Eq, PartialEq, Debug))]
pub struct ContractSettings {
  membership_token: AccountId,
  token_lock_period: U64,
  tiers_minimum_tokens: Vec<U128>,
  tiers_entitled_allocations: Vec<U64>, // number of allocations to which each tier of members is entitled in phase 1
  allowance_phase_2: U64, // number of allocations to which every user is entitled in phase 2
  partner_dex: AccountId,
}

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
  Guardians,
  Listings,
  ListingWhitelistLazyOption { listing_id: u64 },
  ListingWhitelist { listing_id: u64 },
  InvestorTreasury { account_id: AccountId },
  Investors,
  Treasury,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
  pub owner: AccountId,
  pub guardians: UnorderedSet<AccountId>,
  pub listings: Vector<VListing>,
  pub investors: LookupMap<AccountId, VInvestor>,
  pub treasury: UnorderedMap<TokenType, u128>,
  pub contract_settings: ContractSettings,
}

#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(owner: AccountId, contract_settings: ContractSettings) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    let initial_storage = env::storage_usage();
    let mut contract = Self {
      owner,
      guardians: UnorderedSet::new(StorageKey::Guardians),
      listings: Vector::new(StorageKey::Listings),
      investors: LookupMap::new(StorageKey::Investors),
      treasury: UnorderedMap::new(StorageKey::Treasury),
      contract_settings,
    };
    // adding the contract's account as an investor so that it will pay for
    // cost of storage for listings and other administrative data
    let current_account = env::current_account_id();
    let mut base_storage_account = Investor {
      account_id: current_account.clone(),
      storage_deposit: env::account_balance(),
      storage_used: 0,
      is_listing_owner: true,
      authorized_listing_creation: false,
      staked_token: 0,
      last_check: 0,
      allocation_count: UnorderedMap::new(StorageKey::InvestorTreasury {
        account_id: current_account.clone(),
      }),
    };
    contract.investors.insert(
      &env::current_account_id(),
      &VInvestor::new(current_account, 0),
    );
    base_storage_account.track_storage_usage(initial_storage);
    contract.investors.insert(
      &env::current_account_id(),
      &VInvestor::V1(base_storage_account),
    );
    contract
  }
}

// CRUD methods
impl Contract {
  pub fn internal_create_new_listing(&mut self, listing_data: ListingData) -> u64 {
    let listing_index = self.listings.len();
    let project_token = TokenType::FT {
      account_id: listing_data.project_token,
    };
    let price_token = TokenType::FT {
      account_id: listing_data.price_token,
    };
    self.internal_create_treasury_token(&project_token);
    self.internal_create_treasury_token(&price_token);
    let new_listing = VListing::new(
      listing_index,
      listing_data.project_owner,
      project_token,
      price_token,
      listing_data.listing_type,
      listing_data.open_sale_1_timestamp_seconds.0 * TO_NANO,
      listing_data.open_sale_2_timestamp_seconds.0 * TO_NANO,
      listing_data.final_sale_2_timestamp_seconds.0 * TO_NANO,
      listing_data.liquidity_pool_timestamp_seconds.0 * TO_NANO,
      listing_data.total_amount_sale_project_tokens.0,
      listing_data.token_allocation_size.0,
      listing_data.token_allocation_price.0,
      listing_data.liquidity_pool_project_tokens.0,
      listing_data.liquidity_pool_price_tokens.0,
      listing_data.fraction_instant_release.0,
      listing_data.fraction_cliff_release.0,
      listing_data.cliff_timestamp_seconds.0 * TO_NANO,
      listing_data.end_cliff_timestamp_seconds.0 * TO_NANO,
      listing_data.fee_price_tokens.0,
      listing_data.fee_liquidity_tokens.0,
    );
    self.listings.push(&new_listing);
    events::create_listing(new_listing);
    listing_index
  }

  fn internal_create_treasury_token(&mut self, token_type: &TokenType) {
    match self.treasury.get(token_type) {
      Some(_) => (),
      None => {
        self.treasury.insert(token_type, &0);
      }
    }
  }

  pub fn internal_get_listing(&self, listing_id: u64) -> Listing {
    self.listings.get(listing_id).expect(ERR_003).into_current()
  }

  pub fn internal_update_listing(&mut self, listing_id: u64, listing: Listing) {
    self.listings.replace(listing_id, &VListing::V1(listing));
  }

  pub fn internal_cancel_listing(&mut self, listing_id: u64) {
    let mut listing = self.internal_get_listing(listing_id);
    listing.cancel_listing();
    self.internal_update_listing(listing_id, listing);
    events::cancel_listing(U64(listing_id));
  }

  pub fn internal_withdraw_project_funds(&mut self, listing: Listing, listing_id: u64) -> Promise {
    let mut listing = listing;
    let promise = listing.withdraw_project_funds();
    self.internal_update_listing(listing_id, listing);
    promise
  }

  pub fn internal_get_investor(&self, account_id: &AccountId) -> Option<Investor> {
    match self.investors.get(account_id) {
      Some(v) => Some(v.into_current()),
      None => None,
    }
  }

  pub fn internal_update_investor(&mut self, account_id: &AccountId, investor: Investor) {
    self.investors.insert(account_id, &VInvestor::V1(investor));
  }

  pub fn internal_deposit_storage_investor(&mut self, account_id: &AccountId, deposit: u128) {
    let investor = match self.internal_get_investor(account_id) {
      Some(mut investor) => {
        investor.deposit_storage_funds(deposit);
        VInvestor::V1(investor)
      }
      None => VInvestor::new(account_id.clone(), deposit),
    };
    self.investors.insert(account_id, &investor);
  }

  pub fn internal_storage_withdraw_investor(
    &mut self,
    account_id: &AccountId,
    amount: u128,
  ) -> u128 {
    let mut investor = self.internal_get_investor(&account_id).expect(ERR_004);
    let available = investor.storage_funds_available();
    assert!(
      available > 0,
      "{}. No funds available for withdraw",
      ERR_201
    );
    let mut withdraw_amount = amount;
    if amount == 0 {
      withdraw_amount = available;
    }
    assert!(
      withdraw_amount <= available,
      "{}. Only {} available for withdraw",
      ERR_201,
      available
    );
    investor.withdraw_storage_funds(withdraw_amount);
    self.internal_update_investor(account_id, investor);
    withdraw_amount
  }

  pub fn check_investor_allowance(
    &self,
    investor: &Investor,
    listing_phase: &SalePhase,
    allocations_bought: u64,
    listing: &Listing,
  ) -> u64 {
    match listing.listing_type {
      ListingType::Public => {
        let investor_level =
          investor.get_current_membership_level(&self.contract_settings.tiers_minimum_tokens);
        let mut base_allowance = if investor_level == 0 {
          0
        } else {
          self
            .contract_settings
            .tiers_entitled_allocations
            .get(investor_level as usize - 1)
            .unwrap()
            .0
        };
        match listing_phase {
          SalePhase::Phase1 => (),
          SalePhase::Phase2 => base_allowance += self.contract_settings.allowance_phase_2.0,
        }
        if base_allowance >= allocations_bought {
          base_allowance - allocations_bought
        } else {
          0
        }
      }
      ListingType::Private => {
        let mut base_allowance =
          listing.check_private_sale_investor_allowance(&investor.account_id);
        match listing_phase {
          SalePhase::Phase1 => (),
          SalePhase::Phase2 => base_allowance += self.contract_settings.allowance_phase_2.0,
        }
        if base_allowance >= allocations_bought {
          base_allowance - allocations_bought
        } else {
          0
        }
      }
    }
  }

  pub fn internal_add_to_treasury(&mut self, token_type: &TokenType, amount: u128) -> u128 {
    match self.treasury.get(token_type) {
      Some(previous_value) => {
        let total = previous_value + amount;
        self.treasury.insert(token_type, &total);
        total
      }
      None => panic!("{}", ERR_007),
    }
  }

  pub fn internal_withdraw_from_treasury(&mut self, token_type: &TokenType, amount: u128) -> u128 {
    match self.treasury.get(token_type) {
      Some(previous_value) => {
        assert!(previous_value >= amount, "{}", ERR_008);
        let total = previous_value - amount;
        self.treasury.insert(token_type, &total);
        total
      }
      None => panic!("{}", ERR_007),
    }
  }
}

// helper methods
impl Contract {
  pub fn assert_owner(&self) {
    assert_one_yocto();
    assert_eq!(env::predecessor_account_id(), self.owner, "{}", ERR_001);
  }

  pub fn assert_owner_or_guardian(&self) {
    assert_one_yocto();
    let predecessor = env::predecessor_account_id();
    if predecessor != self.owner {
      assert!(self.guardians.contains(&predecessor), "{}", ERR_002);
    }
  }

  pub fn assert_project_owner(&mut self, listing_id: u64) -> Listing {
    assert_one_yocto();
    let listing = self.internal_get_listing(listing_id);
    listing.assert_owner(&env::predecessor_account_id());
    listing
  }
}

mod string {
  use std::fmt::Display;
  use near_sdk::serde::{Serializer};

  pub fn serialize<T, S>(value: &T, serializer: S) -> Result<S::Ok, S::Error>
  where
    T: Display,
    S: Serializer,
  {
    serializer.collect_str(value)
  }
}

mod string_option {
  use std::fmt::Display;
  use near_sdk::serde::{Serializer};

  pub fn serialize<T, S>(value: &Option<T>, serializer: S) -> Result<S::Ok, S::Error>
  where
    T: Display,
    S: Serializer,
  {
    match value {
      Some(number) => serializer.collect_str(number),
      None => serializer.serialize_none(),
    }
  }
}

#[cfg(test)]
mod tests {
  pub use near_sdk::{testing_env, Balance, MockedBlockchain, VMContext, Gas};
  pub use near_sdk::{VMConfig, RuntimeFeesConfig};
  pub use near_sdk::test_utils::{get_logs, get_created_receipts};
  pub use near_sdk::mock::{VmAction};
  pub use near_sdk::serde_json::{json};
  pub use near_sdk::collections::{LazyOption};

  pub use std::panic::{UnwindSafe, catch_unwind};
  pub use std::collections::{HashMap};
  pub use std::convert::{TryFrom, TryInto};
  pub use std::str::{from_utf8};

  pub use super::*;

  pub const CONTRACT_ACCOUNT: &str = "contract.testnet";
  pub const X_TOKEN_ACCOUNT: &str = "xtoken.testnet";
  pub const TOKEN_ACCOUNT: &str = "token.testnet";
  pub const PRICE_TOKEN_ACCOUNT: &str = "pricetoken.testnet";
  pub const OWNER_ACCOUNT: &str = "owner.testnet";
  pub const GUARDIAN_ACCOUNT: &str = "guardian.testnet";
  pub const PROJECT_ACCOUNT: &str = "project.testnet";
  pub const USER_ACCOUNT: &str = "user.testnet";
  pub const DEX_ACCOUNT: &str = "dex.testnet";

  /// This function can be used witha  higher order closure (that outputs
  /// other closures) to iteratively test diffent cenarios for a call
  pub fn run_test_case<F: FnOnce() -> R + UnwindSafe, R>(f: F, expected_panic_msg: Option<String>) {
    match expected_panic_msg {
      Some(expected) => match catch_unwind(f) {
        Ok(_) => panic!("call did not panic at all"),
        Err(e) => {
          if let Ok(panic_msg) = e.downcast::<String>() {
            assert!(
              panic_msg.contains(&expected),
              "panic messages did not match, found {}",
              panic_msg
            );
          } else {
            panic!("panic did not produce any msg");
          }
        }
      },
      None => {
        f();
      }
    }
  }

  pub fn get_context(
    input: Vec<u8>,
    attached_deposit: u128,
    account_balance: u128,
    signer_id: AccountId,
    block_timestamp: u64,
    prepaid_gas: Gas,
  ) -> VMContext {
    VMContext {
      current_account_id: CONTRACT_ACCOUNT.parse().unwrap(),
      signer_account_id: signer_id.clone(),
      signer_account_pk: vec![0; 33].try_into().unwrap(),
      predecessor_account_id: signer_id.clone(),
      input,
      block_index: 0,
      block_timestamp,
      account_balance,
      account_locked_balance: 0,
      storage_usage: 0,
      attached_deposit,
      prepaid_gas,
      random_seed: [0; 32],
      view_config: None,
      output_data_receivers: vec![],
      epoch_height: 19,
    }
  }

  pub fn init_contract(seed: u128) -> Contract {
    let hash1 = env::keccak256(&seed.to_be_bytes());
    let hash2 = env::keccak256(&hash1[..]);
    let hash3 = env::keccak256(&hash2[..]);
    let hash4 = env::keccak256(&hash3[..]);
    let mut contract = Contract {
      owner: OWNER_ACCOUNT.parse().unwrap(),
      guardians: UnorderedSet::new(hash1),
      listings: Vector::new(hash2),
      investors: LookupMap::new(hash3),
      treasury: UnorderedMap::new(hash4),
      contract_settings: standard_settings(),
    };
    let base_storage_account = Investor {
      account_id: CONTRACT_ACCOUNT.parse().unwrap(),
      storage_deposit: 1_000_000_000_000_000_000_000_000,
      storage_used: 10_000,
      is_listing_owner: false,
      authorized_listing_creation: false,
      staked_token: 0,
      last_check: 0,
      allocation_count: UnorderedMap::new(StorageKey::InvestorTreasury {
        account_id: CONTRACT_ACCOUNT.parse().unwrap(),
      }),
    };
    contract.investors.insert(
      &CONTRACT_ACCOUNT.parse().unwrap(),
      &VInvestor::V1(base_storage_account),
    );
    contract
  }

  pub fn standard_settings() -> ContractSettings {
    ContractSettings {
      membership_token: X_TOKEN_ACCOUNT.parse().unwrap(),
      token_lock_period: U64(1_000_000_000),
      tiers_minimum_tokens: vec![U128(10), U128(20), U128(30), U128(40), U128(50), U128(60)],
      tiers_entitled_allocations: vec![U64(1), U64(2), U64(4), U64(5), U64(9), U64(17)], // number of allocations to which each tier of members is entitled in phase 1
      allowance_phase_2: U64(2), // number of allocations to which every user is entitled in phase 2
      partner_dex: DEX_ACCOUNT.parse().unwrap(),
    }
  }

  pub fn standard_listing_data() -> ListingData {
    ListingData {
      project_owner: PROJECT_ACCOUNT.parse().unwrap(),
      project_token: TOKEN_ACCOUNT.parse().unwrap(),
      price_token: PRICE_TOKEN_ACCOUNT.parse().unwrap(),
      listing_type: ListingType::Public,
      open_sale_1_timestamp_seconds: U64(1_000_000_000),
      open_sale_2_timestamp_seconds: U64(2_000_000_000),
      final_sale_2_timestamp_seconds: U64(3_000_000_000),
      liquidity_pool_timestamp_seconds: U64(4_000_000_000),
      total_amount_sale_project_tokens: U128(1_000_000),
      token_allocation_size: U128(1_000),
      token_allocation_price: U128(500),
      liquidity_pool_project_tokens: U128(1_000),
      liquidity_pool_price_tokens: U128(800),
      fraction_instant_release: U128(2_000),
      fraction_cliff_release: U128(6_000),
      cliff_timestamp_seconds: U64(8_000_000_000),
      end_cliff_timestamp_seconds: U64(10_000_000_000),
      fee_price_tokens: U128(100),
      fee_liquidity_tokens: U128(100),
    }
  }

  pub fn standard_listing(listing_id: u64) -> VListing {
    let listing_data = standard_listing_data();
    VListing::new(
      listing_id,
      PROJECT_ACCOUNT.parse().unwrap(),
      TokenType::FT {
        account_id: listing_data.project_token,
      },
      TokenType::FT {
        account_id: listing_data.price_token,
      },
      ListingType::Public,
      listing_data.open_sale_1_timestamp_seconds.0 * TO_NANO,
      listing_data.open_sale_2_timestamp_seconds.0 * TO_NANO,
      listing_data.final_sale_2_timestamp_seconds.0 * TO_NANO,
      listing_data.liquidity_pool_timestamp_seconds.0 * TO_NANO,
      listing_data.total_amount_sale_project_tokens.0,
      listing_data.token_allocation_size.0,
      listing_data.token_allocation_price.0,
      listing_data.liquidity_pool_project_tokens.0,
      listing_data.liquidity_pool_price_tokens.0,
      listing_data.fraction_instant_release.0,
      listing_data.fraction_cliff_release.0,
      listing_data.cliff_timestamp_seconds.0 * TO_NANO,
      listing_data.end_cliff_timestamp_seconds.0 * TO_NANO,
      listing_data.fee_price_tokens.0,
      listing_data.fee_liquidity_tokens.0,
    )
  }

  #[test]
  fn test_new() {
    let context = get_context(
      vec![],
      0,
      1_000_000_000_000_000_000_000_000,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(300u64 * 10u64.pow(12)),
    );
    testing_env!(
      context,
      VMConfig::test(),
      RuntimeFeesConfig::test(),
      HashMap::default(),
      Vec::default()
    );

    let settings = standard_settings();

    let contract = Contract::new(OWNER_ACCOUNT.parse().unwrap(), settings.clone());

    assert_eq!(contract.owner, OWNER_ACCOUNT.parse().unwrap());
    assert_eq!(contract.contract_settings, settings);
  }

  #[test]
  #[should_panic(expected = "The contract is not initialized")]
  fn test_default() {
    let context = get_context(
      vec![],
      0,
      0,
      OWNER_ACCOUNT.parse().unwrap(),
      0,
      Gas(300u64 * 10u64.pow(12)),
    );
    testing_env!(context);
    let _contract = Contract::default();
  }
}
