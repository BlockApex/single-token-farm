mod farm;
mod rewards_distributions;
mod staked_nft;
mod staking_program;

pub use self::farm::Farm;
pub use self::rewards_distributions::RewardsDistribution;
pub use self::staked_nft::StakedNFT;
pub use self::staking_program::StakingProgram;

// TODO: convert these to actual fixtures
#[cfg(test)]
mod tests_fixtures {
  use std::str::FromStr;

  use near_sdk::{test_utils::VMContextBuilder, AccountId};

  use crate::types::FungibleTokenID;

  use super::RewardsDistribution;

  pub fn get_context() -> VMContextBuilder {
    VMContextBuilder::new()
  }

  fn get_token_ids() -> [AccountId; 2] {
    let token_a: AccountId = AccountId::from_str("token_a.testnet").unwrap();
    let token_b: AccountId = AccountId::from_str("token_b.testnet").unwrap();

    [token_a, token_b]
  }

  pub fn get_distributions() -> [(FungibleTokenID, RewardsDistribution); 5] {
    let [token_a, token_b] = get_token_ids();

    [
      (&token_a, RewardsDistribution::new(100, 10)),
      (&token_b, RewardsDistribution::new(100, 3)),
      (&token_a, RewardsDistribution::new(0, 10)),
      (&token_b, RewardsDistribution::new(11, 4)),
      (&token_a, RewardsDistribution::new(16, 4)),
    ]
    .map(|(id, dist)| (id.clone(), dist))
  }
}
