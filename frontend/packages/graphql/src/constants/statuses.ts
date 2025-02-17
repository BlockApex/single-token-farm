import { StatusEnum, VisibilityEnum } from "@near/apollo";

export enum ListingStatuses {
  Funded = "Funded", // Open or Waiting or Ended
  SaleFinalized = "SaleFinalized", // Ended
  PoolCreated = "PoolCreated", // Ended
  PoolProjectTokenSent = "PoolProjectTokenSent", // Ended
  PoolPriceTokenSent = "PoolPriceTokenSent", // Ended
  LiquidityPoolFinalized = "LiquidityPoolFinalized", // Ended
}

export const ImportantStatusFilters: StatusEnum[] = [
  StatusEnum.Waiting,
  StatusEnum.Closed,
  StatusEnum.Open,
];

export const queriesPerStatus = {
  [StatusEnum.Waiting]: `
    status = 'funded'
    AND open_sale_1_timestamp >= CURRENT_TIMESTAMP`,
  [StatusEnum.Closed]: `
    (status = 'funded' AND final_sale_2_timestamp <= CURRENT_TIMESTAMP)
    OR status IN (
      'sale_finalized',
      'pool_created',
      'pool_project_token_sent',
      'pool_price_token_sent',
      'liquidity_pool_finalized'
    )`,
  [StatusEnum.Open]: `
    status = 'funded'
    AND open_sale_1_timestamp <= CURRENT_TIMESTAMP 
    AND final_sale_2_timestamp >= CURRENT_TIMESTAMP`,
} as Record<StatusEnum, string>;
