// demonstrates how to query the state without setting
// up an account. (View methods only)
import { EnvVariables } from "@/env";
import { NearQuery } from "@/types";
import { providers } from "near-api-js";

const provider = new providers.JsonRpcProvider(EnvVariables.rpc_url);

export interface ProjectInfoResponse {
  total_amount_sale_project_tokens: string;
  allocations_sold: string;
}

export async function findProjectInfo(
  project_id: string
): Promise<ProjectInfoResponse> {
  const args = {
    listing_id: project_id,
  };

  const rawResult = await provider.query<NearQuery>({
    request_type: "call_function",
    account_id: EnvVariables.launchpad_contract,
    method_name: "view_listing",
    finality: "optimistic",
    args_base64: btoa(JSON.stringify(args)),
  });

  // format result
  const res = JSON.parse(Buffer.from(rawResult.result).toString());

  return res;
}
