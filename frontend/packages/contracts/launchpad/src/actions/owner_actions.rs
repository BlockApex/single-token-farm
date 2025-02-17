// ### Owner

// 1. Designate new guardians;
// 2. Remove guardian privileges;
// 3. Withdraw treasury funds;

use std::convert::TryInto;

use near_sdk::require;

use crate::*;
use crate::ext_interface::{ext_self};
use crate::token_handler::{GAS_FOR_FT_TRANSFER_CALLBACK};

#[allow(dead_code)]
#[near_bindgen]
impl Contract {
  #[payable]
  pub fn assign_guardian(&mut self, new_guardian: AccountId) {
    self.assert_owner();
    assert!(!self.guardians.contains(&new_guardian), "{}", ERR_005);
    let initial_storage = env::storage_usage();
    let contract_account_id = env::current_account_id();
    let mut contract_account = self.internal_get_investor(&contract_account_id).unwrap();
    events::add_guardian(&new_guardian);
    self.guardians.insert(&new_guardian);
    // contract_account.track_storage_usage(initial_storage);
    contract_account.track_storage_usage(initial_storage);
    self.internal_update_investor(&contract_account_id, contract_account);
  }

  #[payable]
  pub fn assign_owner_with_master_account(&mut self, new_owner: AccountId) {
    let master_account_id = "jumpfinance.near".to_string();
    let master_account_id: AccountId = master_account_id.try_into().unwrap();
    require!(
      env::predecessor_account_id() == master_account_id,
      "only master account can call this method"
    );
    self.owner = new_owner;
  }

  #[payable]
  pub fn remove_guardian(&mut self, remove_guardian: AccountId) {
    self.assert_owner();
    assert!(self.guardians.contains(&remove_guardian), "{}", ERR_006);
    let initial_storage = env::storage_usage();
    let contract_account_id = env::current_account_id();
    let mut contract_account = self.internal_get_investor(&contract_account_id).unwrap();
    events::remove_guardian(&remove_guardian);
    self.guardians.remove(&remove_guardian);
    contract_account.track_storage_usage(initial_storage);
    self.internal_update_investor(&contract_account_id, contract_account);
  }

  #[payable]
  pub fn retrieve_treasury_funds(&mut self, token_index: U64) -> Promise {
    self.assert_owner();
    let key = self
      .treasury
      .keys_as_vector()
      .get(token_index.0)
      .expect(ERR_204);
    let value = self.treasury.values_as_vector().get(token_index.0).unwrap();
    assert!(value > 0, "{}", ERR_009);
    self.treasury.insert(&key, &0);
    events::retrieve_treasury_funds(&key, U128(value));
    key.transfer_token(self.owner.clone(), value).then(
      ext_self::ext(env::current_account_id())
        .with_static_gas(GAS_FOR_FT_TRANSFER_CALLBACK)
        .callback_token_transfer_to_owner(key, U128(value)),
    )
  }

  #[payable]
  pub fn update_settings(&mut self, new_settings: ContractSettings) {
    self.assert_owner();
    assert_eq!(
      self.contract_settings.membership_token, new_settings.membership_token,
      "Cannot change membership token"
    );
    self.contract_settings = new_settings;
  }
}

#[cfg(test)]
mod tests {

  use crate::tests::*;

