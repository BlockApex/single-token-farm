use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::LazyOption;
use near_sdk::json_types::{U128, U64};
use near_sdk::serde_json::json;
use near_sdk::{
  env, log, near_bindgen, utils::assert_one_yocto, AccountId, Balance, BorshStorageKey, Gas,
  PanicOnDefault, PromiseOrValue, PromiseResult,
};

use near_contract_standards;
use near_contract_standards::fungible_token::events::{FtBurn, FtMint};
use near_contract_standards::fungible_token::metadata::{
  FungibleTokenMetadata, FungibleTokenMetadataProvider, FT_METADATA_SPEC,
};
use near_contract_standards::fungible_token::FungibleToken;
use std::convert::TryInto;

use uint::construct_uint;

pub mod actions;
pub mod errors;
pub mod ext_interface;

// U1024 with 256 bits consisting of 4 x 64-bit words
construct_uint! {
  pub struct U256(4);
}

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct Contract {
  // encapsulate all functionality from standard FT (use contract standards)
  pub ft_functionality: FungibleToken,
  pub x_token_metadata: LazyOption<FungibleTokenMetadata>,
  // reference contract of Jump token
  pub base_token: AccountId,
  // keep track of how many Jump tokens wre deposited to the contract
  pub base_token_treasury: u128,
}

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
  FungibleToken,
  Metadata,
}

#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(
    x_token_name: String,
    x_token_symbol: String,
    x_token_icon: String,
    x_token_decimals: u8,
    base_token_address: String,
  ) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    Self {
      ft_functionality: FungibleToken::new(StorageKey::FungibleToken),
      x_token_metadata: LazyOption::new(
        StorageKey::Metadata,
        Some(&FungibleTokenMetadata {
          spec: FT_METADATA_SPEC.to_string(),
          name: x_token_name,
          symbol: x_token_symbol,
          icon: Some(x_token_icon),
          reference: None,
          reference_hash: None,
          decimals: x_token_decimals,
        }),
      ),
      base_token: base_token_address.try_into().unwrap(),
      base_token_treasury: 0,
    }
  }
}

// Implement relevant internal methods
impl Contract {
  // this function will be called through ft_on_trasnfer - validation of tokens happens on end function
  pub fn internal_mint_x_token(&mut self, quantity_deposited: u128, recipient: AccountId) {
    // calculate the correct proportion

    let x_token_emission;
    if self.base_token_treasury == 0 {
      x_token_emission = quantity_deposited;
    } else {
      x_token_emission = ((U256::from(quantity_deposited)
        * U256::from(self.ft_functionality.total_supply))
        / U256::from(self.base_token_treasury))
      .try_into()
      .unwrap();
    }
    // add tokens to recipient
    self
      .ft_functionality
      .internal_deposit(&recipient, x_token_emission);
    // add base tokens to treasury
    self.base_token_treasury += quantity_deposited;
    // log mint event
    let memo_string = &json!({
      "type": "mint_x_token",
      "normal_token_deposit": U128(quantity_deposited),
      "base_token_treasury_after_deposit": U128(self.base_token_treasury),
      "x_token_supply_after_deposit": U128(self.ft_functionality.total_supply),
      "timestamp": U64(env::block_timestamp())
    })
    .to_string();
    FtMint {
      owner_id: &recipient,
      amount: &U128(x_token_emission),
      memo: Some(memo_string),
    }
    .emit();
  }
  // this function will be called through public burn function - function will later call ft_transfer on normal token.
  // in case ft_transfer fails, will call revert burn_x_token
  pub fn internal_burn_x_token(&mut self, quantity_to_burn: u128, recipient: AccountId) -> u128 {
    // calculate correct proportion
    let normal_token_withdraw = ((U256::from(quantity_to_burn)
      * U256::from(self.base_token_treasury))
      / U256::from(self.ft_functionality.total_supply))
    .try_into()
    .unwrap();
    // burn xTokens
    self
      .ft_functionality
      .internal_withdraw(&recipient, quantity_to_burn);
    // reduce base_token_treasury
    self.base_token_treasury -= normal_token_withdraw;
    // log burn event
    let memo_string = &json!({
      "normal_token_withdraw": U128(normal_token_withdraw),
      "base_token_treasury_after_deposit": U128(self.base_token_treasury),
      "x_token_supply_after_deposit": U128(self.ft_functionality.total_supply),
      "timestamp": U64(env::block_timestamp())
    })
    .to_string();
    FtBurn {
      owner_id: &recipient,
      amount: &U128(quantity_to_burn),
      memo: Some(memo_string),
    }
    .emit();
    // return equivalent normal token value
    normal_token_withdraw
  }

