use crate::*;

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde", tag = "type")]
pub enum TransactionType {
  Mint {
    account_id: AccountId,
  },
  BuyFastPass {
    account_id: AccountId,
    vesting_index: U64,
  },
}

#[near_bindgen]
impl Contract {
  #[allow(unused_variables)]
  pub fn ft_on_transfer(&mut self, sender_id: String, amount: String, msg: String) -> U128 {
    assert_eq!(
      env::predecessor_account_id(),
      self.contract_config.get().unwrap().base_token,
      "{}",
      ERR_004
    );
    let amount: u128 = amount.parse().unwrap();
    match serde_json::from_str::<TransactionType>(msg.as_str()).expect(ERR_006) {
      TransactionType::Mint { account_id } => self.mint_locked_tokens(account_id, amount),
      TransactionType::BuyFastPass {
        account_id,
        vesting_index,
      } => self.buy_fast_pass(account_id, vesting_index.0, amount),
    }
  }
}

impl Contract {
  pub fn mint_locked_tokens(&mut self, recipient: AccountId, amount: u128) -> U128 {
    assert!(self.minters.contains(&recipient), "{}", ERR_005);

    self.ft_functionality.internal_deposit(&recipient, amount);

    FtMint {
      owner_id: &recipient,
      amount: &U128(amount),
      memo: Some("Mint by locking base tokens"),
    }
    .emit();
    U128(0)
  }

  pub fn buy_fast_pass(&mut self, account_id: AccountId, vesting_index: u64, amount: u128) -> U128 {
    let mut vesting_vector = self.vesting_schedules.get(&account_id).expect(ERR_001);
    let mut vesting = vesting_vector.get(vesting_index).expect(ERR_101);
    let pass_cost = self.get_fast_pass_cost(&vesting);
    assert!(amount >= pass_cost, "{}. Needs {}", ERR_102, pass_cost);

    let config = self.contract_config.get().unwrap();

    vesting.buy_fastpass(env::block_timestamp(), config.fast_pass_acceleration.0);
    vesting_vector.replace(vesting_index, &vesting);

    self.internal_transfer_call_x_token(pass_cost);

    U128(amount - pass_cost)
  }
}

#[cfg(test)]
mod tests {

  use super::*;
  use crate::tests::*;

  /// mint_locked_tokens
  /// Method must:
  /// 1. Assert caller is token contract
  /// 2. Assert sender is minter
  /// 3. Add balance to the minter in the exact same amount as the deposit
  /// 4. Emit mint event
  /// 5. Return 0
  #[test]
  fn test_mint_locked_tokens() {
    fn closure_generator(
      is_token_contract: bool,
      is_sender_minter: bool,
      deposit_amount: u128,
      seed: u128,
    ) -> impl FnOnce() {
      let minter: AccountId = MINTER_ACCOUNT.parse().unwrap();

      move || {
        testing_env!(get_context(
          vec![],
          0,
          0,
          if is_token_contract {
            TOKEN_ACCOUNT.parse().unwrap()
          } else {
            minter.clone()
          },
          0,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);

        contract.ft_functionality.internal_register_account(&minter);

        let initial_balance = contract.ft_functionality.ft_balance_of(minter.clone());

        let return_value = contract.ft_on_transfer(
          USER_ACCOUNT.parse().unwrap(),
          deposit_amount.to_string(),
          json!({"type": "Mint", "account_id": if is_sender_minter { minter.clone() } else { USER_ACCOUNT.parse().unwrap() } }).to_string()
        );

        let final_balance = contract.ft_functionality.ft_balance_of(minter.clone());

        assert_eq!(return_value.0, 0);
        assert_eq!(initial_balance.0 + deposit_amount, final_balance.0);

        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "nep141");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "ft_mint");

        let data: serde_json::Value = serde_blob["data"][0].clone();
        assert_eq!(data["owner_id"], minter.to_string());
        assert_eq!(data["amount"], deposit_amount.to_string());
        assert_eq!(data["memo"], "Mint by locking base tokens".to_string());
      }
    }

