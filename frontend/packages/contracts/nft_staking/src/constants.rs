use crate::types::u256::U256;
use near_sdk::Gas;

pub const DENOM: u128 = 1_000_000_000_000_000_000_000;
pub const DENOM_U256: U256 = U256([0x35c9adc5dea00000, 0x36, 0, 0]);

pub const COMPENSATE_GAS: Gas = Gas(50_000_000_000_000); // ??
pub const FT_TRANSFER_GAS: Gas = Gas(50_000_000_000_000);
pub const NFT_TRANSFER_GAS: Gas = Gas(50_000_000_000_000); // ??

#[allow(unused_imports)]
mod tests {
  use super::*;

  #[test]
  pub fn test_equal_denoms() {
    assert_eq!(DENOM, DENOM_U256.as_u128());
  }
}
