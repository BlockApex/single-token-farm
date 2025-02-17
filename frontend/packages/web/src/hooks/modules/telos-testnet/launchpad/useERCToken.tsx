import React from "react";
import { Address, useAccount } from "wagmi";
import tokenAbi from "@/contracts/TokenContract.json";
import { BigNumberish } from "ethers";
import { readContract } from "wagmi/actions";
export default function useERCToken(tokenAddress?: Address) {
  const [balance, setBalance] = React.useState("0");
  const [allownace, setAllowance] = React.useState("0");
  const { address } = useAccount();
  React.useEffect(() => {
    if (!address && allownace !== "0" && balance !== "0") {
      setBalance("0");
      setAllowance("0");
      return;
    }
    if (!tokenAddress) return;

    getTokenBalance(tokenAddress, address).then((_balance) => {
      const __balance = _balance as BigNumberish;
      setBalance(__balance.toString());
    });
  }, [tokenAddress, address]);

  function refetch() {
    if (!address) return;
    if (!tokenAddress) return;

    getTokenBalance(tokenAddress, address).then((_balance) => {
      const __balance = _balance as BigNumberish;
      setBalance(__balance.toString());
    });
  }

  return { balance, allownace, refetch };
}

export async function getTokenBalance(
  tokenAddress: Address,
  account?: Address
) {
  if (!account) return 0;
  const balance = await readContract({
    address: tokenAddress,
    abi: tokenAbi.abi,
    functionName: "balanceOf",
    args: [account],
  });
  return balance;
}
