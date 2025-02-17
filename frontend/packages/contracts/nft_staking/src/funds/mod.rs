pub mod deposit;
pub mod transfer;

#[cfg(test)]
mod tests_fixtures {
  use std::{collections::HashMap, str::FromStr};

  use near_sdk::{test_utils::VMContextBuilder, testing_env, AccountId};
  use rstest::fixture;

  use crate::{
    models::{Farm, StakingProgram},
    types::{FungibleTokenID, NFTCollection},
    Contract,
  };

  const INITIAL_CONTRACT_TREASURY: u128 = 50;
  const INITIAL_COLLECTION_TREASURY: u128 = 50;
  const INTIIAL_DISTRIBUTION_FUNDS: u128 = 50;
  const INITIAL_BENEFICIARY_FUNDS: u128 = 50;

  fn get_context() -> VMContextBuilder {
    VMContextBuilder::new()
  }

  #[fixture]
  pub fn owner() -> AccountId {
    AccountId::from_str("owner.near").unwrap()
  }

  #[fixture]
  pub fn contract_token() -> FungibleTokenID {
    AccountId::from_str("contract_token.near").unwrap()
  }

  #[fixture]
  pub fn program_token() -> FungibleTokenID {
    AccountId::from_str("program_token.near").unwrap()
  }

  #[fixture]
  pub fn collection() -> NFTCollection {
    NFTCollection::NFTContract {
      account_id: AccountId::from_str("collection.near").unwrap(),
    }
  }

  #[fixture]
  pub fn collection_owner() -> AccountId {
    AccountId::from_str("collection_owner.near").unwrap()
  }

  #[fixture]
  pub fn farm(
    collection: NFTCollection,
    contract_token: FungibleTokenID,
    program_token: FungibleTokenID,
  ) -> Farm {
    let mut collection_round_reward = HashMap::new();
    collection_round_reward.insert(contract_token.clone(), 10);
    collection_round_reward.insert(program_token.clone(), 10);

    let mut farm = Farm::new(collection.clone(), collection_round_reward, 5, 0);

    farm
      .distributions
      .entry(contract_token)
      .and_modify(|dist| dist.beneficiary = INITIAL_BENEFICIARY_FUNDS);
    farm
      .distributions
      .entry(program_token)
      .and_modify(|dist| dist.beneficiary = INITIAL_BENEFICIARY_FUNDS);

    farm
  }

  #[fixture]
  pub fn staking_program(
    farm: Farm,
    collection: NFTCollection,
    collection_owner: AccountId,
    contract_token: FungibleTokenID,
    program_token: FungibleTokenID,
  ) -> StakingProgram {
    let mut staking_program = StakingProgram::new(
      farm,
      collection,
      collection_owner,
      program_token.clone(),
      0,
      0,
    );

    staking_program
      .collection_treasury
      .insert(contract_token.clone(), INITIAL_COLLECTION_TREASURY);
    staking_program
      .collection_treasury
      .insert(program_token.clone(), INITIAL_COLLECTION_TREASURY);

    staking_program.deposit_distribution_funds(&contract_token, INTIIAL_DISTRIBUTION_FUNDS);
    staking_program.deposit_distribution_funds(&program_token, INTIIAL_DISTRIBUTION_FUNDS);

    staking_program
  }

  #[fixture]
  pub fn contract(
    owner: AccountId,
    contract_token: FungibleTokenID,
    staking_program: StakingProgram,
  ) -> Contract {
    let mut context = get_context();
    context.attached_deposit(1);
    context.predecessor_account_id(owner.clone());
    testing_env!(context.build());

    let mut contract = Contract::new(owner, vec![contract_token.clone()]);

    contract
      .contract_treasury
      .entry(contract_token)
      .and_modify(|balance| *balance = INITIAL_CONTRACT_TREASURY);

    contract
      .staking_programs
      .insert(&staking_program.collection, &staking_program);

    contract
  }
}
