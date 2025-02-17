import Big from "big.js";

const NANO = new Big("1000000000");

export * from "./launchpad";
export * from "./nftStaking";
export * from "./xToken";

export type EventId = {
  blockHeight: string;
  transactionHash: string;
  eventIndex: string;
};

export type NearEvent = {
  standard: string;
  version: string;
  event: string;
  data: any[];
};

export function unixTsToDate(date: string): Date {
  let dateObject = new Date(
    parseInt(new Big(date).div(NANO).mul(new Big("1000")).toFixed(0))
  );
  return dateObject;
}

export function sleep(baseMs: number, multiplier: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, baseMs * multiplier);
  });
}
