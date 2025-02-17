use crate::*;
use std::collections::HashMap;

#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  pub fn view_token_ratio(&self) -> HashMap<String, U128> {
    let mut return_value: HashMap<String, U128> = HashMap::new();
    return_value.insert(
      "x_token".to_string(),
      U128(self.ft_functionality.total_supply),
    );
    return_value.insert("base_token".to_string(), U128(self.base_token_treasury));
    return_value
  }
}

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
  use crate::tests::*;
  use crate::*;
  use std::collections::HashMap;

  #[test]
  fn test_view_token_ratio() {
    let context = get_context(vec![], 0, 0, OWNER_ACCOUNT.clone().parse().unwrap()); // vec!() -> da pra inicializar assim, tem otimizacao ( macro vec)
    testing_env!(context);

    let initial_amount_of_xtoken: u128 = 10;
    let initial_amount_of_jump: u128 = 100;

    let mut contract = init_contract(initial_amount_of_jump.clone());

    contract
      .ft_functionality
      .internal_register_account(&SIGNER_ACCOUNT.parse().unwrap());

    contract.ft_functionality.internal_deposit(
      &SIGNER_ACCOUNT.parse().unwrap(),
      initial_amount_of_xtoken.clone(),
    );
    let view_return: HashMap<String, U128> = contract.view_token_ratio();

    let x_token = String::from("x_token");
    let deposited_token = String::from("base_token");
    let x_token_ratio_return = view_return.get(&x_token).unwrap();
    let deposited_token_ratio_return = view_return.get(&deposited_token).unwrap();

    assert_eq!(x_token_ratio_return, &U128(initial_amount_of_xtoken));
    assert_eq!(deposited_token_ratio_return, &U128(initial_amount_of_jump));
  }
}
