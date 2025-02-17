use crate::*;
use crate::ext_interface::{ext_token_contract, ext_self};

const FT_TRANSFER_GAS: Gas = Gas(120_000_000_000_000);
const FT_TRANSFER_CALLBACK_GAS: Gas = Gas(50_000_000_000_000);

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn withdraw_locked_tokens(&mut self, vesting_id: U64) -> PromiseOrValue<()> {
    assert_one_yocto();
    let account_id = env::predecessor_account_id();
    let vesting_id = vesting_id.0;
    let mut vesting_vector = self.vesting_schedules.get(&account_id).expect(ERR_001);
    let mut vesting = vesting_vector.get(vesting_id).expect(ERR_101);

    let value_to_withdraw = vesting.withdraw_available(env::block_timestamp());
    vesting_vector.replace(vesting_id, &vesting);

    self
      .ft_functionality
      .internal_withdraw(&account_id, value_to_withdraw);

    if value_to_withdraw > 0 {
      PromiseOrValue::Promise(
        ext_token_contract::ext(self.contract_config.get().unwrap().base_token)
          .with_static_gas(FT_TRANSFER_GAS)
          .with_attached_deposit(1)
          .ft_transfer(
            account_id.to_string(),
            U128(value_to_withdraw),
            "locked token withdraw".to_string(),
          )
          .then(
            ext_self::ext(env::current_account_id())
              .with_static_gas(FT_TRANSFER_CALLBACK_GAS)
              .callback_base_token_transfer(account_id, U128(value_to_withdraw), U64(vesting_id)),
          ),
      )
    } else {
      PromiseOrValue::Value(())
    }
  }
}

#[cfg(test)]
mod tests {

  use crate::tests::*;

  /// withdraw_locked_tokens
  /// Method must:
  /// 1. Assert one yocto
  /// 2. Find vesting scheduled given as arg
  /// 3. Calculate available withdraw amount
  /// 4. Update vesting in state to reflect withdrawn amount
  /// 5. Reduce user balance of locked_token according to
  ///    withdrawn amount
  /// 6. Send promises to transfer base token and call callback
  #[test]
  fn test_withdraw_locked_tokens() {
    fn closure_generator(
      one_yocto: bool,
      vesting_exists: bool,
      vesting_total_amount: u128,
      vesting_withdrawn_tokens: u128,
      vesting_percent_elapsed_time: u64,
      seed: u128,
    ) -> impl FnOnce() {
      let user: AccountId = USER_ACCOUNT.parse().unwrap();

      move || {
        testing_env!(get_context(
          vec![],
          if one_yocto { 1 } else { 0 },
          0,
          user.clone(),
          vesting_percent_elapsed_time,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let vesting = Vesting {
          beneficiary: user.clone(),
          locked_value: U128(vesting_total_amount),
          start_timestamp: U64(0),
          vesting_duration: U64(100),
          fast_pass: false,
          withdrawn_tokens: U128(vesting_withdrawn_tokens),
        };
        let mut vec = Vector::new(env::keccak256(&(seed + 1327).to_be_bytes()));
        if vesting_exists {
          vec.push(&vesting);
        }

        let expected_withdraw = (vesting_percent_elapsed_time as u128 * vesting_total_amount) / 100
          - vesting.withdrawn_tokens.0;
        let initial_locked_balance = vesting_total_amount - vesting_withdrawn_tokens;

        let mut contract = init_contract(seed);

        contract.ft_functionality.internal_register_account(&user);
        contract
          .ft_functionality
          .internal_deposit(&user, initial_locked_balance);
        contract.vesting_schedules.insert(&user, &vec);

        contract.withdraw_locked_tokens(U64(0));
        let vesting_after = vec.get(0).unwrap();

        let final_locked_balance = contract.ft_functionality.ft_balance_of(user.clone());
        assert_eq!(
          (vesting_percent_elapsed_time as u128 * vesting_total_amount) / 100,
          vesting_after.withdrawn_tokens.0
        );
        assert_eq!(
          final_locked_balance,
          U128(((100 - vesting_percent_elapsed_time as u128) * vesting_total_amount) / 100)
        );

        if expected_withdraw > 0 {
          let receipts = get_created_receipts();
          assert_eq!(receipts.len(), 2);

          assert_eq!(
            receipts[0].receiver_id.to_string(),
            TOKEN_ACCOUNT.to_string()
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
              assert_eq!(json_args["receiver_id"], user.to_string());
              assert_eq!(json_args["amount"], expected_withdraw.to_string());
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
              assert_eq!(function_name, "callback_base_token_transfer");
              assert_eq!(deposit, 0);
              let json_args: serde_json::Value =
                serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
              assert_eq!(json_args["recipient"], user.to_string());
              assert_eq!(
                json_args["quantity_withdrawn"],
                expected_withdraw.to_string()
              );
              assert_eq!(json_args["vesting_id"], "0".to_string());
            }
            _ => panic!(),
          }
        } else {
          let receipts = get_created_receipts();
          assert_eq!(receipts.len(), 0);
        }
      }
    }

    let test_cases = [
      // 1. Assert one yocto
      (
        false,
        false,
        1000,
        500,
        50,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 2. Find vesting scheduled given as arg
      (true, false, 1000, 500, 50, Some(ERR_101.to_string())),
      // 3. Calculate available withdraw amount
      // 4. Update vesting in state to reflect withdrawn amount
      // 5. Reduce user balance of locked_token according to
      //    withdrawn amount
      // 6. Send promises to transfer base token and call callback
      (true, true, 1000, 0, 30, None),
      (true, true, 1000, 0, 70, None),
      (true, true, 1000, 500, 70, None),
      (true, true, 1000, 900, 90, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, v.3, v.4, counter), v.5);
      counter += 1;
      println!("{}", counter);
    });
  }
}
