// amount of tokens that jump will deposit every month
// this is an alternative while there is no track record
// of yield to extrapolate from
export const JUMP_YEARLY_DISTRIBUTION_COMPROMISE = "360000";
export const XJUMP_TETHER_TOKEN = "3a3580a93c57ad06f9bfusdt.testnet";
export const XJUMP_BASE_TOKEN_RATIO = "1";
export const XJUMP_BASE_XTOKEN_RATIO = "1";
export const XJUMP_BASE_USDT_TOKEN_RATIO = "1";
const weekMS = 604800000;
const monthMS = 2629743000;
export const TODAY_DATE_TIMESTAMP = String(new Date().getTime());
export const WEEK_BEFORE_TIMESTAMP = String(new Date().getTime() - weekMS);
export const MONTH_BEFORE_TIMESTAMP = String(new Date().getTime() - monthMS);
export const XJUMP_FIRST_TIME_ITERATION_KEY = "@xjump-first-interaction";

export default JUMP_YEARLY_DISTRIBUTION_COMPROMISE;
