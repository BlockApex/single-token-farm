import { useNearQuery } from "react-near";
import { tokenMetadata } from "@/interfaces";

interface TokenRatio {
  x_token: string;
  base_token: string;
}

export function useTokenMetadata(token_id: string) {
  return useNearQuery<tokenMetadata>("ft_metadata", {
    contract: token_id,
    poolInterval: 1000 * 60,
    skip: !token_id,
    debug: true,
  });
}

export function useTokenBalance(
  token_id: string | null | undefined,
  account_id: string | null
) {
  return useNearQuery<string, { account_id: string | null }>("ft_balance_of", {
    contract: token_id!,
    variables: {
      account_id,
    },
    poolInterval: 1000 * 60,
    skip: !account_id || !token_id,
  });
}

export function useTokenRatio(token_id: string) {
  return useNearQuery<TokenRatio>("view_token_ratio", {
    contract: token_id,
    poolInterval: 1000 * 60,
    debug: true,
    onError(err) {
      console.warn(err);
    },
  });
}
