use near_sdk::AccountId;
use serde::{Deserialize, Serialize};

use crate::{
  errors::{ERR_INSUFFICIENT_COLLECTION_TREASURY, ERR_INSUFFICIENT_CONTRACT_TREASURY},
  models::StakingProgram,
  types::{FungibleTokenID, NFTCollection},
  Contract,
};

#[derive(Clone, Copy, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TransferOperation {
  ContractToCollection,
  CollectionToContract,
  CollectionToDistribution,
  BeneficiaryToCollection,
  DistributionToCollection,
}

impl Contract {
  fn assert_authorized_treasury_operation(
    &self,
    operation: TransferOperation,
    operator: &AccountId,
    staking_program: &StakingProgram,
    token_id: &FungibleTokenID,
  ) {
    match &operation {
      TransferOperation::CollectionToContract | TransferOperation::ContractToCollection | TransferOperation::DistributionToCollection => {
        self.only_owner(operator);
        self.only_contract_tokens(token_id);
        staking_program.only_non_program_tokens(token_id);
      }

      TransferOperation::CollectionToDistribution | TransferOperation::BeneficiaryToCollection => {
        self.assert_authorized_operator(operator, staking_program, token_id);
      }
    }
  }

  fn reallocate_funds(
    &mut self,
    operation: TransferOperation,
    staking_program: &mut StakingProgram,
    token_id: FungibleTokenID,
    amount: Option<u128>,
  ) {
    let collection_treasury = staking_program
      .collection_treasury
      .entry(token_id.clone())
      .or_insert(0);

    match operation {
      TransferOperation::ContractToCollection => {
        let contract_treasury = self.contract_treasury.entry(token_id.clone()).or_insert(0);

        let amount = amount.unwrap_or(*contract_treasury);
        assert!(
          amount <= *contract_treasury,
          "{ERR_INSUFFICIENT_CONTRACT_TREASURY}"
        );
        *contract_treasury -= amount;
        *collection_treasury += amount;
      }
      TransferOperation::CollectionToContract => {
        let contract_treasury = self.contract_treasury.entry(token_id.clone()).or_insert(0);

        let amount = amount.unwrap_or(*collection_treasury);
        assert!(
          amount <= *collection_treasury,
          "{ERR_INSUFFICIENT_COLLECTION_TREASURY}"
        );
        *collection_treasury -= amount;
        *contract_treasury += amount;
      }
      TransferOperation::CollectionToDistribution => {
        let amount = amount.unwrap_or(*collection_treasury);
        assert!(
          amount <= *collection_treasury,
          "{ERR_INSUFFICIENT_COLLECTION_TREASURY}"
        );
        *collection_treasury -= amount;
        staking_program.deposit_distribution_funds(&token_id, amount);
      }
      TransferOperation::BeneficiaryToCollection => {
        assert!(
          amount.is_none(),
          "This operation does not support the parameter 'amount'"
        );
        // TODO: ideally this would call StakingProgram::withdraw_beneficiary_funds
        let amount = staking_program.farm.withdraw_beneficiary_funds(&token_id);

        *collection_treasury += amount;
      }
      TransferOperation::DistributionToCollection => {
        assert!(
          amount.is_none(),
          "This operation does not support the parameter 'amount'"
        );
        // TODO: ideally this would call StakingProgram::withdraw_beneficiary_funds
        let amount = staking_program.farm.withdraw_distribution_funds(&token_id);

        *collection_treasury += amount;
      }
    }
  }

  pub fn transfer_funds(
    &mut self,
    operation: TransferOperation,
    operator: &AccountId,
    collection: &NFTCollection,
    token_id: FungibleTokenID,
    amount: Option<u128>,
  ) {
    let mut staking_program = self.staking_programs.get(&collection).unwrap();

    self.assert_authorized_treasury_operation(operation, operator, &staking_program, &token_id);
    self.reallocate_funds(operation, &mut staking_program, token_id, amount);

    self.staking_programs.insert(&collection, &staking_program);
  }
}

#[cfg(test)]
mod tests {
  use rstest::rstest;

  use super::super::tests_fixtures::*;
  use super::*;

