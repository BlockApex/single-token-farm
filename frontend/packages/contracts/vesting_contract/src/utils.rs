pub fn create_investment_id(category: String, account: String) -> String {
  format!("{}{}{}", category, "@", account)
}

pub fn split_investment_id(investment_id: String) -> Vec<String> {
  investment_id[..]
    .split("@")
    .map(|s| s.to_string())
    .collect()
}
