use chrono::{DateTime, TimeZone, Utc};
use rust_decimal::{prelude::FromPrimitive, Decimal};

use crate::types::json_types::{U128, U64};

pub fn u64_to_utc(nano: &U64) -> DateTime<Utc> {
    let seconds = nano.0 / 1_000_000_000;

    Utc.timestamp(seconds.try_into().unwrap(), 0)
}

pub fn u32_to_decimal(num: u32) -> Decimal {
    Decimal::from_u32(num).unwrap()
}

pub fn u64_to_decimal(num: &U64) -> Decimal {
    Decimal::from_u64(num.0).unwrap()
}

pub fn u128_to_decimal(num: &U128) -> Decimal {
    Decimal::from_u128(num.0).unwrap()
}
