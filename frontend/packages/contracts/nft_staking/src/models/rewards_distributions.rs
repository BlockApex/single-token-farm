use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};

use crate::{
  calc::{ceil_division, denom_convert, denom_division},
  types::u256::U256,
};

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug)]
pub struct RewardsDistribution {
  pub undistributed: u128,
  pub unclaimed: u128,
  pub beneficiary: u128,
  pub rps: U256,
  pub rr: u64,
  pub reward: u128,
}

impl RewardsDistribution {
  pub fn new(balance: u128, reward: u128) -> Self {
    RewardsDistribution {
      undistributed: balance,
      unclaimed: 0,
      beneficiary: 0,
      rps: U256::zero(),
      rr: 0,
      reward,
    }
  }

  pub fn distribute(&self, total_seeds: u64, round: u64) -> Self {
    let mut dist = self.clone();
    dist.rr = round;

    let delta_t = dist.rr - self.rr;
    let mut added_reward = (delta_t as u128) * self.reward;

    if self.undistributed < added_reward {
      added_reward = self.undistributed;

      let increment_rr: u64 = ceil_division(added_reward, self.reward).try_into().unwrap();

      dist.rr = self.rr + increment_rr;
    }

    dist.undistributed -= added_reward;

    if total_seeds == 0 {
      dist.beneficiary += added_reward;
      dist.rps = U256::zero();
    } else {
      dist.unclaimed += added_reward;
      dist.rps += denom_division(added_reward, total_seeds.into());
    }

    dist
  }

  pub fn claim(&self, token_rps: U256) -> (Self, u128) {
    let mut dist = self.clone();
    let claimed = denom_convert(self.rps - token_rps);

    dist.unclaimed -= claimed;

    (dist, claimed)
  }

  pub fn deposit_distribution_funds(&self, amount: u128) -> Self {
    let mut dist = self.clone();

    dist.undistributed += amount;

    dist
  }

  pub fn withdraw_beneficiary(&self) -> (Self, u128) {
    let mut dist = self.clone();
    let beneficiary = self.beneficiary;

    dist.beneficiary = 0;

    (dist, beneficiary)
  }

  pub fn withdraw_distribution(&self) -> (Self, u128) {
    let mut dist = self.clone();
    let undistributed = self.undistributed;

    dist.undistributed = 0;

    (dist, undistributed)
  }
}

#[cfg(test)]
mod tests {
  use near_sdk::testing_env;
  use rstest::rstest;

  use crate::calc::denom_convert;

  use super::super::tests_fixtures::*;

  #[rstest]
  #[case(0, 10, 2, (80, 20, 2))]
  #[case(0, 3, 2, (80, 20, 6))]
  #[case(2, 3, 2, (0, 0, 0))]
  #[case(3, 1, 4, (0, 11, 11))]
  #[case(3, 3, 4, (0, 11, 3))]
  #[case(3, 4, 4, (0, 11, 2))]
  fn test_rewards_distribution_distribute(
    #[case] index: usize,
    #[case] total_seeds: u64,
    #[case] rounds: u64,
    #[case] expected: (u128, u128, u128),
  ) {
    let context = get_context();
    testing_env!(context.build());

    let dist = get_distributions()[index].1.clone();

    let new_dist = dist.distribute(total_seeds, rounds);

    assert_eq!(new_dist.undistributed, expected.0);
    assert_eq!(new_dist.unclaimed, expected.1);
    assert_eq!(denom_convert(new_dist.rps), expected.2)
  }
}
