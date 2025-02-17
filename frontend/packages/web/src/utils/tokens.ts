import { useState, useEffect } from "react";

import {
  connectDefaultNear,
  getWhitelistedTokens,
  nearConfigs,
} from "./config";
import { TokenMetadataType } from "./types";
import { getDefaultTokens } from "@/utils/defaultTokens";

export const useTokens = (): {
  tokens: TokenMetadataType[];
  strict: TokenMetadataType[];
  loading: boolean;
  error: string | null;
  starredTokens: TokenMetadataType[];
  refetch : ()=>void
} => {
  const [tokens, setTokens] = useState<TokenMetadataType[]>([]);
  const [strict, setStrict] = useState<TokenMetadataType[]>([]);
  const [starredTokens, setStarredTokens] = useState<TokenMetadataType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [flag , setFlag] = useState(false)
  const defaultTokens = getDefaultTokens();

  // Get the list of tokens from browser local storage
  useEffect(() => {
    const localStorageStarredTokens = localStorage.getItem("starred_tokens");
    if (localStorageStarredTokens) {
      setStarredTokens(JSON.parse(localStorageStarredTokens));
    }
    const storedTokens = localStorage.getItem("tokens");
    const strictTokens = localStorage.getItem("strict_tokens");
    if (storedTokens && strictTokens) {
      setTokens([defaultTokens[0], ...JSON.parse(storedTokens)]);
      setStrict([defaultTokens[0], ...JSON.parse(strictTokens)]);
      setLoading(false);
    }
  }, [flag]);

  useEffect(() => {
    const initTokens = async () => {
      try {
        const near = await connectDefaultNear(nearConfigs);
        const whiteListTokens = await getWhitelistedTokens(near);
        const allTokens = whiteListTokens;
        const strictTokens = whiteListTokens.slice(0, 35);
        const finalStictTokens  = [defaultTokens[0] , ...strictTokens]
        setTokens([defaultTokens[0] , ...allTokens]);
        setStrict(finalStictTokens);
        localStorage.setItem("tokens", JSON.stringify(allTokens));
        localStorage.setItem("strict_tokens", JSON.stringify(strictTokens));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initTokens();
  }, []);

  const refetch = ()=>{
    setFlag(!flag)
  }

  return { tokens, strict, loading, error, starredTokens , refetch};
};
