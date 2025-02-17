import { JUMP_MANTLE_ADDRESS, XJUMP_MANTLE_ADDRESS } from "@/env/contract";
import { ethers } from "ethers";
import { Button, TopCard } from "@/components";
import xTokenAbi from "@/contracts/XToken.json";
import React, { useEffect, useMemo } from "react";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { erc20ABI } from "wagmi";
import { toast } from "react-hot-toast";
import { intlFormat } from "date-fns";
import { RPC_URL } from "@/context/evm-context";
export default function MantleXTokenUnStakePanel({ ratio }: { ratio: number }) {
  const { address } = useAccount();
  const [unstakeAmount, setStakeAmount] = React.useState("0");
  const { data: xJumpBalance } = useContractRead({
    address: XJUMP_MANTLE_ADDRESS,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address!],
    enabled: !!address,
  });

  const parsedBalance = useMemo(() => {
    return ethers.formatEther(xJumpBalance ?? 0);
  }, [xJumpBalance]);

  const formatedUnstakeAmount = useMemo(() => {
    if (unstakeAmount === "") return ethers.parseEther("0");
    return ethers.parseEther(unstakeAmount);
  }, [unstakeAmount]);

  const { writeAsync: unStakeAsync } = useContractWrite({
    address: XJUMP_MANTLE_ADDRESS,
    functionName: "userWithdraw",
    abi: xTokenAbi.abi,
    args: [formatedUnstakeAmount],
  });

  async function onUnstakeClick() {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (parseFloat(unstakeAmount) > parseFloat(parsedBalance)) {
      toast.error("You don't have enough XJUMP to unstake");
      return;
    }

    if (!unStakeAsync) {
      toast.error("Something went wrong, please try again later");
      return;
    }
    try {
      const txHash = await unStakeAsync();
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      await toast.promise(provider.waitForTransaction(txHash.hash), {
        loading: "Waiting for confirmation",
        success: "Unstake success",
        error: "Unstake failed",
      });

      window.location.reload();
    } catch (e) {
      toast.error("Something went wrong, please try again later");
      return;
    }
  }

  return (
    <div>
      <p className="mt-4 mb-4 text-right font-semibold text-3.5 tracking-tight leading-3.5 ">
        You can claim: ~
        {`${
          parseFloat(parsedBalance).toFixed(3).replace(
            //replace trailing zeros
            /[0]+$/g,
            ""
          ) ?? "0"
        } xJUMP`}
      </p>
      <label htmlFor="value" className="outline">
        <div className="relative h-[121px] flex items-center justify-center rounded-lg bg-white-600 mb-6">
          <input
            type="number"
            name="value"
            id="value"
            placeholder="0"
            value={unstakeAmount}
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
          <span className="font-semibold">You Own</span>
          <span className="font-semibold">{parsedBalance || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Value at</span>
          <span className="font-semibold">
            {(ratio * parseFloat(parsedBalance || "0")).toFixed(3)} Jump
          </span>
        </div>
      </div>
      <Button className="mt-10" full big onClick={onUnstakeClick}>
        Unstake
      </Button>
    </div>
  );
}