import BigNumber from "bignumber.js";
import {
  toNonDivisibleNumber,
  toReadableNumber,
  toLowestDenomination,
  calculateFairShare,
  formatValueInDecimals,
  formatNumberWithSuffix,
  percent,
  scientificNotationToString,
  toPrecision,
  convertTokenAmountWithDecimal,
} from "@/utils/conversion";



export const LP_TOKEN_DECIMALS = 24;



export const calculateLPPercentage = (
  lps: string,
  shares_total_supply: string
): string => {
  if(parseFloat(shares_total_supply) <= 0) return "0.00"
  if(parseFloat(lps) <= 0 || isNaN(parseFloat(lps))) return "0.00"
  const lpsBig = new BigNumber(lps);
  const totalSupplyBig = new BigNumber(shares_total_supply);
  const percentage = lpsBig.dividedBy(totalSupplyBig).multipliedBy(100);
  const truncatedValue = percentage
    .decimalPlaces(2, BigNumber.ROUND_DOWN)
    .toFixed(2);

  return truncatedValue;
};

export const lpReadableValue = (decimal: number, lp: BigNumber) => {
  return toPrecision(
    toReadableNumber(
      decimal,
      lp.toNumber().toLocaleString("fullwide", { useGrouping: false })
    ),
    2
  );
};
