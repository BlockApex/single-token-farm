import {} from "@/env/contract";
import { ethers } from "ethers";
import { Button, TopCard } from "@/components";
import xTokenAbi from "@/contracts/XToken.json";
import React, { useEffect, useMemo } from "react";
import {
  Address,
  useAccount,
  useContractRead,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { erc20ABI } from "wagmi";
import { toast } from "react-hot-toast";
export default function MantleXTokenStakePanel({
  ratio,
  tokenAddress,
  XtokenAddress,
  RPC_URL,
}: {
  ratio: number;
  tokenAddress: Address;
  XtokenAddress: Address;
  RPC_URL: string;
}) {
  const { address } = useAccount();
  const [stakeAmount, setStakeAmount] = React.useState("0");
  const { data: jumpBalance } = useContractRead({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address!],
    enabled: !!address,
  });

  const parsedBalance = useMemo(() => {
    return ethers.formatEther(jumpBalance ?? 0);
  }, [jumpBalance]);

  const formatedStakeAmount = useMemo(() => {
    if (stakeAmount === "") return ethers.parseEther("0");
    return ethers.parseEther(stakeAmount);
  }, [stakeAmount]);

  const { writeAsync: approveAsync, data: approveData } = useContractWrite({
    address: tokenAddress,
    functionName: "approve",
    abi: erc20ABI,
    args: [XtokenAddress, formatedStakeAmount],
  });

  const { data: approved } = useWaitForTransaction({
    hash: approveData?.hash,
  });

  const { writeAsync: stakeAsync, data: stakeData } = useContractWrite({
    address: XtokenAddress,
    functionName: "userDeposit",
    abi: xTokenAbi.abi,
    args: [formatedStakeAmount],
  });

  async function onStakeClick() {
    if (!approveAsync) return;
    const tx = await toast.promise(approveAsync(), {
      loading: "Approving...",
      success: null,
      error: "approve failed",
    });
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    await toast.promise(provider.waitForTransaction(tx.hash), {
      loading: "Waiting for confirmation",
      success: "Approved",
      error: "approve failed",
    });

    window.location.reload();
  }

  useEffect(() => {
    if (approved) {
      if (!stakeAsync) {
        toast.error("Something went wrong");
        return;
      }
      toast
        .promise(stakeAsync(), {
          loading: "Staking...",
          success: "Staked sent,please allow for confirmations",
          error: "Stake failed",
        })
        .then((tx) => {
          const provider = new ethers.JsonRpcProvider(RPC_URL);
          toast.promise(provider.waitForTransaction(tx.hash), {
            loading: "Waiting for confirmation",
            success: "Staked",
            error: "Stake failed",
          });
        });
    }
  }, [approved]);

  return (
    <div>
      <p className="mt-4 mb-4 text-right font-semibold text-3.5 tracking-tight leading-3.5 flex justify-between items-center">
        Balance: ~{`${parseFloat(parsedBalance).toFixed(3) ?? "0"} JUMP`}
      </p>
      <label htmlFor="value" className="outline">
        <div className="relative h-[121px] flex items-center justify-center rounded-lg bg-white-600 mb-6">
          <input
            type="number"
            name="value"
            id="value"
            placeholder="0"
            value={stakeAmount}
            min="0"
            max={parsedBalance ?? "0"}
            onChange={(e) => {
              //check is number
              if (
                isNaN(Number(e.target.value)) ||
                Number(e.target.value) < 0 ||
                e.target.value === ""
              ) {
                setStakeAmount("");
                return;
              }
              setStakeAmount(e.target.value);
            }}
            className="w-full border-none bg-transparent h-[121px] p-6 rounded-lg placeholder:text-white font-extrabold text-6 tracking-tight leading-6"
          />
          <Button
            className="absolute right-6"
            onClick={() => {
              setStakeAmount(parsedBalance ?? "0");
            }}
          >
            MAX
          </Button>
        </div>
      </label>
      <div className="rounded-lg bg-white-600 p-6 pb-7 space-y-10">
        <div className="flex justify-between">
          <span className="font-semibold">APR</span>
          <span className="font-semibold">{`>210.78%`}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">xJUMP Value</span>
          <span className="font-semibold">{ratio} JUMP</span>
        </div>
      </div>
      <Button className="mt-10" full big onClick={onStakeClick}>
        Stake
      </Button>
    </div>
  );
}