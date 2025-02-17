use std::collections::HashMap;

use borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::{collections::UnorderedMap, env};
use serde::Serialize;

use crate::{
  types::{FungibleTokenBalance, FungibleTokenID, NFTCollection, NonFungibleTokenID, TokenRPS},
  StorageKey,
};

use super::RewardsDistribution;

#[derive(BorshSerialize, BorshDeserialize, Serialize)]
pub struct Farm {
  pub round_interval: u64, // duration of a round in miliseconds
  pub start_at: u64, // timestamp in miliseconds to be used as t_0 for the lazy distribution calculations

  pub distributions: HashMap<FungibleTokenID, RewardsDistribution>,

  #[serde(skip)]
  pub nfts_rps: UnorderedMap<NonFungibleTokenID, TokenRPS>,
}

// TODO: turn this into a macro
fn get_key_closure(collection: NFTCollection) -> impl FnMut() -> StorageKey {
  let mut counter = 0;
  move || {
    counter += 1;
    StorageKey::FarmField {
      collection: collection.clone(),
      counter,
    }
  }
}

impl Farm {
  pub fn new(
    collection: NFTCollection,
    collection_round_reward: FungibleTokenBalance,
    round_interval: u64,
    start_at: u64,
  ) -> Self {
    let mut get_key = get_key_closure(collection);

    let mut distributions = HashMap::new();
    for (token_id, &rewards) in collection_round_reward.iter() {
      distributions.insert(token_id.clone(), RewardsDistribution::new(0, rewards));
    }

    Farm {
      round_interval,
      start_at,
      distributions,
      nfts_rps: UnorderedMap::new(get_key()),
    }
  }

  pub fn deposit_distribution_funds(&mut self, token_id: &FungibleTokenID, amount: u128) {
    let dist = self
      .distributions
      .get(token_id)
      .unwrap()
      .deposit_distribution_funds(amount);

    self.distributions.insert(token_id.clone(), dist);
  }

  pub fn withdraw_beneficiary_funds(&mut self, token_id: &FungibleTokenID) -> u128 {
    let (dist, amount) = self
      .distributions
      .get(&token_id)
      .unwrap()
      .withdraw_beneficiary();

    self.distributions.insert(token_id.clone(), dist);

    amount
  }

  pub fn withdraw_distribution_funds(&mut self, token_id: &FungibleTokenID) -> u128 {
    let (dist, amount) = self
      .distributions
      .get(&token_id)
      .unwrap()
      .withdraw_distribution();

    self.distributions.insert(token_id.clone(), dist);

    amount
  }

  fn round(&self) -> u64 {
    let delta_t = env::block_timestamp_ms()
      .checked_sub(self.start_at)
      .unwrap_or(0);

    delta_t / self.round_interval
  }

  pub fn add_nft(&mut self, nft_id: &NonFungibleTokenID) {
    self.distribute();

    let mut balance = HashMap::new();
    for (ft_id, dist) in self.distributions.iter() {
      balance.insert(ft_id.clone(), dist.rps);
    }

    self.nfts_rps.insert(nft_id, &balance);
  }

  pub fn distribute(&mut self) {
    let round = self.round();
    if round == 0 {
      return;
    }

    let total_seeds = self.nfts_rps.len();

    for (k, prev_dist) in self.distributions.clone().iter() {
      let dist = prev_dist.distribute(total_seeds, round);
      self.distributions.insert(k.clone(), dist);
    }
  }

  pub fn claim(&mut self, token_id: &NonFungibleTokenID) -> FungibleTokenBalance {
    let (rewards_map, token_rps) = self.view_unclaimed_rewards(token_id);

    self.nfts_rps.insert(token_id, &token_rps);

    rewards_map
  }

  pub fn view_unclaimed_rewards(
    &mut self,
    token_id: &NonFungibleTokenID,
  ) -> (FungibleTokenBalance, TokenRPS) {
    self.distribute();

    let mut token_rps = self.nfts_rps.get(token_id).unwrap();
    let mut rewards_map = HashMap::new();

    for (k, prev_dist) in self.distributions.clone().iter() {
      if let Some(rps) = token_rps.get(k) {
        let (dist, claimed) = prev_dist.claim(*rps);

        token_rps.insert(k.clone(), dist.rps);
        self.distributions.insert(k.clone(), dist);

        rewards_map.insert(k.clone(), claimed);
      }
    }

    (rewards_map, token_rps)
  }
}

#[cfg(test)]
mod tests {
  use std::{str::FromStr, vec};

  use near_sdk::{testing_env, AccountId};
  use rstest::rstest;