  #[rstest]
  #[case::owner_ct_contract_to_collection(
    TransferOperation::ContractToCollection,
    owner(),
    contract_token()
  )]
  #[case::owner_ct_collection_to_contract(
    TransferOperation::CollectionToContract,
    owner(),
    contract_token()
  )]
  #[case::owner_ct_collection_to_distribution(
    TransferOperation::CollectionToDistribution,
    owner(),
    contract_token()
  )]
  #[case::owner_ct_beneficiary_to_collection(
    TransferOperation::BeneficiaryToCollection,
    owner(),
    contract_token()
  )]
  #[case::collection_owner_pt_collection_to_distribution(
    TransferOperation::CollectionToDistribution,
    collection_owner(),
    program_token()
  )]
  #[case::collection_owner_pt_beneficiary_to_collection(
    TransferOperation::BeneficiaryToCollection,
    collection_owner(),
    program_token()
  )]
  fn test_authorized_operation(
    contract: Contract,
    staking_program: StakingProgram,
    #[case] operation: TransferOperation,
    #[case] operator: AccountId,
    #[case] token_id: FungibleTokenID,
  ) {
    contract.assert_authorized_treasury_operation(
      operation,
      &operator,
      &staking_program,
      &token_id,
    );
  }

  #[rstest]
  #[case::owner_pt_contract_to_collection(
    TransferOperation::ContractToCollection,
    owner(),
    program_token()
  )]
  #[case::owner_pt_collection_to_contract(
    TransferOperation::CollectionToContract,
    owner(),
    program_token()
  )]
  #[case::owner_pt_collection_to_distribution(
    TransferOperation::CollectionToDistribution,
    owner(),
    program_token()
  )]
  #[case::owner_pt_beneficiary_to_collection(
    TransferOperation::BeneficiaryToCollection,
    owner(),
    program_token()
  )]
  #[case::collection_owner_ct_contract_to_collection(
    TransferOperation::ContractToCollection,
    collection_owner(),
    contract_token()
  )]
  #[case::collection_owner_pt_contract_to_collection(
    TransferOperation::ContractToCollection,
    collection_owner(),
    program_token()
  )]
  #[case::collection_owner_ct_collection_to_contract(
    TransferOperation::CollectionToContract,
    collection_owner(),
    contract_token()
  )]
  #[case::collection_owner_pt_collection_to_contract(
    TransferOperation::CollectionToContract,
    collection_owner(),
    program_token()
  )]
  #[case::collection_owner_ct_collection_to_distribution(
    TransferOperation::CollectionToDistribution,
    collection_owner(),
    contract_token()
  )]
  #[case::collection_owner_ct_beneficiary_to_collection(
    TransferOperation::BeneficiaryToCollection,
    collection_owner(),
    contract_token()
  )]
  fn test_unauthorized_operation(
    contract: Contract,
    staking_program: StakingProgram,
    #[case] operation: TransferOperation,
    #[case] operator: AccountId,
    #[case] token_id: FungibleTokenID,
  ) {
    std::panic::set_hook(Box::new(|_| {}));

    let panicked = std::panic::catch_unwind(|| {
      contract.assert_authorized_treasury_operation(
        operation,
        &operator,
        &staking_program,
        &token_id,
      );
    });

    assert!(panicked.is_err());
  }

  #[rstest]
  #[case::contract_to_collection_amount(
    TransferOperation::ContractToCollection,
    Some(5),
    (45, 55, 50, 50)
  )]
  #[case::contract_to_collection(
    TransferOperation::ContractToCollection,
    None,
    (0, 100, 50, 50)
  )]
  #[case::collection_to_contract_amount(
    TransferOperation::CollectionToContract,
    Some(5),
    (55, 45, 50, 50)
  )]
  #[case::collection_to_contract(
    TransferOperation::CollectionToContract,
    None,
    (100, 0, 50, 50)
  )]
  #[case::collection_to_distribution_amount(
    TransferOperation::CollectionToDistribution,
    Some(5),
    (50, 45, 55, 50)
  )]
  #[case::collection_to_distribution(
    TransferOperation::CollectionToDistribution,
    None,
    (50, 0, 100, 50)
  )]
  #[case::beneficiary_to_collection(
    TransferOperation::BeneficiaryToCollection,
    None,
    (50, 100, 50, 0)
  )]
  fn test_reallocate_treasury(
    mut contract: Contract,
    mut staking_program: StakingProgram,
    contract_token: FungibleTokenID,
    #[case] operation: TransferOperation,
    #[case] amount: Option<u128>,
    #[case] expected: (u128, u128, u128, u128),
  ) {
    contract.reallocate_funds(
      operation,
      &mut staking_program,
      contract_token.clone(),
      amount,
    );

    let updated_contract_treasury = contract.contract_treasury.get(&contract_token).unwrap();
    let updated_collection_treasury = staking_program
      .collection_treasury
      .get(&contract_token)
      .unwrap();

    let updated_distribution = staking_program
      .farm
      .distributions
      .get(&contract_token)
      .unwrap();
    let updated_distribution_funds = updated_distribution.undistributed;
    let updated_beneficiary_funds = updated_distribution.beneficiary;

    assert_eq!(updated_contract_treasury, &expected.0);
    assert_eq!(updated_collection_treasury, &expected.1);
    assert_eq!(updated_distribution_funds, expected.2);
    assert_eq!(updated_beneficiary_funds, expected.3);
  }
}
