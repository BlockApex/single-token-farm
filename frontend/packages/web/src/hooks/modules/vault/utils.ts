import Big from "big.js";
import { millisecondsToHours } from "date-fns";

// types
import type { Vault } from "./hooks";
import type { ITokenPrice } from "@/stores/token-price-store";

export interface IOptions {
  tokenPrices: ITokenPrice[];
  vault: Vault;
}
export interface ITokenPriceWithDecimals extends ITokenPrice {
  decimals: number;
}

export function convertToStandardUnits(value: Big, decimals: number): Big {
  return value.div(new Big(10).pow(decimals));
} 

export function calculateAPR({ tokenPrices, vault }: IOptions): string {
  const rewardTokenPrice = tokenPrices.reduce<ITokenPriceWithDecimals | null>((acc, currentValue) => currentValue.contract === vault.vaultConfig.reward_token.id ? {
      ...currentValue,
      decimals: vault.vaultConfig.reward_token.decimal,
    } : acc, null);
  const stakeTokenPrice = tokenPrices.reduce<ITokenPriceWithDecimals | null>((acc, currentValue) => {
    // for xjump stake tokens, we need to use the price of jump tokens, so we can do a conversion
    if (vault.vaultConfig.stake_token.id === 'xjumptoken.jumpfinance.near' && currentValue.contract === 'jumptoken.jumpfinance.near') {
      return {
        contract: vault.vaultConfig.stake_token.id,
        decimals: vault.vaultConfig.stake_token.decimal,
        price: new Big(2.57).mul(new Big(currentValue.price)).toString(),
        symbol: vault.vaultConfig.stake_token.name,
      };
    }
    
    return currentValue.contract === vault.vaultConfig.stake_token.id ? {
      ...currentValue,
      decimals: vault.vaultConfig.stake_token.decimal,
    } : acc;
  }, null);

  if (!rewardTokenPrice || !stakeTokenPrice) {
    return "-";
  }
  
  const maxFillAmountInStandardUnits = convertToStandardUnits(new Big(vault.max_fill_amount), stakeTokenPrice.decimals);
  const aprInStandardUnits = convertToStandardUnits(new Big(vault.apr), 2); // does decimals come from usd?
  const stakedTimeInDays = Math.ceil(millisecondsToHours(vault.locked_time_ms) / 24);
  const stakeTokenValue = new Big(stakeTokenPrice.price).mul(maxFillAmountInStandardUnits);
  const rewardTokenValue = new Big(rewardTokenPrice.price)
    .mul(maxFillAmountInStandardUnits)
    .mul(aprInStandardUnits)
    .mul(new Big(stakedTimeInDays / 365));

  return `${rewardTokenValue.div(stakeTokenValue).toFixed(2)}%`;
}
