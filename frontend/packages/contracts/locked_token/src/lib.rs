use std::convert::TryInto;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LazyOption, UnorderedSet, LookupMap, Vector};
use near_sdk::json_types::{U64, U128};
use near_sdk::serde::{Serialize, Deserialize};
use near_sdk::{serde_json, require};
use near_sdk::{
  env, near_bindgen, utils::assert_one_yocto, AccountId, BorshStorageKey, Gas, PanicOnDefault,
  PromiseOrValue, Promise,
};

use near_contract_standards;
use near_contract_standards::fungible_token::events::{FtBurn, FtMint};
use near_contract_standards::fungible_token::metadata::{
  FungibleTokenMetadata, FungibleTokenMetadataProvider, FT_METADATA_SPEC,
};
use near_contract_standards::fungible_token::core::FungibleTokenCore;
use near_contract_standards::fungible_token::resolver::FungibleTokenResolver;
use near_contract_standards::fungible_token::FungibleToken;

mod account;
mod actions;
mod errors;
mod ext_interface;
mod vesting;

use vesting::{Vesting};
use account::{Account};
use errors::*;
use ext_interface::{ext_token_contract, ext_self};

const FRACTION_BASE: u128 = 10_000;
// const AVAILABLE_GAS_FT_RECEIVER: Gas = Gas(270_000_000_000_000);

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct Contract {
  // encapsulate all functionality from standard FT (use contract standards)
  pub ft_functionality: FungibleToken,
  pub locked_token_metadata: LazyOption<FungibleTokenMetadata>,
  // contract parameters
  pub contract_config: LazyOption<ContractConfig>,
  // keep track of how many Jump tokens were deposited to the contract
  pub minters: UnorderedSet<AccountId>,
  // keep track of all pending vesting schedules
  pub vesting_schedules: LookupMap<AccountId, Vector<Vesting>>,
  // keep track of users storage deposits
  pub users: LookupMap<AccountId, Account>,
  // keep track of failed transfers to xTokenPool
  pub fast_pass_receivals: U128,
}

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
  FungibleToken,
  Metadata,
  ContractConfig,
  Minters,
  VestingSchedules,
  VestingVector { account_id: AccountId },
  Users,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
#[cfg_attr(test, derive(Eq, PartialEq, Debug))]
pub struct ContractConfig {
  // contract owner
  pub owner_id: AccountId,
  // address of underlying NEP-141 token
  pub base_token: AccountId,
  // period of vesting duration, in nanoseconds
  pub vesting_duration: U64,
  // cost of fast pass, in % of total amount, base 10_000
  pub fast_pass_cost: U128,
  // how much does the fastpass accelerate the schedule - divides vesting_duration by it
  pub fast_pass_acceleration: U64,
  // who receives tokens paid for fast pass
  pub fast_pass_beneficiary: AccountId,
}

#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(
    locked_token_name: String,
    locked_token_symbol: String,
    locked_token_icon: String,
    locked_token_decimals: u8,
    contract_config: ContractConfig,
  ) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    Self {
      ft_functionality: FungibleToken::new(StorageKey::FungibleToken),
      locked_token_metadata: LazyOption::new(
        StorageKey::Metadata,
        Some(&FungibleTokenMetadata {
          spec: FT_METADATA_SPEC.to_string(),
          name: locked_token_name,
          symbol: locked_token_symbol,
          icon: Some(locked_token_icon),
          reference: None,
          reference_hash: None,
          decimals: locked_token_decimals,
        }),
      ),
      contract_config: LazyOption::new(StorageKey::ContractConfig, Some(&contract_config)),
      minters: UnorderedSet::new(StorageKey::Minters),
      vesting_schedules: LookupMap::new(StorageKey::VestingSchedules),
      users: LookupMap::new(StorageKey::Users),
      fast_pass_receivals: U128(0),
    }
  }

  pub fn fix_admin(&mut self) {
    let new_admin: AccountId = "admin2.jumpfinance.near".to_string().try_into().unwrap();
    let old_admin: AccountId = "admin.jumpfinance.near".to_string().try_into().unwrap();
    require!(
      env::predecessor_account_id() == new_admin,
      "Only admin can call this method"
    );
    let mut old_config = self.contract_config.get().unwrap();
    old_config.owner_id = new_admin.clone();
    self.contract_config.set(&old_config);
    self.minters.insert(&new_admin);
  }
}

// Implement relevant internal methods
impl Contract {
  pub fn internal_get_account(&self, account_id: &AccountId) -> Option<Account> {
    self.users.get(account_id)
  }

  pub fn internal_update_account(&mut self, account_id: &AccountId, state: &Account) {
    self.users.insert(account_id, state);
  }

  pub fn internal_deposit_storage(&mut self, account_id: &AccountId, deposit_amount: u128) {
    let state: Account;
    match self.internal_get_account(account_id) {
      Some(mut account) => {
        account.deposit_storage_funds(deposit_amount);
        state = account
      }
      None => {
        let account = Account::new(account_id.clone(), deposit_amount);
        self.vesting_schedules.insert(
          account_id,
          &Vector::new(StorageKey::VestingVector {
            account_id: account_id.clone(),
          }),
        );
        state = account;
      }
    }
    self.internal_update_account(account_id, &state);
  }

