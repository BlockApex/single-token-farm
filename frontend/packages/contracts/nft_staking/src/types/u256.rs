use std::io::{Error, ErrorKind};

use near_sdk::{
  borsh::{BorshDeserialize, BorshSerialize},
  serde::{self, de::Visitor, Deserialize, Serialize},
};
use uint::construct_uint;

// U1024 with 256 bits consisting of 4 x 64-bit words
construct_uint! {
  pub struct U256(4);
}

const BYTE_SIZE: usize = 32;

// copied from borsh crate internals
const ERROR_UNEXPECTED_LENGTH_OF_INPUT: &str = "Unexpected length of input";

#[inline]
const fn empty_256_buffer() -> [u8; BYTE_SIZE] {
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ] // will this work? or will it have concurrency issues?
}

impl BorshSerialize for U256 {
  #[inline]
  fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
    let buffer: &mut [u8; BYTE_SIZE] = &mut empty_256_buffer();
    self.to_little_endian(buffer);

    writer.write_all(buffer)
  }

  fn try_to_vec(&self) -> std::io::Result<Vec<u8>> {
    let mut result = Vec::with_capacity(BYTE_SIZE);
    BorshSerialize::serialize(&self, &mut result)?;
    Ok(result)
  }
}

impl BorshDeserialize for U256 {
  #[inline]
  fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
    if buf.len() < BYTE_SIZE {
      return Err(Error::new(
        ErrorKind::InvalidInput,
        ERROR_UNEXPECTED_LENGTH_OF_INPUT,
      ));
    }

    let res = U256::from_little_endian(buf[..BYTE_SIZE].try_into().unwrap());

    *buf = &buf[BYTE_SIZE..];

    Ok(res)
  }
}

impl Serialize for U256 {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    serializer.serialize_str(&self.to_string())
  }
}

struct U256Visitor;

impl<'de> Visitor<'de> for U256Visitor {
  type Value = U256;

  fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
    formatter.write_str("an unsigned integer smaller than 2^256 - 1, encoded as a string")
  }

  fn visit_string<E>(self, v: String) -> Result<Self::Value, E>
  where
    E: serde::de::Error,
  {
    U256::from_dec_str(&v).or_else(|e| Err(E::custom(e)))
  }

  fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
  where
    E: serde::de::Error,
  {
    U256::from_dec_str(v).or_else(|e| Err(E::custom(e)))
  }
}

impl<'de> Deserialize<'de> for U256 {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: serde::Deserializer<'de>,
  {
    deserializer.deserialize_str(U256Visitor)
  }
}

#[allow(unused_imports)]
mod tests {
  use super::*;
  use std::io::BufWriter;

  #[test]
  fn test_empty_256_buffer() {
    let mutated = &mut empty_256_buffer();

    U256::one().to_little_endian(mutated);

    assert_ne!(*mutated, empty_256_buffer());
  }

  #[test]
  fn test_borsh_serialize_deserialize_lossless() {
    let num: U256 = U256::one();

    let writer_buffer: &mut [u8] = &mut empty_256_buffer();
    let writer = &mut BufWriter::new(writer_buffer);

    let serialize_result = BorshSerialize::serialize(&num, writer);
    assert!(serialize_result.is_ok());

    let deserialize_result = <U256 as BorshDeserialize>::deserialize(&mut writer.buffer());
    assert_eq!(deserialize_result.unwrap(), num);
  }

  #[test]
  fn test_borsh_deserialize_short_buffer() {
    let mut buffer: &[u8] = &[0, 0, 0, 0, 0, 0, 0, 0];

    let deserialize_result = <U256 as BorshDeserialize>::deserialize(&mut buffer);
    assert!(deserialize_result.is_err());
  }

  #[test]
  fn test_serde_deserialize() {
    let deserialize_result = serde_json::from_str::<U256>("\"1\"");

    assert_eq!(deserialize_result.unwrap(), U256::one());
  }

  #[test]
  fn test_serde_serialize() {
    let serialize_result = serde_json::to_string(&U256::one());

    assert_eq!(serialize_result.unwrap(), "\"1\"");
  }
}