  pub fn internal_revert_burn_x_token(
    &mut self,
    quantity_burnt: u128,
    recipient: AccountId,
    normal_tokens_released: u128,
  ) {
    // add burnt tokens back to user
    self
      .ft_functionality
      .internal_deposit(&recipient, quantity_burnt);
    // reinstate base_token_treasury
    self.base_token_treasury += normal_tokens_released;
    // log revert_burn event
    let memo_string = &json!({
      "type": "revert_burn_x_token",
      "normal_token_deposit": U128(normal_tokens_released),
      "base_token_treasury_after_deposit": U128(self.base_token_treasury),
      "x_token_supply_after_deposit": U128(self.ft_functionality.total_supply),
      "timestamp": U64(env::block_timestamp())
    })
    .to_string();
    FtMint {
      owner_id: &recipient,
      amount: &U128(quantity_burnt),
      memo: Some(memo_string),
    }
    .emit();
  }

  pub fn internal_deposit_jump_profits(&mut self, quantity_deposited: u128) {
    self.base_token_treasury += quantity_deposited;
    // log profit earning event
    log!(
      "EVENT_JSON:{}",
      &json!({
        "standard": "HacXtoken",
        "version": "1.0.0",
        "event": "profit_deposit",
        "data": [{
          "quantity_deposited": U128(quantity_deposited),
          "base_token_treasury_after_deposit": U128(self.base_token_treasury),
          "x_token_supply_after_deposit": U128(self.ft_functionality.total_supply),
          "timestamp": U64(env::block_timestamp())
        }]
      })
      .to_string()
    )
  }
}

