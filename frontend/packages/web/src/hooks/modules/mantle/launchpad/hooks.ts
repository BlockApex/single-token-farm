import { Address, useContractRead } from "wagmi";
import launchPadAbi from "@/contracts/Launchpad.json";
import { erc20ABI } from "wagmi";
import { MANTLE_LAUNCHPAD_CONTRACT } from "@/env/contract";
export function useMantleIdoProjectCountQuery() {
  const {
    data: projectCounts,
    isLoading,
    refetch,
  } = useContractRead({
    address: MANTLE_LAUNCHPAD_CONTRACT,
    abi: launchPadAbi.abi,
    functionName: "getProjectCount",
    args: [],
  });

  return { projectCounts, isLoading, refetch };
}

export function useMantleIdoProjectQuery(id: string) {
  const {
    data: project,
    isLoading,
    isError,
    isFetching,
    isRefetching,
    refetch,
  } = useContractRead({
    address: MANTLE_LAUNCHPAD_CONTRACT,
    abi: launchPadAbi.abi,
    functionName: "projects",
    args: [id],
  });

  return {
    project: project as any[],
    isLoading,
    isError,
    isFetching,
    isRefetching,
    refetch,
  };
}

export function useERC20Metadata(tokenAddress: string) {
  const { data: symbol } = useContractRead({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: "symbol",
  });

  const { data: name } = useContractRead({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: "name",
  });

  const { data: decimals } = useContractRead({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: "decimals",
  });

  return { symbol, name, decimals };
}
