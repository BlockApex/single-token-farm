export interface Token {
  balance?: any;
  id?: string;
  token_id: string;
  owner_id: string;
  stakedAt?: number;
  metadata: Metadata;
  approved_account_ids: ApprovedAccountIds;
}

export interface StakedNFT {
  token_id: [TokenId, string];
  owner_id: string;
  staked_timestamp: number;
}

export interface TokenId {
  type: string;
  account_id: string;
}

export interface Metadata {
  title: string;
  description: any;
  media: string;
  media_hash: any;
  copies: number;
  issued_at: any;
  expires_at: any;
  starts_at: any;
  updated_at: any;
  extra: any;
  reference: any;
  reference_hash: any;
}

export interface ApprovedAccountIds {}

export interface CollectionMetaResponse {
  spec: string;
  name: string;
  symbol: string;
  icon: string;
  base_uri: string;
}

export interface StakingToken {
  spec: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  perMonth: string;
  account_id: string;
}

export interface TokenId {
  type: string;
  account_id: string;
}

export interface Transaction {
  signerId: string;
  receiverId: string;
  actions: Action[];
}

export interface Action {
  type: string;
  params: Params;
}

export interface Params {
  methodName: string;
  args: Args;
  gas: string;
  deposit: string;
}

export interface Args {
  token_id: [TokenId, string];
}

export interface TokenId {
  type: string;
  account_id: string;
}