//implement necessary methods for standard implementation
impl Contract {
  fn on_account_closed(&mut self, account_id: AccountId, balance: Balance) {
    log!("Closed @{} with {}", account_id, balance);
  }
  fn on_tokens_burned(&mut self, account_id: AccountId, amount: u128) {
    FtBurn {
      owner_id: &account_id,
      amount: &U128(amount),
      memo: None,
    }
    .emit();
  }
}

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
  pub use near_sdk::AccountId;
  pub use near_sdk::{testing_env, Balance, VMContext};
  pub use std::convert::{TryFrom, TryInto};

  pub use near_contract_standards::fungible_token::core::FungibleTokenCore;

  use super::*;
  pub const GAS: Gas = Gas(300 * 10u64.pow(12));

  pub const CONTRACT_ACCOUNT: &str = "contract.testnet";
  pub const SIGNER_ACCOUNT: &str = "signer.testnet";
  pub const OWNER_ACCOUNT: &str = "owner.testnet";

  pub const X_TOKEN_NAME: &str = "XTOKEN";
  pub const X_TOKEN_SYMBOL: &str = "XTK";
  pub const X_TOKEN_ICON: &str = "some.url";
  pub const X_TOKEN_DECIMALS: u8 = 24; //     x_token_decimals: u8,
  pub const BASE_TOKEN_ADDRESS: &str = "token.testnet";

  // mock the context for testing, notice "signer_account_id" that was accessed above from env::
  pub fn get_context(
    input: Vec<u8>,
    attached_deposit: u128,
    account_balance: u128,
    signer_id: AccountId,
  ) -> VMContext {
    VMContext {
      current_account_id: CONTRACT_ACCOUNT.parse().unwrap(),
      signer_account_id: signer_id.clone(),
      signer_account_pk: vec![0u8; 33].try_into().unwrap(),
      predecessor_account_id: signer_id.clone(),
      input,
      block_index: 0,
      block_timestamp: 0,
      account_balance,
      account_locked_balance: 0,
      storage_usage: 0,
      attached_deposit,
      prepaid_gas: GAS,
      view_config: None,
      random_seed: [0u8; 32],
      output_data_receivers: vec![],
      epoch_height: 19,
    }
  }

  pub fn get_test_meta() -> FungibleTokenMetadata {
    FungibleTokenMetadata {
      spec: FT_METADATA_SPEC.to_string(),
      name: X_TOKEN_NAME.to_string(),
      symbol: X_TOKEN_SYMBOL.to_string(),
      icon: Some(X_TOKEN_ICON.to_string()),
      reference: None,
      reference_hash: None,
      decimals: X_TOKEN_DECIMALS,
    }
  }

  pub fn init_contract(base_token_treasury: u128) -> Contract {
    Contract {
      ft_functionality: FungibleToken::new(StorageKey::FungibleToken),
      x_token_metadata: LazyOption::new(StorageKey::Metadata, Some(&get_test_meta())),
      base_token: BASE_TOKEN_ADDRESS.parse().unwrap(),
      base_token_treasury: base_token_treasury,
    }
  }

  #[test]
  fn test_new() {
    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)

    //context.is_view();

    testing_env!(context);
    let contract = Contract::new(
      X_TOKEN_NAME.to_string(),
      X_TOKEN_SYMBOL.to_string(),
      X_TOKEN_ICON.to_string(),
      X_TOKEN_DECIMALS,
      BASE_TOKEN_ADDRESS.to_string(),
    );

    let contract_metadata = contract.x_token_metadata.get().unwrap();
    assert_eq!(contract_metadata.spec, get_test_meta().spec);
    assert_eq!(contract.base_token, BASE_TOKEN_ADDRESS.parse().unwrap());
    assert_eq!(contract.base_token_treasury, 0);
  }

  #[test]
  #[should_panic(expected = "The contract is not initialized")]
  fn test_default() {
    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.parse().unwrap());
    testing_env!(context);
    let _contract = Contract::default();
  }

  #[test]
  fn test_internal_mint_with_0_treasury() {
    let quantity_deposited = 10;
    let recipient: AccountId = SIGNER_ACCOUNT.parse().unwrap();

    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    let mut contract = init_contract(0);
    contract
      .ft_functionality
      .internal_register_account(&OWNER_ACCOUNT.parse().unwrap());
    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.parse().unwrap());

    let user_balance_before_mint = contract.ft_functionality.ft_balance_of(recipient.clone());
    contract.internal_mint_x_token(quantity_deposited, recipient.clone());

    //when depositing tokens for the first timw, the treasury should be equal to the amount deposited
    assert_eq!(contract.base_token_treasury, quantity_deposited);

    assert_eq!(
      contract.ft_functionality.ft_balance_of(recipient),
      U128(quantity_deposited + u128::from(user_balance_before_mint))
    );
  }

  #[test]
  fn test_internal_mint_with_less_xtoken_then_jump() {
    let quantity_deposited = 10;
    let recipient: AccountId = SIGNER_ACCOUNT.parse().unwrap();

    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    // initialize the contract with initial balance
    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 100;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&OWNER_ACCOUNT.clone().parse().unwrap());
    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.parse().unwrap());

    // Deposit 100 tokens on the contract - this will change the ft total supply
    contract.ft_functionality.internal_deposit(
      &OWNER_ACCOUNT.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );

    let user_balance_before_mint = contract.ft_functionality.ft_balance_of(recipient.clone());

    contract.internal_mint_x_token(quantity_deposited, recipient.clone());

    assert_eq!(
      contract.base_token_treasury,
      quantity_deposited + initial_amount_of_jump
    );

    assert_eq!(
      contract.ft_functionality.ft_balance_of(recipient),
      U128(
        u128::from(user_balance_before_mint)
          + (quantity_deposited * initial_amount_of_xtoken / initial_amount_of_jump)
      )
    );
  }

  #[test]
  fn test_internal_mint_with_same_xtoken_and_jump() {
    let quantity_deposited = 10;
    let recipient: AccountId = SIGNER_ACCOUNT.parse().unwrap();

    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    // initialize the contract with initial balance
    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 10;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&OWNER_ACCOUNT.clone().parse().unwrap());
    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.parse().unwrap());

    // Deposit 100 tokens on the contract - this will change the ft total supply
    contract.ft_functionality.internal_deposit(
      &OWNER_ACCOUNT.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );

    let user_balance_before_mint = contract.ft_functionality.ft_balance_of(recipient.clone());

    contract.internal_mint_x_token(quantity_deposited, recipient.clone());

    assert_eq!(
      contract.base_token_treasury,
      quantity_deposited + initial_amount_of_jump
    );

    assert_eq!(
      contract.ft_functionality.ft_balance_of(recipient),
      U128(
        u128::from(user_balance_before_mint)
          + (quantity_deposited * initial_amount_of_xtoken / initial_amount_of_jump)
      )
    );
  }

  #[test]
  fn test_internal_burn_with_same_xtoken_and_jump() {
    let quantity_to_burn = 5;
    let recipient: AccountId = SIGNER_ACCOUNT.parse().unwrap();

    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    // initialize the contract with initial balance
    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 10;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&OWNER_ACCOUNT.clone().parse().unwrap());
    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.parse().unwrap());

    // Deposit tokens on the contract - this will change the ft total supply
    contract.ft_functionality.internal_deposit(
      &SIGNER_ACCOUNT.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );

    let user_balance_before_burn = contract.ft_functionality.ft_balance_of(recipient.clone());

    contract.internal_burn_x_token(quantity_to_burn, recipient.clone());

    assert_eq!(
      contract.ft_functionality.ft_balance_of(recipient),
      U128(u128::from(user_balance_before_burn) - quantity_to_burn)
    );

    assert_eq!(
      contract.base_token_treasury,
      initial_amount_of_jump
        - (quantity_to_burn * initial_amount_of_jump / initial_amount_of_xtoken)
    );
  }

  #[test]
  fn test_internal_burn_with_less_xtoken_then_jump() {
    let quantity_to_burn = 5;
    let recipient: AccountId = SIGNER_ACCOUNT.parse().unwrap();

    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    // initialize the contract with initial balance
    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 100;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&OWNER_ACCOUNT.clone().parse().unwrap());
    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.parse().unwrap());

    // Deposit tokens on the contract - this will change the ft total supply
    contract.ft_functionality.internal_deposit(
      &SIGNER_ACCOUNT.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );

    let user_balance_before_burn = contract.ft_functionality.ft_balance_of(recipient.clone());

    contract.internal_burn_x_token(quantity_to_burn, recipient.clone());

    assert_eq!(
      contract.ft_functionality.ft_balance_of(recipient),
      U128(u128::from(user_balance_before_burn) - quantity_to_burn)
    );

    assert_eq!(
      contract.base_token_treasury,
      initial_amount_of_jump
        - (quantity_to_burn * initial_amount_of_jump / initial_amount_of_xtoken)
    );
  }

  #[test]
  #[should_panic(expected = "The account doesn't have enough balance")]
  fn test_internal_burn_without_balance() {
    let quantity_to_burn = 10;
    let recipient: AccountId = SIGNER_ACCOUNT.parse().unwrap();

    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    // initialize the contract with initial balance
    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 10;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&OWNER_ACCOUNT.clone().parse().unwrap());
    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.parse().unwrap());

    // Deposit tokens on the contract - this will change the ft total supply
    // THE SIGNER ACCOUNT HAS NO BALANCE
    contract.ft_functionality.internal_deposit(
      &OWNER_ACCOUNT.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );

    let user_balance_before_burn = contract.ft_functionality.ft_balance_of(recipient.clone());

    contract.internal_burn_x_token(quantity_to_burn, recipient.clone());

    assert_eq!(
      contract.ft_functionality.ft_balance_of(recipient),
      U128(u128::from(user_balance_before_burn) - quantity_to_burn)
    );

    assert_eq!(
      contract.base_token_treasury,
      initial_amount_of_jump
        - (quantity_to_burn * initial_amount_of_jump / initial_amount_of_xtoken)
    );
  }
}