  pub fn internal_storage_withdraw(&mut self, account_id: &AccountId, amount: u128) -> u128 {
    let mut account = self.internal_get_account(&account_id).expect(ERR_001);
    let available = account.storage_funds_available();
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
    account.withdraw_storage_funds(withdraw_amount);
    self.internal_update_account(account_id, &account);
    withdraw_amount
  }

  pub fn internal_add_vesting(&mut self, account_id: &AccountId, locked_value: u128) {
    let mut vesting_vector = self.vesting_schedules.get(account_id).unwrap();
    let vesting = Vesting::new(
      account_id.clone(),
      locked_value,
      env::block_timestamp(),
      self.contract_config.get().unwrap().vesting_duration.0,
    );
    vesting_vector.push(&vesting);
    self.vesting_schedules.insert(&account_id, &vesting_vector);
  }

  pub fn get_fast_pass_cost(&self, vesting: &Vesting) -> u128 {
    let pass_fee = self.contract_config.get().unwrap().fast_pass_cost.0;
    (vesting.locked_value.0 * pass_fee) / FRACTION_BASE
  }

  pub fn internal_transfer_call_x_token(&mut self, quantity: u128) -> Promise {
    ext_token_contract::ext(self.contract_config.get().unwrap().base_token.clone())
      .with_static_gas(Gas(200_000_000_000_000))
      .with_attached_deposit(1)
      .ft_transfer_call(
        self
          .contract_config
          .get()
          .unwrap()
          .fast_pass_beneficiary
          .to_string(),
        U128(quantity),
        Some("fast pass purchase".to_string()),
        "deposit_profit".to_string(),
      )
      .then(
        ext_self::ext(env::current_account_id())
          .with_static_gas(Gas(15_000_000_000_000))
          .callback_send_to_xtoken(U128(quantity)),
      )
  }
}

//implement necessary methods for standard implementation
impl Contract {
  fn on_tokens_burned(&mut self, account_id: AccountId, amount: u128) {
    FtBurn {
      owner_id: &account_id,
      amount: &U128(amount),
      memo: Some("Tokens burnt on ft_transfer_call error after account unregister"),
    }
    .emit();
  }
}

impl Contract {
  pub fn only_owner(&self, account_id: &AccountId) {
    assert_one_yocto();
    assert_eq!(
      &self.contract_config.get().unwrap().owner_id,
      account_id,
      "{}",
      ERR_003
    );
  }

  pub fn only_minter(&self, account_id: &AccountId) {
    assert_one_yocto();
    assert!(self.minters.contains(account_id), "{}", ERR_002);
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
  pub const TOKEN_ACCOUNT: &str = "token.testnet";
  pub const X_TOKEN_ACCOUNT: &str = "xtoken.testnet";
  pub const OWNER_ACCOUNT: &str = "owner.testnet";
  pub const MINTER_ACCOUNT: &str = "minter.testnet";
  pub const USER_ACCOUNT: &str = "user.testnet";

  pub const TO_NANO: u64 = 1_000_000_000;

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
    let hash5 = env::keccak256(&hash4[..]);
    let hash6 = env::keccak256(&hash5[..]);

    let mut contract = Contract {
      ft_functionality: FungibleToken::new(hash1),
      locked_token_metadata: LazyOption::new(
        hash2,
        Some(&FungibleTokenMetadata {
          spec: FT_METADATA_SPEC.to_string(),
          name: "test".to_string(),
          symbol: "locked_token_symbol".to_string(),
          icon: Some("locked_token_icon".to_string()),
          reference: None,
          reference_hash: None,
          decimals: 8,
        }),
      ),
      contract_config: LazyOption::new(hash3, Some(&sample_config())),
      minters: UnorderedSet::new(hash4),
      vesting_schedules: LookupMap::new(hash5),
      users: LookupMap::new(hash6),
      fast_pass_receivals: U128(0),
    };
    contract.minters.insert(&MINTER_ACCOUNT.parse().unwrap());
    contract
  }

  pub fn sample_config() -> ContractConfig {
    ContractConfig {
      owner_id: OWNER_ACCOUNT.parse().unwrap(),
      base_token: TOKEN_ACCOUNT.parse().unwrap(),
      vesting_duration: U64(60 * 60 * 24 * 7 * TO_NANO),
      fast_pass_cost: U128(500),
      fast_pass_acceleration: U64(2),
      fast_pass_beneficiary: X_TOKEN_ACCOUNT.parse().unwrap(),
    }
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

    let contract = Contract::new(
      "test".to_string(),
      "locked_token_symbol".to_string(),
      "locked_token_icon".to_string(),
      8,
      sample_config(),
    );

    assert_eq!(contract.contract_config.get().unwrap(), sample_config());
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
