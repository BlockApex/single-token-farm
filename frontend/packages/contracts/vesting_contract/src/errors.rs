// Schema erros
// PRIMEIRO NUMERO EH A SECAO
// SEGUNDO NUMERO EH A

pub(crate) const ERR_001: &str = "Vesting: Contract: function is private to owner";

pub(crate) const ERR_002: &str =
  "Vesting: Contract: new_schema: There is already a Schema with this category 
    (the category is the schema id)";

pub(crate) const ERR_003: &str =
  "Vesting: Contract: new_investment: There is already an Investment with this ID 
    (it uses the same schema and same acconunt)";

pub(crate) const ERR_004: &str =
  "Vesting: Contract: new_investment: The allocated amount for this investment 
    is greater than the amount of tokens available on that  schema category:  
    (schema.aloccated_quantity + total_value) MUST be SMALLER then or EQUAL to schema.total_value";

pub(crate) const ERR_005: &str = "Vesting: Contract: Schema: Schema does not exist";

pub(crate) const ERR_006: &str = "Vesting: Contract: Investment: Investment does not exist";

pub(crate) const ERR_007: &str =
  "Vesting: Contract: withdraw_investment: The value you are trying to withdraw is greater then 
    this investment's balance";

pub(crate) const ERR_101: &str = "Vesting: Schema: Cannot create schema: sum of
    initial_release + cliff_release + final_release  MUST be equal to FRACTION_BASE";

pub(crate) const ERR_102: &str = "Vesting: Schema: CurveType: Return formula for this 
curve type variant has not been implemented yet";

pub(crate) const ERR_103: &str = "Vesting: Schema: change_schema: The schema's new 
total value cannot be SMALLER then the value that is already allocated for this schema 
(total_value >= self.allocated_value)";

pub(crate) const ERR_201: &str = "Vesting: Schema: Cannot withdraw value:  sum of 
self.withdrawn_value + value_to_withdraw  MUST be SMALLER or EQUAL to self.total_value ";

pub(crate) const ERR_301: &str =
  "Actions: owner_actions:ft_on_transfer: function is private to owner";

pub(crate) const ERR_302: &str =
  "Actions: owner_actions:ft_on_transfer: only the vesting token contract can be used 
    - no other token can be used on this contract";

pub(crate) const ERR_303: &str = r#"Actions: owner_actions:ft_on_transfer: Cannot parse the message - please use the following format: 
    {
        "category": " ",
        "initial_release" : " ",
        "cliff_release" : " ", 
        "final_release": " ",
        "initial_timestamp": " ",
        "cliff_delta" : " ",
        "final_delta" : " ",
        "curve_type" : " ",
        "discrete_period": " "
    }"#;

pub(crate) const ERR_304: &str =
    "Vesting: Owner Actions: owner_withdraw_investments: Not enough gas was attatched on the transaction  - attach at least
    150 Tgas";

pub(crate) const ERR_401: &str =
  "Vesting: Investor Actions: view_investments: Investment does not exist";

pub(crate) const ERR_402: &str =
  "Vesting: Investor Actions: view_investments: Schema does not exist";

pub(crate) const ERR_403: &str =
    "Vesting: Investor Actions: withdraw_your_investments: Not enough gas was attatched on the transaction  - attach at least
    150 Tgas";
