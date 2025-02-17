use crate::*;

#[near_bindgen]
impl FungibleTokenCore for Contract {
  #[payable]
  fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
    let initial_storage = env::storage_usage();
    println!("initial storage: {}", initial_storage);
    self.only_minter(&env::predecessor_account_id());
    let mut account = self.internal_get_account(&receiver_id).expect(ERR_001);
    if !self.minters.contains(&receiver_id.clone()) {
      self.internal_add_vesting(&receiver_id, amount.0);
      account.track_storage_usage(initial_storage);
      self.internal_update_account(&receiver_id, &account);
    }
    self
      .ft_functionality
      .ft_transfer(receiver_id.clone(), amount, memo);
  }

  #[payable]
  fn ft_transfer_call(
    &mut self,
    receiver_id: AccountId,
    amount: U128,
    memo: Option<String>,
    msg: String,
  ) -> PromiseOrValue<U128> {
    let initial_storage = env::storage_usage();
    self.only_minter(&env::predecessor_account_id());
    if !self.minters.contains(&receiver_id.clone()) {
      let mut account = self.internal_get_account(&receiver_id).expect(ERR_001);
      self.internal_add_vesting(&receiver_id, amount.0);
      account.track_storage_usage(initial_storage);
      self.internal_update_account(&receiver_id, &account);
    }
    self
      .ft_functionality
      .ft_transfer_call(receiver_id, amount, memo, msg)
  }

  fn ft_total_supply(&self) -> U128 {
    self.ft_functionality.ft_total_supply()
  }

  fn ft_balance_of(&self, account_id: AccountId) -> U128 {
    self.ft_functionality.ft_balance_of(account_id)
  }
}

#[near_bindgen]
impl FungibleTokenResolver for Contract {
  #[private]
  fn ft_resolve_transfer(
    &mut self,
    sender_id: AccountId,
    receiver_id: AccountId,
    amount: U128,
  ) -> U128 {
    let (used_amount, burned_amount) =
      self
        .ft_functionality
        .internal_ft_resolve_transfer(&sender_id, receiver_id, amount);
    if burned_amount > 0 {
      self.on_tokens_burned(sender_id, burned_amount);
    }
    used_amount.into()
  }
}

#[near_bindgen]
impl FungibleTokenMetadataProvider for Contract {
  fn ft_metadata(&self) -> FungibleTokenMetadata {
    self.locked_token_metadata.get().unwrap()
  }
}

#[cfg(test)]
mod tests {

  use super::*;
  use crate::tests::*;

  /// ft_transfer
  /// Method must:
  /// 1. Assert caller is minter
  /// 2. Assert one yocto
  /// 3. Assert receiver is registered
  /// 4. Assert receiver has enough storage
  /// 5. Transfer tokens to receiver
  /// 6. Create new vesting schedule for receiver
  /// 7. Emit ft_transfer event
  #[test]
  fn test_mint_locked_tokens() {
    fn closure_generator(
      is_minter: bool,
      is_one_yocto: bool,
      is_receiver_registered: bool,
      receiver_storage_deposit: u128,
      minter_balance: u128,
      transfer_amount: u128,
      seed: u128,
    ) -> impl FnOnce() {
      let minter: AccountId = MINTER_ACCOUNT.parse().unwrap();
      let receiver: AccountId = USER_ACCOUNT.parse().unwrap();
      move || {
        testing_env!(get_context(
          vec![],
          if is_one_yocto { 1 } else { 0 },
          0,
          if is_minter {
            minter.clone()
          } else {
            TOKEN_ACCOUNT.parse().unwrap()
          },
          0,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);
        contract.ft_functionality.internal_register_account(&minter);
        contract
          .ft_functionality
          .internal_deposit(&minter, minter_balance);

        let user = Account {
          account_id: receiver.clone(),
          storage_deposit: U128(receiver_storage_deposit),
          storage_used: U64(0),
        };

        if is_receiver_registered {
          contract
            .ft_functionality
            .internal_register_account(&receiver);
          contract.ft_functionality.internal_deposit(&receiver, 0);
          contract.users.insert(&receiver, &user);
          contract.vesting_schedules.insert(
            &receiver,
            &Vector::new(env::keccak256(&(seed + 937).to_be_bytes())),
          );

          match contract.vesting_schedules.get(&receiver).unwrap().get(0) {
            Some(_) => panic!("should not be init"),
            None => (),
          };
        }
        contract.ft_transfer(receiver.clone(), U128(transfer_amount), None);

        let final_minter_balance = contract.ft_functionality.ft_balance_of(minter.clone());
        let final_receiver_balance = contract.ft_functionality.ft_balance_of(receiver.clone());
        assert_eq!(final_receiver_balance.0, transfer_amount);
        assert_eq!(final_minter_balance.0, minter_balance - transfer_amount);

        let vesting_vec = contract.vesting_schedules.get(&receiver).unwrap();
        let vesting = vesting_vec.get(0).unwrap();

        assert_eq!(vesting.beneficiary, receiver.clone());
        assert_eq!(vesting.locked_value.0, transfer_amount);
        assert_eq!(vesting.start_timestamp.0, 0);
        assert_eq!(
          vesting.vesting_duration,
          contract.contract_config.get().unwrap().vesting_duration
        );
        assert!(!vesting.fast_pass);
        assert_eq!(vesting.withdrawn_tokens.0, 0);

        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "nep141");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "ft_transfer");

        let data: serde_json::Value = serde_blob["data"][0].clone();
        assert_eq!(data["old_owner_id"], minter.to_string());
        assert_eq!(data["new_owner_id"], receiver.to_string());
        assert_eq!(data["amount"], transfer_amount.to_string());
      }
    }

    let test_cases = [
      // 1. Assert caller is minter
      (false, true, false, 0, 0, 0, Some(ERR_002.to_string())),
      // 2. Assert one yocto
      (true, false, false, 0, 0, 0, Some("a".to_string())),
      // 3. Assert receiver is registered
      (true, true, false, 0, 0, 0, Some(ERR_001.to_string())),
      // 4. Assert receiver has enough storage
      (true, true, true, 0, 1000, 50, Some(ERR_201.to_string())),
      // 5. Transfer tokens to receiver
      // 6. Create new vesting schedule for receiver
      // 7. Emit ft_transfer event
      (true, true, true, 10000000000000000000000, 90, 50, None),
      (true, true, true, 10000000000000000000000, 1000, 800, None),
      (true, true, true, 10000000000000000000000, 97000, 10, None),
      (true, true, true, 10000000000000000000000, 1000, 170, None),
      (true, true, true, 10000000000000000000000, 550, 470, None),
      (
        true,
        true,
        true,
        10000000000000000000000,
        1000,
        1010,
        Some("The account doesn't have enough balance".to_string()),
      ),
      (
        true,
        true,
        true,
        10000000000000000000000,
        1000,
        0,
        Some("The amount should be a positive number".to_string()),
      ),
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
