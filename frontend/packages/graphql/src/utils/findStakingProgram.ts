// demonstrates how to query the state without setting
// up an account. (View methods only)
import { EnvVariables } from "@/env";
import { NearQuery } from "@/types";
import { providers } from "near-api-js";

const provider = new providers.JsonRpcProvider(EnvVariables.rpc_url);

export interface StakingProgram {
  collection: Collection;
  collection_owner: string;
  collection_treasury: any;
  token_address: string;
  farm: Farm;
  min_staking_period: string;
  early_withdraw_penalty: string;
}

export interface Farm {
  round_interval: number;
  start_at: number;
  distributions: any;
}

export interface Collection {
  type: string;
  account_id: string;
}

export async function findStakingProgram(
  collection: string
): Promise<StakingProgram> {
  const args = {
    collection: {
      type: "NFTContract",
      account_id: collection,
    },
  };

  const rawResult = await provider.query<NearQuery>({
    request_type: "call_function",
    account_id: EnvVariables.nft_staking_contract,
    method_name: "view_staking_program",
    finality: "optimistic",
    args_base64: btoa(JSON.stringify(args)),
  });

  // format result
  const res = JSON.parse(Buffer.from(rawResult.result).toString());

  return res;
}
