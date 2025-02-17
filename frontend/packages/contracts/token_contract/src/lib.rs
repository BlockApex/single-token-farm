/*!
Fungible Token implementation with JSON serialization.
NOTES:
  - The maximum balance value is limited by U128 (2**128 - 1).
  - JSON calls should pass U128 as a base-10 string. E.g. "100".
  - The contract optimizes the inner trie structure by hashing account IDs. It will prevent some
    abuse of deep tries. Shouldn't be an issue, once NEAR clients implement full hashing of keys.
  - The contract tracks the change in storage before and after the call. If the storage increases,
    the contract requires the caller of the contract to attach enough deposit to the function call
    to cover the storage cost.
    This is done to prevent a denial of service attack on the contract by taking all available storage.
    If the storage decreases, the contract will issue a refund for the cost of the released storage.
    The unused tokens from the attached deposit are also refunded, so it's safe to
    attach more deposit than required.
  - To prevent the deployed contract from being modified or deleted, it should not have any access
    keys on its account.
*/

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

pub mod burn;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
  token: FungibleToken,
  metadata: LazyOption<FungibleTokenMetadata>,
}

#[near_bindgen]
impl Contract {
  /// Initializes the contract with the given total supply owned by the given `owner_id` with
  /// default metadata (for example purposes only).

  /// Initializes the contract with the given total supply owned by the given `owner_id` with
  /// the given fungible token metadata.
  #[init]
  pub fn new(owner_id: AccountId, total_supply: U128, metadata: FungibleTokenMetadata) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    metadata.assert_valid();
    assert!(
      env::is_valid_account_id(owner_id.as_bytes()),
      "Invalid owner account"
    );
    let mut this = Self {
      token: FungibleToken::new(b"a".to_vec()),
      metadata: LazyOption::new(b"m".to_vec(), Some(&metadata)),
    };
    this.token.internal_register_account(&owner_id);
    this.token.internal_deposit(&owner_id, total_supply.into());
    FtMint {
      user_id: &owner_id,
      amount: &total_supply.0.to_string(),
      memo: Some("Single Mint event on contract creation"),
    }
    .emit();

    this
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
  fn on_account_closed(&mut self, account_id: AccountId, balance: Balance) {
    log!("Closed @{} with {}", account_id, balance);
  }

  fn on_tokens_burned(&mut self, account_id: AccountId, amount: Balance, memo: Option<String>) {
    FtBurn {
      owner_id: &account_id,
      amount: &amount.to_string(),
      memo: memo.as_ref(),
    }
    .emit();
  }
}

// macro -  implementando o que ta la em cima no struct
modified_contract_standards::impl_fungible_token_core!(Contract, token, on_tokens_burned);
modified_contract_standards::impl_fungible_token_storage!(Contract, token, on_account_closed);

#[near_bindgen]
impl FungibleTokenMetadataProvider for Contract {
  fn ft_metadata(&self) -> FungibleTokenMetadata {
    self.metadata.get().unwrap()
  }
}

//----------------------------------- TEST -------------------------------------------------

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
  use near_sdk::MockedBlockchain;
  use near_sdk::{testing_env, VMContext, Balance};

  use super::*;
  use std::convert::TryFrom;

  use modified_contract_standards::fungible_token::metadata::{FT_METADATA_SPEC};

  pub const TOTAL_SUPPLY: Balance = 1_000;
  pub const CONTRACT_ACCOUNT: &str = "contract.testnet";
  pub const SIGNER_ACCOUNT: &str = "signer.testnet";
  pub const OWNER_ACCOUNT: &str = "owner.testnet";

  const DATA_IMAGE_SVG_NEAR_ICON: &str = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 288 288'%3E%3Cg id='l' data-name='l'%3E%3Cpath d='M187.58,79.81l-30.1,44.69a3.2,3.2,0,0,0,4.75,4.2L191.86,103a1.2,1.2,0,0,1,2,.91v80.46a1.2,1.2,0,0,1-2.12.77L102.18,77.93A15.35,15.35,0,0,0,90.47,72.5H87.34A15.34,15.34,0,0,0,72,87.84V201.16A15.34,15.34,0,0,0,87.34,216.5h0a15.35,15.35,0,0,0,13.08-7.31l30.1-44.69a3.2,3.2,0,0,0-4.75-4.2L96.14,186a1.2,1.2,0,0,1-2-.91V104.61a1.2,1.2,0,0,1,2.12-.77l89.55,107.23a15.35,15.35,0,0,0,11.71,5.43h3.13A15.34,15.34,0,0,0,216,201.16V87.84A15.34,15.34,0,0,0,200.66,72.5h0A15.35,15.35,0,0,0,187.58,79.81Z'/%3E%3C/g%3E%3C/svg%3E";

  // mock the context for testing, notice "signer_account_id" that was accessed above from env::
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

  pub fn get_test_meta() -> FungibleTokenMetadata {
    FungibleTokenMetadata {
      spec: FT_METADATA_SPEC.to_string(),
      name: "Example NEAR fungible token".to_string(),
      symbol: "EXAMPLE".to_string(),
      icon: Some(DATA_IMAGE_SVG_NEAR_ICON.to_string()),
      reference: None,
      reference_hash: None,
      decimals: 24,
    }
  }

  pub fn init_contract() -> Contract {
    Contract {
      token: FungibleToken::new(b"a".to_vec()),
      metadata: LazyOption::new(b"m".to_vec(), Some(&get_test_meta())),
    }
  }

  #[test]
  fn test_new() {
    let context = get_context(vec![], false, 0, 0, OWNER_ACCOUNT.to_string()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)

    testing_env!(context);
    let contract = Contract::new(
      OWNER_ACCOUNT.to_string(),
      TOTAL_SUPPLY.into(),
      get_test_meta(),
    );
    let contract_metadata = contract.metadata.get().unwrap();

    assert_eq!(contract.ft_total_supply().0, TOTAL_SUPPLY);
    assert_eq!(
      contract
        .ft_balance_of(ValidAccountId::try_from(OWNER_ACCOUNT).unwrap())
        .0,
      TOTAL_SUPPLY
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
      .internal_deposit(&SIGNER_ACCOUNT.to_string(), TOTAL_SUPPLY);

    let transfer_amount = 10;

    contract.ft_transfer(
      ValidAccountId::try_from(OWNER_ACCOUNT).unwrap(),
      U128(transfer_amount),
      None,
    );

    assert_eq!(
      contract
        .ft_balance_of(ValidAccountId::try_from(SIGNER_ACCOUNT).unwrap())
        .0,
      (TOTAL_SUPPLY - transfer_amount)
    );
    assert_eq!(
      contract
        .ft_balance_of(ValidAccountId::try_from(OWNER_ACCOUNT).unwrap())
        .0,
      transfer_amount
    );
  }
}
