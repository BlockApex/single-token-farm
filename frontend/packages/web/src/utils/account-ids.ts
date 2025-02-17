import { nearNetwork } from "./config";

const test_accounts = {
  AMM: "jump_amm.testnet",
  FARM: "jump_farm.testnet",
  SOR: "jump_router.testnet",
  TOKEN_LOCKING: "jump_token_locker.testnet",
  SINGLE_FARM: 'single_farm.testnet'
};

const main_accounts = {
  AMM: "jumpdefi-pools.near",
  FARM: "farms.jumpfinance.near",
  SOR: "jumpdefi-aggregator.near",
  TOKEN_LOCKING: "lock.jumpfinance.near",
  SINGLE_FARM: 'single_farm.testnet'
};

export const accounts =
  nearNetwork === "mainnet" ? main_accounts : test_accounts;



export const NEAR_BLOCK_URL = nearNetwork === "mainnet" ? "https://nearblocks.io/txns" : "https://testnet.nearblocks.io/txns";