    let test_cases = [
      // 1. Assert caller is token contract
      (false, false, 10, Some(ERR_004.to_string())),
      // 2. Assert sender is minter
      (true, false, 10, Some(ERR_005.to_string())),
      // 3. Add balance to the minter in the exact same amount as the deposit
      // 4. Emit mint event
      // 5. Return 0
      (true, true, 100, None),
      (true, true, 10000, None),
      (true, true, 10, None),
      (true, true, 0, None),
      (true, true, 5684651, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, counter), v.3);
      counter += 1;
    });
  }

  /// buy_fast_pass
  /// Method must:
  /// 1. Assert caller is token contract
  /// 2. Assert account benefited is registered
  /// 3. Assert vesting_id exists
  /// 4. Assert value transferred is enough to pay for fast pass
  /// 5. Assert schedule has never bought fast pass before
  /// 6. Assert still time to elapse
  /// 7. Slash remaining vesting duration according to config
  /// 8. Promise to send transfer tokens to xtoken, if fails
  ///    increment fast_pass_receivals contract var
  /// 9. Return excess tokens sent by user
  #[test]
  fn test_buy_fast_pass() {
    fn closure_generator(
      is_token_contract: bool,
      is_account_registered: bool,
      vesting_id_exists: bool,
      is_amount_enough_pay: bool,
      is_pass_not_bough: bool,
      time_elapsed: u64,
      seed: u128,
    ) -> impl FnOnce() {
      let user: AccountId = USER_ACCOUNT.parse().unwrap();

      move || {
        testing_env!(get_context(
          vec![],
          1,
          0,
          if is_token_contract {
            TOKEN_ACCOUNT.parse().unwrap()
          } else {
            user.clone()
          },
          time_elapsed,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let vesting = Vesting {
          beneficiary: user.clone(),
          locked_value: U128(100),
          start_timestamp: U64(0),
          vesting_duration: U64(100),
          fast_pass: !is_pass_not_bough,
          withdrawn_tokens: U128(0),
        };
        let mut vec = Vector::new(env::keccak256(&(seed + 1327).to_be_bytes()));
        if vesting_id_exists {
          vec.push(&vesting);
        }
        let mut contract = init_contract(seed);

        if is_account_registered {
          contract.ft_functionality.internal_register_account(&user);
          contract.ft_functionality.internal_deposit(&user, 100);
          contract.vesting_schedules.insert(&user, &vec);
        }

        let return_value = contract.ft_on_transfer(
          user.to_string(),
          if is_amount_enough_pay {
            100.to_string()
          } else {
            0.to_string()
          },
          json!({
            "type": "BuyFastPass",
            "account_id": user.to_string(),
            "vesting_index": U64(0),
          })
          .to_string(),
        );

        let fast_pass_cost = (vesting.locked_value.0
          * contract.contract_config.get().unwrap().fast_pass_cost.0)
          / FRACTION_BASE;
        assert_eq!(return_value.0, 100 - fast_pass_cost);

        let vesting_after = vec.get(0).unwrap();
        assert!(vesting_after.fast_pass);

        let expected_duration = ((vesting.vesting_duration.0 - time_elapsed)
          / contract
            .contract_config
            .get()
            .unwrap()
            .fast_pass_acceleration
            .0)
          + time_elapsed;
        assert_eq!(vesting_after.vesting_duration.0, expected_duration);

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
            assert_eq!(function_name, "ft_transfer_call");
            assert_eq!(deposit, 1);
            let json_args: serde_json::Value =
              serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
            assert_eq!(json_args["receiver_id"], X_TOKEN_ACCOUNT.to_string());
            assert_eq!(json_args["amount"], fast_pass_cost.to_string());
            assert_eq!(json_args["msg"], "deposit_profit".to_string());
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
            assert_eq!(function_name, "callback_send_to_xtoken");
            assert_eq!(deposit, 0);
            let json_args: serde_json::Value =
              serde_json::from_str(from_utf8(&args).unwrap()).unwrap();
            assert_eq!(json_args["quantity"], fast_pass_cost.to_string());
          }
          _ => panic!(),
        }
      }
    }

    let test_cases = [
      // 1. Assert caller is token contract
      (
        false,
        false,
        false,
        false,
        false,
        0,
        Some(ERR_004.to_string()),
      ),
      // 2. Assert account benefited is registered
      (
        true,
        false,
        false,
        false,
        false,
        0,
        Some(ERR_001.to_string()),
      ),
      // 3. Assert vesting_id exists
      (
        true,
        true,
        false,
        false,
        false,
        0,
        Some(ERR_101.to_string()),
      ),
      // 4. Assert value transferred is enough to pay for fast pass
      (true, true, true, false, false, 0, Some(ERR_102.to_string())),
      // 5. Assert schedule has never bought fast pass before
      (true, true, true, true, false, 0, Some(ERR_103.to_string())),
      // 6. Assert still time to elapse
      (true, true, true, true, true, 102, Some(ERR_104.to_string())),
      (true, true, true, true, true, 100, Some(ERR_104.to_string())),
      // 7. Slash remaining vesting duration according to config
      // 8. Promise to send transfer tokens to xtoken, if fails
      //    increment fast_pass_receivals contract var
      // 9. Return excess tokens sent by user
      (true, true, true, true, true, 10, None),
      (true, true, true, true, true, 37, None),
      (true, true, true, true, true, 89, None),
      (true, true, true, true, true, 43, None),
      (true, true, true, true, true, 71, None),
      (true, true, true, true, true, 0, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(
        closure_generator(v.0, v.1, v.2, v.3, v.4, v.5, counter),
        v.6,
      );
      counter += 1;
      println!("counter: {}", counter);
    });
  }
}
