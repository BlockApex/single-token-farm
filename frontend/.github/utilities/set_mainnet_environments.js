const fs = require("fs");

const environment_file_web = `
VITE_BASE_TOKEN=jumptoken.jumpfinance.near
VITE_LOCKED_CONTRACT=lockedjumptoken.jumpfinance.near
VITE_STAKING_CONTRACT=xjumptoken.jumpfinance.near
VITE_NFT_STAKING_CONTRACT=nftstaking.jumpfinance.near
VITE_JUMP_LAUNCHPAD_CONTRACT=launchpad.jumpfinance.near
VITE_TOKEN_LAUNCHER_CONTRACT=laboratory.jumpfinance.near
VITE_NEAR_NETWORK=${process.env.NEAR_NETWORK}
`;

fs.writeFileSync("./packages/web/.env", environment_file_web);

const environment_file_graphql = `
SERVER_PORT=80
DB_USERNAME=${process.env.DB_USER}
DB_PASSWORD=${process.env.DB_PASS}
DB_HOST=${process.env.DB_HOST}
DB_PORT=5432
DB_NAME=${process.env.DB_NAME}
NFT_STAKING_CONTRACT=nftstaking.jumpfinance.near
JUMP_LAUNCHPAD_CONTRACT=launchpad.jumpfinance.near
ENV=MAINNET
NEAR_RPC_URL=https://rpc.mainnet.near.org
`;

fs.writeFileSync("./packages/graphql/.env", environment_file_graphql);
