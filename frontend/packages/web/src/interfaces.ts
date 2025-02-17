export interface tokenMetadata {
  spec: string;
  name: string;
  symbol: string;
  icon: string;
  reference: any;
  reference_hash: any;
  decimals: number;
}

export interface nftMetadata {
  spec: string;
  name: string;
  symbol: string;
  icon: string;
  base_uri: string;
  reference: any;
  reference_hash: any;
}

export interface investorAllocation {
  allocationsBought: string | undefined;
  totalTokensBought: string | undefined;
}
