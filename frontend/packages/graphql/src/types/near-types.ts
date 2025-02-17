import { ID } from "./graphql-types";

export type BlockHash = string;

export type BlockHeight = number;

export type NearQuery = {
  result: Uint8Array;
  block_height: BlockHeight;
  block_hash: BlockHash;
};

export type AccountIdQuery = {
  account_id: ID;
};

export type ProjectIdQuery = {
  project_id: ID;
};

export type TimestampQuery = {
  timestamp: string;
};
