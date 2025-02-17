/* Define all interested events that will trigger DB actions
 * and all their type interfaces
 * All other events will be discarded
 */
export const FT_MINT = "ft_mint";
export type FtMintData = {
  owner_id: string;
  amount: string;
  memo: string | null;
};

export const FT_BURN = "ft_burn";
export type FtBurnData = {
  owner_id: string;
  amount: string;
  memo: string | null;
};

export const PROFIT_DEPOSIT = "profit_deposit";
export type ProfitDepositData = {
  quantity_deposited: string;
  base_token_treasury_after_deposit: string;
  x_token_supply_after_deposit: string;
  timestamp: string;
};
