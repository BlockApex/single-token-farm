use crate::errors::{ERR_101, ERR_102, ERR_103};
use crate::*;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, PartialEq, Debug)]
pub struct Schema {
  pub category: String,
  pub allocated_quantity: u128, // how many tokens from this schema were already 'locked'
  pub total_quantity: u128, //the schemas's total avlible tokens (all the investments from this category)
  pub initial_release: u128, //releases should be a fraction
  pub cliff_release: u128,
  pub final_release: u128,
  pub initial_timestamp: u64,
  pub cliff_delta: u64,
  pub final_delta: u64, // final delta is the period AFTER the cliff, NOT FROM initial_timestamp
  pub curve_type: CurveType,
  pub investments: Vec<String>,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, PartialEq, Debug)]
pub enum CurveType {
  Linear { discrete_period: u64 },
}

#[allow(unreachable_patterns)]
impl CurveType {
  pub fn calculate_curve_return(
    &self,
    final_delta: u64,
    cliff_release: u128,
    elapsed_curve_time: u64,
  ) -> u128 {
    match self {
      CurveType::Linear { discrete_period } => {
        let discrete_elapsed = elapsed_curve_time as u128 / *discrete_period as u128;
        let discrete_final = final_delta as u128 / *discrete_period as u128;
        let percentage_elapsed = (discrete_elapsed * FRACTION_BASE) / discrete_final;

        (cliff_release * percentage_elapsed) / FRACTION_BASE
      }
      _ => panic!("{}", ERR_102),
    }
  }
}

impl Schema {
  pub fn new(
    category: String,
    total_quantity: u128,
    initial_release: u128, //releases should be a fraction
    cliff_release: u128,
    final_release: u128,
    initial_timestamp: u64,
    cliff_delta: u64,
    final_delta: u64,
    curve_type: CurveType,
  ) -> Self {
    assert!(
      (initial_release + cliff_release + final_release) == FRACTION_BASE,
      "{}",
      ERR_101
    );

    Self {
      category,
      allocated_quantity: 0,
      total_quantity,
      initial_release,
      cliff_release,
      final_release,
      initial_timestamp,
      cliff_delta,
      final_delta,
      curve_type,
      investments: Vec::new(),
    }
  }

  pub fn change_schema(
    &mut self,
    total_quantity: u128,
    initial_release: u128, //releases should be a fraction
    cliff_release: u128,
    final_release: u128,
    initial_timestamp: u64,
    cliff_delta: u64,
    final_delta: u64,
    curve_type: CurveType,
  ) {
    assert_eq!(
      (initial_release + cliff_release + final_release),
      FRACTION_BASE,
      "{}",
      ERR_101
    );

    assert!(total_quantity >= self.allocated_quantity, "{}", ERR_103);

    self.total_quantity = total_quantity;
    self.initial_release = initial_release;
    self.cliff_release = cliff_release;
    self.final_release = final_release;
    self.initial_timestamp = initial_timestamp;
    self.cliff_delta = cliff_delta;
    self.final_delta = final_delta;
    self.curve_type = curve_type;
  }
}

//view_schema_data(id) → show schema data
#[cfg(test)]
mod tests {
  // use crate::tests::*;

  use super::*;

  #[test]
  fn implementation_test_calculate_curve_return_linear() {
    // This is an implementation test. It's used to assert that implementation of code is correct
    // in case of refactoring you can safely disregard this test and erase it
    // Asserts that calculate_curve_return method of CurveType is giving the
    // correct result for the Linear variant
    let one_day: u64 = 1_000_000_000 * 60 * 60 * 24;

    let curve_type: CurveType = CurveType::Linear {
      discrete_period: one_day * 3,
    };

    let final_delta = one_day * 360;
    let cliff_release = 100;
    let elapsed_curve_time = one_day * 10;
    assert_eq!(
      curve_type.calculate_curve_return(final_delta, cliff_release, elapsed_curve_time),
      2
    );

    let curve_type2: CurveType = CurveType::Linear {
      discrete_period: one_day * 30,
    };

    let final_delta2 = one_day * 90;
    let cliff_release2 = 100;
    let elapsed_curve_time2 = one_day * 45;
    assert_eq!(
      curve_type2.calculate_curve_return(final_delta2, cliff_release2, elapsed_curve_time2),
      33
    );

    let curve_type3: CurveType = CurveType::Linear {
      discrete_period: one_day * 30,
    };

    let final_delta3 = one_day * 150;
    let cliff_release3 = 100;
    let elapsed_curve_time3 = one_day * 149;
    assert_eq!(
      curve_type3.calculate_curve_return(final_delta3, cliff_release3, elapsed_curve_time3),
      80
    );
  }
}
