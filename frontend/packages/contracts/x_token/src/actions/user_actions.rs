use crate::errors::{ERR_001, ERR_002, ERR_003};
use crate::ext_interface::{ext_self, ext_token_contract};
use crate::*;

const BASE_GAS: Gas = Gas(50_000_000_000_000);
const FT_TRANSFER_GAS: Gas = Gas(50_000_000_000_000);
const REVERT_CALLBACK_GAS: Gas = Gas(50_000_000_000_000);

// Implement custom methods
#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  pub fn ft_on_transfer(&mut self, sender_id: String, amount: U128, msg: String) -> U128 {
    assert_eq!(
      env::predecessor_account_id(),
      self.base_token,
      "{}",
      ERR_002
    );
    match msg.as_str() {
      "mint" => {
        self.internal_mint_x_token(amount.0, sender_id.try_into().unwrap());
        U128(0)
      }
      "deposit_profit" => {
        self.internal_deposit_jump_profits(amount.0);
        U128(0)
      }
      _ => panic!("{}", ERR_001),
    }
  }

  #[payable]
  pub fn burn_x_token(&mut self, quantity_to_burn: U128) {
    assert_one_yocto();
    assert!(
      env::prepaid_gas() >= BASE_GAS + FT_TRANSFER_GAS + REVERT_CALLBACK_GAS,
      "{}",
      ERR_003
    );
    let account = env::predecessor_account_id();
    let base_token_quantity = self.internal_burn_x_token(quantity_to_burn.0, account.clone());
    ext_token_contract::ext(self.base_token.clone())
      .with_static_gas(FT_TRANSFER_GAS)
      .with_attached_deposit(1)
      .ft_transfer(
        account.to_string(),
        U128(base_token_quantity),
        "xToken withdraw".to_string(),
      )
      .then(
        ext_self::ext(env::current_account_id())
          .with_static_gas(REVERT_CALLBACK_GAS)
          .callback_base_token_transfer(quantity_to_burn, account, U128(base_token_quantity)),
      );
  }
}

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
  use crate::tests::*;
  use crate::*;
  const BASE_GAS: Gas = Gas(50_000_000_000_000);

  fn get_context_gas(
    input: Vec<u8>,
    attached_deposit: u128,
    account_balance: u128,
    signer_id: AccountId,
    gas: Gas,
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
      prepaid_gas: gas,
      view_config: None,
      random_seed: [0u8; 32],
      output_data_receivers: vec![],
      epoch_height: 19,
    }
  }

  #[test]
  #[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
  fn test_burn_x_token_no_yocto() {
    let context = get_context_gas(
      vec![],
      0, // no yocto was deposited
      0,
      OWNER_ACCOUNT.clone().parse().unwrap(),
      Gas(10u64.pow(18)),
    );
    testing_env!(context);

    let mut contract = init_contract(0);

    contract.burn_x_token(U128(1));
  }

  #[test]
  #[should_panic(
    expected = "user_actions: burn_x_token: Not enough gas attached to complete the transactions, \nyou must attach at least 3 * 50_000_000_000_000 gas to complete your request"
  )]
  fn test_burn_x_token_not_enough_gas() {
    let context = get_context_gas(
      vec![],
      1, //depositing one yocto near
      0,
      OWNER_ACCOUNT.clone().parse().unwrap(),
      BASE_GAS * 3 - Gas(1),
    );
    testing_env!(context);

    let mut contract = init_contract(0);

    contract.burn_x_token(U128(1));
  }

  #[test]
  #[should_panic(expected = "ft_on_transfer: only accepts tokens from self.base_token")]
  fn test_ft_on_transfer_wrong_predecessor() {
    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 10;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.clone().parse().unwrap());

    contract.ft_functionality.internal_deposit(
      &SIGNER_ACCOUNT.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );

    let msg: &str = "msg";

    contract.ft_on_transfer(SIGNER_ACCOUNT.parse().unwrap(), U128(5), msg.to_string());
  }

  #[test]
  #[should_panic(
    expected = r#"ft_on_transfer: Could not parse msg, accepted values are "mint" and "deposit_profit""#
  )]
  fn test_ft_on_transfer_wrong_msg() {
    let context = get_context(vec![], 0, 0, BASE_TOKEN_ADDRESS.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 10;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&BASE_TOKEN_ADDRESS.clone().parse().unwrap());

    contract.ft_functionality.internal_deposit(
      &BASE_TOKEN_ADDRESS.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );

    let msg: &str = "msg";

    contract.ft_on_transfer(
      BASE_TOKEN_ADDRESS.parse().unwrap(),
      U128(5),
      msg.to_string(),
    );
  }

  #[test]
  fn test_ft_on_transfer_mint() {
    let context = get_context(vec![], 0, 0, BASE_TOKEN_ADDRESS.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 10;
    let quantity_deposited: u128 = 10;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.clone().parse().unwrap());

    contract.ft_functionality.internal_deposit(
      &SIGNER_ACCOUNT.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );

    let msg: &str = "mint";

    let user_balance_before_mint = contract
      .ft_functionality
      .ft_balance_of(SIGNER_ACCOUNT.clone().parse().unwrap());

    contract.ft_on_transfer(
      SIGNER_ACCOUNT.parse().unwrap(),
      U128(quantity_deposited),
      msg.to_string(),
    );

    assert_eq!(
      contract.base_token_treasury,
      quantity_deposited + initial_amount_of_jump
    );

    assert_eq!(
      contract
        .ft_functionality
        .ft_balance_of(SIGNER_ACCOUNT.parse().unwrap()),
      U128(
        u128::from(user_balance_before_mint)
          + (quantity_deposited * initial_amount_of_xtoken / initial_amount_of_jump)
      )
    );
  }
}
