use crate::{constants::DENOM_U256, types::u256::U256};

pub const fn ceil_division(a: u128, b: u128) -> u128 {
  a / b + (a % b != 0) as u128
}

#[inline]
pub fn denom_multiplication(a: u128, b: u128) -> u128 {
  denom_convert(U256::from(a) * U256::from(b))
}

#[inline]
pub fn denom_division(a: u128, b: u128) -> U256 {
  U256::from(a) * DENOM_U256 / U256::from(b)
}

#[inline]
pub fn denom_convert(a: U256) -> u128 {
  (a / DENOM_U256).as_u128()
}
