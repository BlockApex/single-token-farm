use once_cell::sync::Lazy;

use super::get_required_var;

#[derive(Debug)]
pub struct ContractsConfig {
    pub launchpad_contract_account_id: String,
    pub nft_staking_contract_account_id: String,
    pub x_token_contract_account_id: String,
}

impl ContractsConfig {
    fn init() -> Self {
        println!("{}", get_required_var("LAUNCHPAD_CONTRACT_ACCOUNT_ID"));
        println!("{}", get_required_var("NFT_STAKING_CONTRACT_ACCOUNT_ID"));
        println!("{}", get_required_var("X_TOKEN_CONTRACT_ACCOUNT_ID"));
        Self {
            launchpad_contract_account_id: get_required_var("LAUNCHPAD_CONTRACT_ACCOUNT_ID"),
            nft_staking_contract_account_id: get_required_var("NFT_STAKING_CONTRACT_ACCOUNT_ID"),
            x_token_contract_account_id: get_required_var("X_TOKEN_CONTRACT_ACCOUNT_ID"),
        }
    }
}

static CONTRACTS_CONFIG: Lazy<ContractsConfig> = Lazy::new(|| ContractsConfig::init());

pub fn get_contracts_config() -> &'static ContractsConfig {
    Lazy::force(&CONTRACTS_CONFIG)
}
