use super::{get_optional_var, get_required_var};
use once_cell::sync::Lazy;
use std::str::FromStr;
use strum::EnumString;

#[derive(Clone, EnumString)]
#[strum(serialize_all = "snake_case")]
pub enum Network {
    Testnet,
    Mainnet,
}

#[derive(Clone)]
pub struct LakeFrameworkConfig {
    pub network: Network,
    pub block_height: Option<u64>,
}

impl LakeFrameworkConfig {
    fn init() -> Self {
        println!("{}", get_required_var("LAKE_FRAMEWORK_NETWORK").as_str());
        println!("{}", get_required_var("LAKE_FRAMEWORK_BLOCK_HEIGHT").as_str());
        Self {
            network: Network::from_str(get_required_var("LAKE_FRAMEWORK_NETWORK").as_str())
                .unwrap_or(Network::Testnet),
            block_height: get_optional_var("LAKE_FRAMEWORK_BLOCK_HEIGHT")
                .and_then(|p| p.parse::<u64>().ok()),
        }
    }
}

impl From<&LakeFrameworkConfig> for near_lake_framework::LakeConfig {
    fn from(config: &LakeFrameworkConfig) -> Self {
        let mut lake_config = near_lake_framework::LakeConfigBuilder::default()
            .start_block_height(config.block_height.unwrap_or(0));

        match config.network {
            Network::Mainnet => {
                lake_config = lake_config.mainnet();
            }
            Network::Testnet => {
                lake_config = lake_config.testnet();
            }
        };

        lake_config.build().expect("Failed to build LakeConfig")
    }
}

static LAKE_FRAMEWORK_CONFIG: Lazy<LakeFrameworkConfig> = Lazy::new(|| LakeFrameworkConfig::init());

pub fn get_lake_framework_config() -> &'static LakeFrameworkConfig {
    Lazy::force(&LAKE_FRAMEWORK_CONFIG)
}

/*
 *     Not the prettiest solution in the world, but this is necessary because
 *  the block_height is a dynamic configuration, in the sense that it comes from the database
 *  instead of environment variables, and the config module was not designed with this use-case
 *  in mind. This was the easiest way I thought to encapsulate this inside the config module.
 */
pub fn inject_block_height(block_height: u64) -> near_lake_framework::LakeConfig {
    let static_config = get_lake_framework_config();
    let mut dynamic_config = static_config.clone();

    if let None = dynamic_config.block_height {
        dynamic_config.block_height = Some(block_height);
    }

    (&dynamic_config).into()
}
