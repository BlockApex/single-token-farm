import { config } from "dotenv";
config();

if (
  [
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    process.env.DB_HOST,
    process.env.DB_PORT,
    process.env.NETWORK,
    process.env.START_BLOCK,
    process.env.LAUNCHPAD_CONTRACT,
    process.env.NFT_STAKING_CONTRACT,
    process.env.XTOKEN_CONTRACT,
  ].includes(undefined)
)
  throw "ERROR: Undefined envs";

export const DB_NAME = process.env.DB_NAME!;
export const DB_USER = process.env.DB_USER!;
export const DB_PASS = process.env.DB_PASS!;
export const DB_HOST = process.env.DB_HOST!;
export const DB_PORT = parseInt(process.env.DB_PORT!);

export const S3_BUCKET =
  process.env.NETWORK === "mainnet"
    ? "near-lake-data-mainnet"
    : "near-lake-data-testnet";
export const START_BLOCK: number = parseInt(process.env.START_BLOCK!);

export const LAUNCHPAD_CONTRACT = process.env.LAUNCHPAD_CONTRACT!;
export const NFT_STAKING_CONTRACT = process.env.NFT_STAKING_CONTRACT!;
export const XTOKEN_CONTRACT = process.env.XTOKEN_CONTRACT!;

export const INTERESTED_CONTRACTS: string[] = [
  LAUNCHPAD_CONTRACT,
  NFT_STAKING_CONTRACT,
  XTOKEN_CONTRACT,
];