  use crate::{calc::denom_convert, types::u256::U256};

  use super::super::tests_fixtures::*;
  use super::*;

  // hacky way to pass rounds during test without time-travel
  fn pass_rounds(farm: &mut Farm, total_seeds: u64, skip_rounds: u64) {
    let current_round = farm.round();

    for (_, dist) in &mut farm.distributions {
      *dist = dist.distribute(total_seeds, current_round + skip_rounds);
    }
  }

  fn get_farm(vec_distributions: Vec<(AccountId, RewardsDistribution)>) -> Farm {
    let mut distributions = HashMap::new();
    for (k, v) in vec_distributions {
      distributions.insert(k, v);
    }

    Farm {
      round_interval: 15000,
      start_at: 0,
      distributions,
      nfts_rps: UnorderedMap::new(b'd'),
    }
  }

  fn get_nft_ids() -> [NonFungibleTokenID; 3] {
    let account_id = AccountId::from_str("collection_a.testnet").unwrap();
    let collection = NFTCollection::NFTContract { account_id };

    [
      (collection.clone(), "1 #1".to_owned()),
      (collection.clone(), "1 #2".to_owned()),
      (collection, "2 #1".to_owned()),
    ]
  }

  #[rstest]
  #[case(30, 2)]
  #[case(44, 2)]
  #[case(1, 0)]
  #[case(15, 1)]
  fn test_farm_round(#[case] block_seconds: u64, #[case] round: u64) {
    let mut context = get_context();
    context.block_timestamp(block_seconds * 10u64.pow(9));
    testing_env!(context.build());

    let farm = get_farm(vec![]);
    assert_eq!(farm.round(), round);
  }

  #[test]
  fn test_farm_distribute_no_tokens() {
    let mut context = get_context();
    context.block_timestamp(30 * 10u64.pow(9));
    testing_env!(context.build());

    let dists = get_distributions()[0..2].to_vec();

    let mut farm = get_farm(dists.clone());
    farm.distribute();

    for (k, dist) in &dists {
      let current_dist = farm.distributions.get(&k).unwrap();
      assert_eq!(
        current_dist.undistributed,
        dist.undistributed - 2 * dist.reward
      );
      assert_eq!(current_dist.beneficiary, 2 * dist.reward);
      assert_eq!(current_dist.unclaimed, 0);
      assert_eq!(current_dist.rps, U256::zero());
      assert_eq!(current_dist.rr, 2);
    }
  }

  #[test]
  fn test_farm_distribute_single_token() {
    let mut context = get_context();
    context.block_timestamp(14 * 10u64.pow(9));
    testing_env!(context.build());

    let dists = get_distributions()[0..2].to_vec();

    let mut farm = get_farm(dists.clone());

    let [nft_id, _, _] = get_nft_ids();
    farm.add_nft(&nft_id);

    // hacky way to pass rounds without time-travel
    pass_rounds(&mut farm, 1, 2);

    let nft_rps = farm.nfts_rps.get(&nft_id).unwrap();
    for (k, dist) in &dists {
      let current_dist = farm.distributions.get(&k).unwrap();

      assert_eq!(
        current_dist.undistributed,
        dist.undistributed - 2 * dist.reward
      );
      assert_eq!(denom_convert(current_dist.rps), 2 * dist.reward);
      assert_eq!(current_dist.rr, 2);
      assert_eq!(nft_rps.get(k), Some(&U256::zero()));
    }
  }

  #[test]
  fn test_farm_claim() {
    // Arrange
    let mut context = get_context();
    context.block_timestamp(30 * 10u64.pow(9));

    let mut farm = get_farm(vec![]);

    let [nft_id, _, _] = get_nft_ids();

    // Act
    farm.add_nft(&nft_id);

    // Assert
    let initial_nft_rps = farm.nfts_rps.get(&nft_id).unwrap();
    for (k, dist) in &farm.distributions {
      assert_eq!(initial_nft_rps.get(k), Some(&dist.rps));
    }

    // Arrange
    // hacky way to pass rounds without time-travel
    pass_rounds(&mut farm, 1, 1);

    // Act
    let claimed_balance = farm.claim(&nft_id);

    // Assert
    let final_nft_rps = farm.nfts_rps.get(&nft_id).unwrap();
    for (k, dist) in &farm.distributions {
      let initial_rps = initial_nft_rps.get(k).unwrap();
      let final_rps = final_nft_rps.get(k).unwrap();
      let claimed = claimed_balance.get(k).unwrap();

      assert_eq!(final_rps, &dist.rps);
      assert_eq!(claimed, &denom_convert(final_rps - initial_rps));
    }
  }
}
