//FtMint { owner_id: &owner ,amount:, memo: None}.emit();

use std::convert::TryInto;

use modified_contract_standards;
use modified_contract_standards::fungible_token::metadata::{
  FungibleTokenMetadata, FungibleTokenMetadataProvider,
};

use modified_contract_standards::fungible_token::FungibleToken;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::LazyOption;
use near_sdk::json_types::{U128, ValidAccountId};
use near_sdk::{env, log, near_bindgen, AccountId, Balance, PanicOnDefault, PromiseOrValue};
use modified_contract_standards::fungible_token::events::{FtBurn, FtMint};

pub mod errors;

use crate::errors::ERR_001;
pub mod burn;
pub mod mint;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
  owner_id: AccountId,
  token: FungibleToken,
  metadata: LazyOption<FungibleTokenMetadata>,
}

#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(owner_id: AccountId, init_supply: U128, metadata: FungibleTokenMetadata) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    metadata.assert_valid();
    assert!(
      env::is_valid_account_id(owner_id.as_bytes()),
      "Invalid owner account"
    );
    let mut this = Self {
      owner_id: owner_id.clone(),
      token: FungibleToken::new(b"a".to_vec()),
      metadata: LazyOption::new(b"m".to_vec(), Some(&metadata)),
    };
    this.token.internal_register_account(&owner_id);
    //transfering an initial supply to the owner - helps with visualization for the user
    this.token.internal_deposit(&owner_id, init_supply.into());
    FtMint {
      user_id: &owner_id,
      amount: &init_supply.0.to_string(),
      memo: Some("Initital Mint event on contract creation"),
    }
    .emit();

    this
  }

  fn on_account_closed(&mut self, account_id: AccountId, balance: Balance) {
    log!("Closed @{} with {}", account_id, balance);
  }

  fn on_tokens_minted(&mut self, user_id: AccountId, amount: Balance) {
    FtMint {
      user_id: &user_id,
      amount: &amount.to_string(),
      memo: Some("Mint event called by owner"),
    }
    .emit();
  }

  fn on_tokens_burned(&mut self, account_id: AccountId, amount: Balance, memo: Option<String>) {
    FtBurn {
      owner_id: &account_id,
      amount: &amount.to_string(),
      memo: memo.as_ref(),
    }
    .emit();
  }

  pub fn fix_admin(&mut self) {
    let new_admin: ValidAccountId = "admin2.jumpfinance.near".to_string().try_into().unwrap();
    let old_admin: ValidAccountId = "admin.jumpfinance.near".to_string().try_into().unwrap();
    let balance = self.token.ft_balance_of(old_admin.clone());
    self.token.internal_transfer(
      &"admin.jumpfinance.near".to_string(),
      &"admin2.jumpfinance.near".to_string(),
      balance.0,
      Some("admin_fix".to_string()),
    );
  }
}

modified_contract_standards::impl_fungible_token_core!(Contract, token, on_tokens_burned);
modified_contract_standards::impl_fungible_token_storage!(Contract, token, on_account_closed);

#[near_bindgen]
impl FungibleTokenMetadataProvider for Contract {
  fn ft_metadata(&self) -> FungibleTokenMetadata {
    self.metadata.get().unwrap()
  }
}

impl Contract {
  pub fn only_owner(&self) {
    assert_eq!(env::predecessor_account_id(), self.owner_id, "{}", ERR_001);
  }
}

