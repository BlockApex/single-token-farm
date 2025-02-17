export type WithNearParams<Params = any> = {
  params?: Params;
  gas?: string;
  amount?: string;
};

export type Option<T> = T | null;

export type U128 = string;

/** @description - This is a near mutable contract call generic type for the `Contract` interface */
export type NearMutableContractCall<Params extends Record<string, any>> = (
  params: Params,
  gas?: string,
  deposit?: string
) => Promise<void>;

export type NearContractViewCall<
  Params extends Record<string, any>,
  Data extends unknown
> = (params?: Params) => Promise<Data>;

export type FtOnTransfer = NearMutableContractCall<{
  sender_id: string;
  amount: U128;
  msg: string;
}>;
