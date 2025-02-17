use crate::{
  funds::transfer::TransferOperation,
  types::{FungibleTokenID, NFTCollection},
  Contract, ContractExt,
  models::RewardsDistribution,
};

use near_sdk::{assert_one_yocto, env, json_types::U128, near_bindgen};

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn transfer(
    &mut self,
    operation: TransferOperation,
    collection: NFTCollection,
    token_id: FungibleTokenID,
    amount: Option<U128>,
  ) {
    assert_one_yocto();

    let operator = env::predecessor_account_id();

    self.transfer_funds(
      operation,
      &operator,
      &collection,
      token_id,
      amount.map(|x| x.0),
    );
  }

  #[payable]
  pub fn alter_rewards(
    &mut self,
    collection: NFTCollection,
    token_id: FungibleTokenID,
    amount: U128
  ) {
    assert_one_yocto();

    let operator = env::predecessor_account_id();

    let mut staking_program = self.staking_programs.get(&collection).unwrap();

    self.assert_authorized_operator(&operator, &staking_program, &token_id);

    // distribute rewards before updating to guarantee that up until this point 
    // all rewards were distributed according to old schema 
    staking_program.farm.distribute();

    if let Some(reward_distribution) = staking_program.farm.distributions.get(&token_id) {
      staking_program.farm.distributions.insert(token_id, RewardsDistribution {
        undistributed: reward_distribution.undistributed,
        unclaimed: reward_distribution.unclaimed,
        beneficiary: reward_distribution.beneficiary,
        rps: reward_distribution.rps,
        rr: reward_distribution.rr,
        reward: amount.0,
      });
    } else {
      staking_program.farm.distributions.insert(token_id, RewardsDistribution::new(0, amount.0));
    }
    

    self.staking_programs.insert(&collection, &staking_program);
    
  }
}
