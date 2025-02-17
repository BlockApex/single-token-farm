const fs = require("fs");

let contracts_data;

let contracts_data_raw = fs.readFileSync(
  "packages/contracts/testnet_settings/account_map.json"
);
contracts_data = JSON.parse(contracts_data_raw);

const environment_file_web = `
VITE_BASE_TOKEN=${contracts_data.jumpTokenAccount}
VITE_LOCKED_CONTRACT=${contracts_data.lockedTokenAccount}
VITE_STAKING_CONTRACT=${contracts_data.xTokenAccount}
VITE_NFT_STAKING_CONTRACT=${contracts_data.nftStaking}
VITE_JUMP_LAUNCHPAD_CONTRACT=${contracts_data.launchpad}
VITE_FAUCET_CONTRACT=${contracts_data.faucet}
VITE_NEAR_NETWORK=${process.env.NEAR_NETWORK}
`;

fs.writeFileSync("./packages/web/.env", environment_file_web);

const environment_file_graphql = `
SERVE_PORT=4000
DB_USERNAME=${process.env.DB_USER}
DB_PASSWORD=${process.env.DB_PASS}
DB_HOST=${process.env.DB_HOST}
DB_PORT=5432
DB_NAME=${process.env.DB_NAME}
NFT_STAKING_CONTRACT=${contracts_data.nftStaking}
`;

fs.writeFileSync("./packages/graphql/.env", environment_file_graphql);

const environment_file_indexer = `
LAUNCHPAD_CONTRACT_ACCOUNT_ID=${contracts_data.launchpad}
NFT_STAKING_CONTRACT_ACCOUNT_ID=${contracts_data.nftStaking}
X_TOKEN_CONTRACT_ACCOUNT_ID=${contracts_data.xTokenAccount}
PG_HOST=${process.env.DB_HOST}
PG_USER=${process.env.DB_USER}
PG_PORT=5432
PG_DATABASE=${process.env.DB_NAME}
PG_PASSWORD=${process.env.DB_PASS}
LAKE_FRAMEWORK_NETWORK=${process.env.NEAR_NETWORK}
LAKE_FRAMEWORK_BLOCK_HEIGHT=${contracts_data.prefix}
`;

fs.writeFileSync("./packages/indexer/.env", environment_file_indexer);