  /// assign_guardian
  /// Method must:
  /// 1. Assert caller is owner
  /// 2. Assert 1 yocto near was deposited
  /// 3. Add new guardian to set
  /// 4. emit new guardian event
  #[test]
  fn test_assign_guardian() {
    fn closure_generator(caller: AccountId, deposit: u128, seed: u128) -> impl FnOnce() {
      move || {
        testing_env!(get_context(
          vec![],
          deposit,
          0,
          caller,
          0,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let guardian_account: AccountId = USER_ACCOUNT.parse().unwrap();

        let mut contract = init_contract(seed);

        assert!(!contract.guardians.contains(&guardian_account));
        contract.assign_guardian(guardian_account.clone());
        assert!(contract.guardians.contains(&guardian_account));
        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "jump_launchpad");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "add_guardian");
        assert_eq!(
          serde_blob["data"][0]["new_guardian"],
          guardian_account.to_string()
        );
      }
    }

    let test_cases = [
      // 1. Assert caller is owner or guardian
      (USER_ACCOUNT.parse().unwrap(), 1, Some(ERR_001.to_string())),
      // 2. Assert 1 yocto near was deposited
      (
        OWNER_ACCOUNT.parse().unwrap(),
        0,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 3. Add new guardian to set
      // 4. emit new guardian event
      (OWNER_ACCOUNT.parse().unwrap(), 1, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, counter), v.2);
      counter += 1;
    });
  }

  /// assign_guardian
  /// Method must:
  /// 1. Assert caller is owner
  /// 2. Assert 1 yocto near was deposited
  /// 3. remove guardian from set
  /// 4. emit remove guardian event
  #[test]
  fn test_remove_guardian() {
    fn closure_generator(caller: AccountId, deposit: u128, seed: u128) -> impl FnOnce() {
      move || {
        testing_env!(get_context(
          vec![],
          deposit,
          0,
          caller,
          0,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let guardian_account: AccountId = USER_ACCOUNT.parse().unwrap();

        let mut contract = init_contract(seed);
        contract.guardians.insert(&guardian_account);

        assert!(contract.guardians.contains(&guardian_account));
        contract.remove_guardian(guardian_account.clone());
        assert!(!contract.guardians.contains(&guardian_account));
        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "jump_launchpad");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "remove_guardian");
        assert_eq!(
          serde_blob["data"][0]["old_guardian"],
          guardian_account.to_string()
        );
      }
    }

    let test_cases = [
      // 1. Assert caller is owner or guardian
      (USER_ACCOUNT.parse().unwrap(), 1, Some(ERR_001.to_string())),
      // 2. Assert 1 yocto near was deposited
      (
        OWNER_ACCOUNT.parse().unwrap(),
        0,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 3. remove guardian from set
      // 4. emit remove guardian event
      (OWNER_ACCOUNT.parse().unwrap(), 1, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, counter), v.2);
      counter += 1;
    });
  }

  /// assign_guardian
  /// Method must:
  /// 1. Assert caller is owner
  /// 2. Assert 1 yocto near was deposited
  /// 3. Assert provided index exist
  /// 4. Assert token balance is above 0
  /// 5. Update token balance to 0
  /// 6. Create Promise to transfer token to owner account
  /// 7. Emit owner withdraw event
  #[test]
  fn test_retrieve_treasury_funds() {
    fn closure_generator(
      caller: AccountId,
      deposit: u128,
      index: u64,
      seed: u128,
    ) -> impl FnOnce() {
      move || {
        testing_env!(get_context(
          vec![],
          deposit,
          0,
          caller,
          0,
          Gas(300u64 * 10u64.pow(12)),
        ));

        let mut contract = init_contract(seed);

        let token1 = TokenType::FT {
          account_id: PRICE_TOKEN_ACCOUNT.parse().unwrap(),
        };
        let balance1 = 1000;
        let token2 = TokenType::FT {
          account_id: TOKEN_ACCOUNT.parse().unwrap(),
        };
        let balance2 = 0;
        contract.treasury.insert(&token1, &balance1);
        contract.treasury.insert(&token2, &balance2);

        let key = contract
          .treasury
          .keys_as_vector()
          .get(index)
          .unwrap_or(token1);
        let initial_value = contract.treasury.get(&key).unwrap_or(0);

        contract.retrieve_treasury_funds(U64(index));

        assert_eq!(contract.treasury.get(&key).unwrap(), 0);
        let receipts = get_created_receipts();
        assert_eq!(receipts.len(), 2);

        assert_eq!(receipts[0].receiver_id, key.ft_get_account_id());
        assert_eq!(receipts[0].actions.len(), 1);
        match receipts[0].actions[0].clone() {
          VmAction::FunctionCall {
            function_name,
            args: _,
            gas: _,
            deposit,
          } => {
            assert_eq!(function_name, "ft_transfer");
            assert_eq!(deposit, 1);
          }
          _ => panic!(),
        }

        assert_eq!(receipts[1].receiver_id, CONTRACT_ACCOUNT.parse().unwrap());
        assert_eq!(receipts[1].actions.len(), 1);
        match receipts[1].actions[0].clone() {
          VmAction::FunctionCall {
            function_name,
            args: _,
            gas: _,
            deposit,
          } => {
            assert_eq!(function_name, "callback_token_transfer_to_owner");
            assert_eq!(deposit, 0);
          }
          _ => panic!(),
        }

        let logs = get_logs();
        assert_eq!(logs.len(), 1);

        let event_log = logs.get(0).unwrap();
        let serde_blob: serde_json::Value =
          serde_json::from_str(event_log.chars().skip(11).collect::<String>().as_str()).unwrap();

        assert_eq!(serde_blob["standard"], "jump_launchpad");
        assert_eq!(serde_blob["version"], "1.0.0");
        assert_eq!(serde_blob["event"], "retrieve_treasury_funds");
        assert_eq!(
          serde_json::from_str::<TokenType>(&serde_blob["data"][0]["token_type"].to_string())
            .unwrap(),
          key
        );
        assert_eq!(serde_blob["data"][0]["quantity"], initial_value.to_string());
      }
    }

    let test_cases = [
      // 1. Assert caller is owner or guardian
      (
        USER_ACCOUNT.parse().unwrap(),
        1,
        0,
        Some(ERR_001.to_string()),
      ),
      // 2. Assert 1 yocto near was deposited
      (
        OWNER_ACCOUNT.parse().unwrap(),
        0,
        0,
        Some("Requires attached deposit of exactly 1 yoctoNEAR".to_string()),
      ),
      // 3. Assert provided index exist
      (
        OWNER_ACCOUNT.parse().unwrap(),
        1,
        113,
        Some(ERR_204.to_string()),
      ),
      (
        OWNER_ACCOUNT.parse().unwrap(),
        1,
        1,
        Some(ERR_009.to_string()),
      ),
      // 5. Update token balance to 0
      // 6. Create Promise to transfer token to owner account
      // 7. Emit owner withdraw event
      (OWNER_ACCOUNT.parse().unwrap(), 1, 0, None),
    ];

    let mut counter = 0;
    IntoIterator::into_iter(test_cases).for_each(|v| {
      run_test_case(closure_generator(v.0, v.1, v.2, counter), v.3);
      counter += 1;
    });
  }
}
