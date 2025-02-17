import { Button } from "@/components/shared";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Address } from "viem";
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import tokenAbi from "@/contracts/TokenContract.json";
export default function MintButton({
  tokenAddress,
  tokenName,
}: {
  tokenAddress: Address;
  tokenName: string;
}) {
  const { writeAsync, data } = useContractWrite({
    address: tokenAddress,
    functionName: "mint_1k",
    abi: tokenAbi.abi,
    args: [],
  });

  const { data: minted } = useWaitForTransaction({
    hash: data?.hash,
  });

  async function onMintClick() {
    if (!writeAsync) return;
    await writeAsync();
  }

  useEffect(() => {
    if (minted) {
      toast.success("Minted!");
      window.location.reload();
    }
  }, [minted]);

  return (
    <Button key={tokenAddress} onClick={onMintClick} big>
      Mint {tokenName} for testing
    </Button>
  );
}
export function removeTrailingZeros(value: string | number) {
  if (typeof value === "number") {
    return parseFloat(value.toFixed(6)).toString();
  }
  return value.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1");
}
