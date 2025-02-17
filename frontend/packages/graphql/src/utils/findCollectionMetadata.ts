// demonstrates how to query the state without setting
// up an account. (View methods only)
import { EnvVariables } from "@/env";
import { NearQuery } from "@/types";
import { providers } from "near-api-js";
import { CollectionMetaResponse } from "@near/ts";

const provider = new providers.JsonRpcProvider(EnvVariables.rpc_url);

export async function findCollectionMetadata(
  collection_address: string
): Promise<CollectionMetaResponse> {
  const rawResult = await provider.query<NearQuery>({
    request_type: "call_function",
    account_id: collection_address,
    method_name: "nft_metadata",
    finality: "optimistic",
    args_base64: "e30=",
  });

  // format result
  const res = JSON.parse(Buffer.from(rawResult.result).toString());
  return res;
}
