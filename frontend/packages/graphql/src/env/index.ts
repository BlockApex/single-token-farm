import { config } from "dotenv";

config();

export const EnvVariables = {
  db_host: process.env.DB_HOST || "",
  db_port: process.env.DB_PORT || 5432,
  db_password: process.env.DB_PASSWORD || "",
  db_name: process.env.DB_NAME || "jump_testnet",
  server_port: process.env.PORT || 4000,

  db_dialect: process.env.DB_DIALECT || "postgres",
  db_username: process.env.DB_USERNAME || "postgres",
  nft_staking_contract: process.env.NFT_STAKING_CONTRACT,
  launchpad_contract: process.env.JUMP_LAUNCHPAD_CONTRACT,
  db_url: process.env.DATABASE_URL,
  rpc_url: process.env.NEAR_RPC_URL || "https://rpc.testnet.near.org",
};