//----------------------------------- TEST -------------------------------------------------

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {

  pub use near_sdk::{testing_env, Balance, MockedBlockchain, VMContext};
  pub use near_sdk::AccountId;
  pub use std::convert::{TryFrom, TryInto};

  use modified_contract_standards::fungible_token::metadata::{FT_METADATA_SPEC};
  pub use modified_contract_standards::fungible_token::core::FungibleTokenCore;

  pub use super::*;

  pub const CONTRACT_ACCOUNT: &str = "contract.testnet";
  pub const OWNER_ACCOUNT: &str = "owner.testnet";
  pub const SIGNER_ACCOUNT: &str = "signer.testnet";

  pub const TOKEN_NAME: &str = "TOKEN";
  pub const TOKEN_SYMBOL: &str = "XTK";
  pub const TOKEN_ICON: &str = "some.url";
  pub const TOKEN_DECIMALS: u8 = 18; //     x_token_decimals: u8,
  pub const INIT_SUPPLY: u128 = 1000;

  pub fn get_context(
    input: Vec<u8>,
    is_view: bool,
    attached_deposit: u128,
    account_balance: u128,
    signer_id: AccountId,
  ) -> VMContext {
    VMContext {
      current_account_id: CONTRACT_ACCOUNT.to_string(),
      signer_account_id: signer_id.clone(),
      signer_account_pk: vec![0, 1, 2],
      predecessor_account_id: signer_id.clone(),
      input,
      block_index: 0,
      block_timestamp: 0,
      account_balance,
      account_locked_balance: 0,
      storage_usage: 0,
      attached_deposit,
      prepaid_gas: 10u64.pow(18),
      random_seed: vec![0, 1, 2],
      is_view,
      output_data_receivers: vec![],
      epoch_height: 19,
    }
  }

  pub fn init_contract() -> Contract {
    Contract {
      owner_id: OWNER_ACCOUNT.to_string(),
      token: FungibleToken::new(b"a".to_vec()),
      metadata: LazyOption::new(b"m".to_vec(), Some(&get_test_meta())),
    }
  }

  pub fn get_test_meta() -> FungibleTokenMetadata {
    FungibleTokenMetadata {
      spec: FT_METADATA_SPEC.to_string(),
      name: TOKEN_NAME.to_string(),
      symbol: TOKEN_SYMBOL.to_string(),
      icon: Some(TOKEN_ICON.to_string()),
      reference: None,
      reference_hash: None,
      decimals: TOKEN_DECIMALS,
    }
  }

  #[test]
  fn test_new() {
    let context = get_context(vec![], false, 0, 0, OWNER_ACCOUNT.to_string()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);
    let contract = Contract::new(
      OWNER_ACCOUNT.to_string(),
      U128(INIT_SUPPLY),
      get_test_meta(),
    );
    let contract_metadata = contract.metadata.get().unwrap();

    assert_eq!(contract.ft_total_supply().0, INIT_SUPPLY);
    assert_eq!(
      contract
        .ft_balance_of(ValidAccountId::try_from(OWNER_ACCOUNT).unwrap())
        .0,
      INIT_SUPPLY
    );
    assert_eq!(contract_metadata.spec, get_test_meta().spec)
  }

  #[test]
  #[should_panic(expected = "The contract is not initialized")]
  fn test_default() {
    let context = get_context(vec![], false, 0, 0, OWNER_ACCOUNT.to_string());
    testing_env!(context);
    let _contract = Contract::default();
  }
  #[test]
  fn test_transfer() {
    let context = get_context(vec![], false, 1, 0, SIGNER_ACCOUNT.to_string());
    testing_env!(context);

    let deposit: u128 = 10;

    let mut contract = init_contract();

    //registring owner
    contract
      .token
      .internal_register_account(&OWNER_ACCOUNT.to_string());
    contract
      .token
      .internal_register_account(&SIGNER_ACCOUNT.to_string());
    contract
      .token
      .internal_deposit(&SIGNER_ACCOUNT.to_string(), deposit);

    let transfer_amount = 5;

    contract.ft_transfer(
      ValidAccountId::try_from(OWNER_ACCOUNT).unwrap(),
      U128(transfer_amount),
      None,
    );

    assert_eq!(
      contract
        .ft_balance_of(ValidAccountId::try_from(SIGNER_ACCOUNT).unwrap())
        .0,
      (deposit - transfer_amount)
    );
    assert_eq!(
      contract
        .ft_balance_of(ValidAccountId::try_from(OWNER_ACCOUNT).unwrap())
        .0,
      transfer_amount
    );
  }
}
