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
VITE_TOKEN_LAUNCHER_CONTRACT=${contracts_data.tokenLauncher}
VITE_FAUCET_CONTRACT=${contracts_data.faucet}
VITE_NEAR_NETWORK=${process.env.NEAR_NETWORK}
VITE_GRAPHQL_API_URI=http://localhost:4000
`;

fs.writeFileSync("./packages/web/.env", environment_file_web);

const environment_file_graphql = `
SERVER_PORT=4000
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_HOST=db
DB_PORT=5432
DB_NAME=postgres
NFT_STAKING_CONTRACT=${contracts_data.nftStaking}
JUMP_LAUNCHPAD_CONTRACT=${contracts_data.launchpad}
ENV=TESTNET
`;

fs.writeFileSync("./packages/graphql/.env", environment_file_graphql);

const environment_file_indexer = `
LAUNCHPAD_CONTRACT=${contracts_data.launchpad}
NFT_STAKING_CONTRACT=${contracts_data.nftStaking}
XTOKEN_CONTRACT=${contracts_data.xTokenAccount}
DB_HOST=db
DB_USER=postgres
DB_PORT=5432
DB_NAME=postgres
DB_PASS=1234
NETWORK=${process.env.NEAR_NETWORK}
START_BLOCK=${contracts_data.last_block_height}
`;

fs.writeFileSync("./packages/indexer-ts/.env", environment_file_indexer);
