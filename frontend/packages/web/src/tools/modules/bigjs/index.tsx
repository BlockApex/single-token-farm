import Big from "big.js";

export function getDecimals(decimals: number | undefined) {
  return Big(10).pow(decimals || 1);
}

export function formatBigNumberWithDecimals(
  value: string | number | Big,
  decimals: Big
) {
  return new Big(value).div(decimals).toFixed(2);
}


export function parseBigNumberWithDecimals(
  value: string | number | Big,
  decimals: Big
) {
  return new Big(value).mul(decimals);
}