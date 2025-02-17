use crate::*;

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct VestingSerializable {
  pub beneficiary: AccountId,
  pub locked_value: U128,
  pub start_timestamp: U64,
  pub vesting_duration: U64,
  pub fast_pass: bool,
  pub withdrawn_tokens: U128,
  pub available_to_withdraw: U128,
}

#[near_bindgen]
impl Contract {
  pub fn view_vesting_vector_len(&self, account_id: AccountId) -> U64 {
    match self.vesting_schedules.get(&account_id) {
      Some(vesting_vector) => U64(vesting_vector.len()),
      None => U64(0),
    }
  }

  pub fn view_vesting_paginated(
    &self,
    account_id: AccountId,
    initial_id: U64,
    size: U64,
  ) -> Vec<VestingSerializable> {
    match self.vesting_schedules.get(&account_id) {
      Some(vesting_vector) => vesting_vector
        .iter()
        .skip(initial_id.0 as usize)
        .take(size.0 as usize)
        .map(|vesting| {
          let available = vesting.calculate_available_withdraw(env::block_timestamp());
          VestingSerializable {
            beneficiary: vesting.beneficiary,
            locked_value: vesting.locked_value,
            start_timestamp: vesting.start_timestamp,
            vesting_duration: vesting.vesting_duration,
            fast_pass: vesting.fast_pass,
            withdrawn_tokens: vesting.withdrawn_tokens,
            available_to_withdraw: U128(available),
          }
        })
        .collect(),
      None => Vec::new(),
    }
  }

  pub fn view_contract_data(&self) -> ContractConfig {
    self.contract_config.get().unwrap()
  }

  pub fn view_minters_len(&self) -> U64 {
    U64(self.minters.len())
  }

  pub fn view_minters(&self, initial_id: U64, size: U64) -> Vec<AccountId> {
    self
      .minters
      .iter()
      .skip(initial_id.0 as usize)
      .take(size.0 as usize)
      .collect()
  }

  pub fn view_user(&self, account_id: AccountId) -> Option<Account> {
    self.users.get(&account_id)
  }
}
