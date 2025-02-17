import React from "react";
import { useWalletSelector } from "@/context/wallet-selector";
import { useGetStakedBalance } from "@/hooks/modules/farms";
import BigNumber from "bignumber.js";
import {
  lpReadableValue,
  LP_TOKEN_DECIMALS,
} from "@/utils/pool-utils";
import { accounts } from "@/utils/account-ids";

const FarmsCount = ({ pool }) => {
  const { accountId } = useWalletSelector();

  let seed_id = `${accounts.AMM}@${pool?.id}`;
  const { balance, error, loading } = useGetStakedBalance(accountId!, seed_id);
  let stakedBig = new BigNumber(balance);

  return (
    <p className="text-white font-bold text-xs">
      {lpReadableValue(LP_TOKEN_DECIMALS, stakedBig)} in Farms
    </p>
  );
};

export default FarmsCount;
