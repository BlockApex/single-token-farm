pub(crate) const ERR_001: &str =
  r#"ft_on_transfer: Could not parse msg, accepted values are "mint" and "deposit_profit""#;

pub(crate) const ERR_002: &str = "ft_on_transfer: only accepts tokens from self.base_token";

pub(crate) const ERR_003: &str =
  "user_actions: burn_x_token: Not enough gas attached to complete the transactions, 
you must attach at least 3 * 50_000_000_000_000 gas to complete your request";
