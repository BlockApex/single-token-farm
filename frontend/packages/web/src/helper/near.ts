import { StakingToken } from "@near/ts";
import axios from "axios";
import Big from "big.js";
import { BN } from "bn.js";
import { RPC } from "@/utils/config";

export async function viewMethod(
  contractId: string,
  methodName: string,
  args: any
) {
  const response = await axios.post(
    RPC,
    createArgs(contractId, methodName, args)
  );

  if (response.data.error) {
    throw new Error(response.data.error.data);
  }
  if (response.data.result.error) {
    throw new Error(response.data.result.error);
  }
  return JSON.parse(Buffer.from(response.data.result.result).toString("utf-8"));
}
function createArgs(contractId: string, methodName: string, args: any) {
  const argsBase64 = Buffer.from(JSON.stringify(args)).toString("base64");

  return {
    jsonrpc: "2.0",
    id: "dontcare",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: contractId,
      method_name: methodName,
      args_base64: argsBase64,
    },
  };
}
export async function getRewards(collection_id: string) {
  const { farm } = await viewMethod(
    import.meta.env.VITE_NFT_STAKING_CONTRACT,
    "view_staking_program",
    {
      collection: {
        type: "NFTContract",
        account_id: collection_id,
      },
    }
  );
  return farm;
}
export async function findTokenMetadata(account_id: string) {
  const metadata = await viewMethod(account_id, "ft_metadata", {}).catch(
    (_err) => {
      return {
        symbol: "string",
        decimals: 0,
        icon: "https://near.org/wp-content/themes/near-19/assets/img/near_logo.svg",
        name: "string",
      };
    }
  );
  return metadata;
}

export async function parseRawFarmDataToReward(rewards: any) {
  const farmPromises = rewards.map(async (farm) => {
    const millisecondsPerMonth = 2592000000;
    const interval = farm.round_interval;
    const distributions = farm.distributions;
    const stakingRewards: StakingToken[] = [];

    for (const key in distributions) {
      const metadata = await findTokenMetadata(key);
      const { reward } = distributions[key];
      const rewardBN = new BN(new Big(reward).toFixed(0));
      const intervalBN = new BN(interval);
      const millisecondsPerMonthBN = new BN(millisecondsPerMonth);

      stakingRewards.push({
        ...metadata,
        account_id: key,
        perMonth: millisecondsPerMonthBN
          .mul(rewardBN)
          .div(intervalBN)
          .toString(),
      });
    }
    return stakingRewards;
  });
  const final_result = await Promise.all(farmPromises);
  return final_result;
}
