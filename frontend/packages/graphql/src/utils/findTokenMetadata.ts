// demonstrates how to query the state without setting
// up an account. (View methods only)
import { EnvVariables } from "@/env";
import { NearQuery } from "@/types";
import { providers } from "near-api-js";

const provider = new providers.JsonRpcProvider(EnvVariables.rpc_url);

export interface TokenMetadataResponse {
  spec: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
}

export async function findTokenMetadata(
  token_address: string
): Promise<TokenMetadataResponse> {
  try {
    const rawResult = await provider.query<NearQuery>({
      request_type: "call_function",
      account_id: token_address,
      method_name: "ft_metadata",
      finality: "optimistic",
      args_base64: "e30=",
    });

    // format result
    const res = JSON.parse(Buffer.from(rawResult.result).toString());
    return res;
  } catch (e) {
    if (
      !JSON.stringify(e).includes("UntypedError") &&
      !JSON.stringify(e).includes("CodeDoesNotExist")
    )
      throw "Blockchain query error";

    return {
      spec: "not_found",
      name: "string",
      symbol: "string",
      icon: "string",
      decimals: 0,
    };
  }
}
