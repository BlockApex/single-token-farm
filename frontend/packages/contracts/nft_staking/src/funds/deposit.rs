use near_sdk::{is_promise_success, json_types::U128, near_bindgen, AccountId};
use serde::{Deserialize, Serialize};

use crate::{
  actions::token_router::FTRoutePayload,
  types::{FungibleTokenID, NFTCollection},
  Contract, ContractExt,
};

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum DepositOperation {
  ContractTreasury,
  CollectionTreasury { collection: NFTCollection },
}

impl Contract {
  fn assert_authorized_deposit_operation(
    &self,
    operation: &DepositOperation,
    operator: &AccountId,
    token_id: &FungibleTokenID,
  ) {
    match operation {
      DepositOperation::ContractTreasury => {
        /*
         *   TODO: this operation is non-authorized because we want partners to be able
         * call it. If we ever create more authorization roles, we should assert it here.
         */
        self.only_contract_tokens(token_id);
      }
      DepositOperation::CollectionTreasury { collection } => {
        // TODO: ideally this repeated read wouldn't be needed if we had a global program token index
        let staking_program = self
          .staking_programs
          .get(&collection)
          .expect("Collection has no Staking Program associated with it");
        self.assert_authorized_operator(operator, &staking_program, token_id);
      }
    }
  }

  fn deposit_funds(
    &mut self,
    operation: DepositOperation,
    token_id: FungibleTokenID,
    amount: u128,
  ) {
    match operation {
      DepositOperation::ContractTreasury => {
        *self.contract_treasury.entry(token_id).or_insert(0) += amount;
      }
      DepositOperation::CollectionTreasury { collection } => {
        let mut staking_program = self.staking_programs.get(&collection).unwrap();

        *staking_program
          .collection_treasury
          .entry(token_id)
          .or_insert(0) += amount;

        self
          .staking_programs
          .insert(&staking_program.collection, &staking_program);
      }
    }
  }

  pub fn deposit(&mut self, payload: FTRoutePayload, operation: DepositOperation) {
    let token_id = payload.token_id;
    let operator = payload.sender_id;
    let amount = payload.amount;

    self.assert_authorized_deposit_operation(&operation, &operator, &token_id);
    self.deposit_funds(operation, token_id, amount);
  }
}

#[near_bindgen]
impl Contract {
  #[private]
  pub fn compensate_withdraw_treasury(
    &mut self,
    operation: DepositOperation,
    token_id: FungibleTokenID,
    amount: U128,
  ) {
    if !is_promise_success() {
      self.deposit_funds(operation, token_id, amount.0)
    }
  }
}

#[cfg(test)]
mod tests {
  use rstest::rstest;

  use super::super::tests_fixtures::*;
  use super::*;

  #[rstest]
  #[case::contract_owner_ct(DepositOperation::ContractTreasury, owner(), contract_token())]
  #[case::collection_owner_ct(
    DepositOperation::CollectionTreasury {
      collection: collection(),
    },
    owner(),
    contract_token()
  )]
  #[case::collection_collection_owner_pt(
    DepositOperation::CollectionTreasury {
      collection: collection(),
    },
    collection_owner(),
    program_token()
  )]
  fn test_authorized_deposit(
    contract: Contract,
    #[case] operation: DepositOperation,
    #[case] operator: AccountId,
    #[case] token_id: FungibleTokenID,
  ) {
    contract.assert_authorized_deposit_operation(&operation, &operator, &token_id);
  }

  #[rstest]
  #[case::contract_owner_pt(DepositOperation::ContractTreasury, owner(), program_token())]
  #[case::contract_collection_owner_pt(
    DepositOperation::ContractTreasury,
    collection_owner(),
    program_token()
  )]
  #[case::collection_owner_pt(
    DepositOperation::CollectionTreasury {
      collection: collection(),
    },
    owner(),
    program_token()
  )]
  #[case::collection_collection_owner_ct(
    DepositOperation::CollectionTreasury {
      collection: collection(),
    },
    collection_owner(),
    contract_token()
  )]
  fn test_unauthorized_deposit(
    contract: Contract,
    #[case] operation: DepositOperation,
    #[case] operator: AccountId,
    #[case] token_id: FungibleTokenID,
  ) {
    std::panic::set_hook(Box::new(|_| {}));

    let panicked = std::panic::catch_unwind(|| {
      contract.assert_authorized_deposit_operation(&operation, &operator, &token_id);
    });

    assert!(panicked.is_err());
  }

  #[rstest]
  fn test_deposit_contract_treasury(mut contract: Contract, contract_token: FungibleTokenID) {
    let initial_balance = *contract.contract_treasury.get(&contract_token).unwrap();

    let amount = 1;

    contract.deposit_funds(
      DepositOperation::ContractTreasury,
      contract_token.clone(),
      amount,
    );

    let final_balance = *contract.contract_treasury.get(&contract_token).unwrap();

    assert_eq!(initial_balance + amount, final_balance);
  }

  #[rstest]
  fn test_deposit_collection_treasury(
    mut contract: Contract,
    collection: NFTCollection,
    contract_token: FungibleTokenID,
  ) {
    let initial_balance = *contract
      .staking_programs
      .get(&collection)
      .unwrap()
      .collection_treasury
      .get(&contract_token)
      .unwrap();

    let amount = 1;

    contract.deposit_funds(
      DepositOperation::CollectionTreasury {
        collection: collection.clone(),
      },
      contract_token.clone(),
      amount,
    );

    let final_balance = *contract
      .staking_programs
      .get(&collection)
      .unwrap()
      .collection_treasury
      .get(&contract_token)
      .unwrap();

    assert_eq!(initial_balance + amount, final_balance);
  }
}
