export type TokenMetadataType = {
  spec: string;
  name: string;
  symbol: string;
  icon?: string | null;
  decimals: number;
  address: string; // token address of token
  isNear?:boolean
};

export type QuoteResponse = {
  quote: string;
  routes: Route[];
  amount: string;
  amount_after_fee: string;
};

export type Route = {
  amount: number;
  quote: number;
  route: RouteDetails;
  quote_token: string;
  percent: number;
  trade_type: string;
  pool_addresses: string[];
  actual_quote: number;
  actual_amount: number;
};

type RouteDetails = {
  pools: Pool[];
  path: string[];
  input: string;
  output: string;
};

type Pool = {
  liquidity_provider: string;
  pool_id: number;
  token_in: string;
  token_out: string;
  reserves_in: string;
  reserves_out: string;
  fees: number[];
  fee_divisor: number | null;
  liquidities: string[];
  prices: string[] | null;
  spot_prices: string[] | null;
  swap_path: {
    amount_in: string;
    amount_out: string;
    token_in: string;
    token_out: string;
  };
  symbols: string[];
  token_in_decimals: number;
  token_out_decimals: number;
};
