use crate::errors::{ERR_401, ERR_402};
use crate::utils::split_investment_id;
use crate::*;
pub use near_sdk::serde_json::{self, json, Value};
use near_sdk::{env, near_bindgen};
use std::collections::HashMap;

//blockchain exposed

#[near_bindgen]
impl Contract {
  pub fn view_schema(&self, schema_category: String) -> crate::schema::Schema {
    self.schemas.get(&schema_category).expect(ERR_005)
  }

  pub fn view_all_schemas(&self) -> Vec<String> {
    self.schemas.keys().collect()
  }

  pub fn view_investment(&self, investment_id: AccountId) -> HashMap<String, String> {
    let investment = self.investments.get(&investment_id).expect(ERR_401);
    let available_withdraw =
      self.calculate_available_withdraw(env::block_timestamp(), investment_id.clone());

    let schema_id = split_investment_id(investment_id.clone()).remove(0);
    let schema = self.schemas.get(&schema_id).expect(ERR_402);

    let initial_timestamp: u64;

    if let Some(time_stamp) = investment.date_in {
      initial_timestamp = time_stamp;
    } else {
      initial_timestamp = schema.initial_timestamp;
    }

    let mut invest_data = HashMap::new();

    invest_data.insert("investment_id".to_string(), investment_id);
    invest_data.insert(
      "total_value".to_string(),
      investment.total_value.to_string(),
    );
    invest_data.insert(
      "withdrawn_value".to_string(),
      investment.withdrawn_value.to_string(),
    );
    invest_data.insert("init. date".to_string(), initial_timestamp.to_string());
    invest_data.insert(
      "available_withdraw".to_string(),
      available_withdraw.to_string(),
    );

    invest_data
  }
}

#[cfg(test)]
mod tests {
  use crate::tests::*;
  use crate::*;

  // view_schema TEST_SUITE
  // Asserts the correct behaviour of view_schema.
  // Method must:
  // (1) Return the serealized struct if schema with given category exists;
  // (2) Panic if there's no schema saved with the given category;
  #[test]
  fn view_schema_1() {
    // Asserts:
    // (1) Return the serealized struct if schema with given category exists;
    let context = get_context(
      vec![],
      false,
      0,
      0,
      TOKEN_ACCOUNT.to_string(),
      0,
      10u64.pow(18),
    );
    testing_env!(context);

    let mut contract = init_contract();

    let category = "category".to_string();

    let schema0 = schema::Schema {
      category: category.clone(),
      allocated_quantity: 0,
      total_quantity: 100,
      initial_release: 10,
      cliff_release: 10,
      final_release: 80,
      initial_timestamp: 0,
      cliff_delta: 100,
      final_delta: 100,
      curve_type: schema::CurveType::Linear { discrete_period: 1 },
      investments: Vec::new(),
    };

    contract.schemas.insert(&category, &schema0);

    let schema1 = contract.view_schema(category);

    assert_eq!(schema0, schema1);
  }
  #[test]
  #[should_panic(expected = "Vesting: Contract: Schema: Schema does not exist")]
  fn view_schema_2() {
    // Asserts:
    // (2) Panic if there's no schema saved with the given category;
    let context = get_context(
      vec![],
      true,
      0,
      0,
      TOKEN_ACCOUNT.to_string(),
      0,
      10u64.pow(18),
    );
    testing_env!(context);

    let contract = init_contract();

    contract.view_schema("category".to_string());
  }

  // view_all_schemas TEST_SUITE
  // Asserts the correct behaviour of view_all_schemas.
  // Method must:
  // (1) Return a Vec with all serealized structs for all schema categories;
  #[test]
  fn view_all_schemas_1() {
    // Asserts:
    // (1) Return a Vec with all serealized structs for all schema categories;
    let context = get_context(
      vec![],
      false,
      0,
      0,
      TOKEN_ACCOUNT.to_string(),
      0,
      10u64.pow(18),
    );
    testing_env!(context);

    let mut contract = init_contract();

    let generate_sample_schema = |category| -> schema::Schema {
      schema::Schema {
        category: category,
        allocated_quantity: 0,
        total_quantity: 100,
        initial_release: 10,
        cliff_release: 10,
        final_release: 80,
        initial_timestamp: 0,
        cliff_delta: 100,
        final_delta: 100,
        curve_type: schema::CurveType::Linear { discrete_period: 1 },
        investments: Vec::new(),
      }
    };

    let category0 = "category0".to_string();
    let category1 = "category1".to_string();
    let category2 = "category2".to_string();

    let schema0 = generate_sample_schema(category0.clone());
    let schema1 = generate_sample_schema(category1.clone());
    let schema2 = generate_sample_schema(category2.clone());

    contract.schemas.insert(&category0, &schema0);

    contract.schemas.insert(&category1, &schema1);

    contract.schemas.insert(&category2, &schema2);

    let vec_all = contract.view_all_schemas();

    assert!(vec_all.contains(&category0));
    assert!(vec_all.contains(&category1));
    assert!(vec_all.contains(&category2));
  }

  // view_investment TEST_SUITE
  // Asserts the correct behaviour of view_investment.
  // Method must:
  // (1) Assert that requested Investment exists
  // (2) Return the serealized struct of the given Investment;
  #[test]
  #[should_panic(
    expected = "Vesting: Investor Actions: view_investments: Investment does not exist"
  )]
  fn view_investment_1() {
    // Asserts:
    // (1) Assert that requested Investment exists
    let context = get_context(
      vec![],
      true,
      0,
      0,
      TOKEN_ACCOUNT.to_string(),
      0,
      10u64.pow(18),
    );
    testing_env!(context);

    let contract = init_contract();
    contract.view_investment("investment_id".to_string());
  }

  #[test]
  fn view_investment_2() {
    // Asserts:
    // (2) Return HashMap with Investment data plus current vested funds;
    let context = get_context(
      vec![],
      false,
      0,
      0,
      TOKEN_ACCOUNT.to_string(),
      0,
      10u64.pow(18),
    );
    testing_env!(context);

    let investment0 = investment::Investment {
      account: "account".to_string(),
      total_value: 100_000_000,
      withdrawn_value: 0,
      date_in: None,
    };

    let investment_id = "category@account".to_string();

    let mut contract = init_contract();
    contract.schemas.insert(
      &"category".to_string(),
      &schema::Schema {
        category: "category".to_string(),
        allocated_quantity: 0,
        total_quantity: 100_000_000,
        initial_release: 10,
        cliff_release: 10,
        final_release: 80,
        initial_timestamp: 0,
        cliff_delta: 100,
        final_delta: 100,
        curve_type: schema::CurveType::Linear { discrete_period: 1 },
        investments: Vec::new(),
      },
    );
    contract.investments.insert(&investment_id, &investment0);

    let investment1 = contract.view_investment(investment_id.clone());

    assert_eq!(
      &investment_id.to_string(),
      investment1.get(&"investment_id".to_string()).unwrap()
    );
    assert_eq!(
      &investment0.total_value.to_string(),
      investment1.get(&"total_value".to_string()).unwrap()
    );
    assert_eq!(
      &investment0.withdrawn_value.to_string(),
      investment1.get(&"withdrawn_value".to_string()).unwrap()
    );
    assert_eq!(
      &"0".to_string(),
      investment1.get(&"init. date".to_string()).unwrap()
    );
    assert_eq!(
      &"100000".to_string(),
      investment1.get(&"available_withdraw".to_string()).unwrap()
    );
  }
}
