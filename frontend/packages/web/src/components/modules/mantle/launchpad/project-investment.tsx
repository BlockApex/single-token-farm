import React, { useMemo } from "react";
import { IDOProjectData } from "../helper/types";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { MANTLE_LAUNCHPAD_CONTRACT } from "@/env/contract";
import launchpadAbi from "@/contracts/Launchpad.json";
import { use } from "echarts";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { RPC_URL } from "@/context/evm-context";
export default function MantleProjectInvestment({
  projectData,
  saleTokenSymbol,
  vestingTokenSymbol,
  saleTokenName,
  vestingTokenName,
}: {
  projectData: IDOProjectData;
  saleTokenSymbol: string | undefined;
  vestingTokenSymbol: string | undefined;
  saleTokenName: string | undefined;
  vestingTokenName: string | undefined;
}) {
  const { address } = useAccount();

  /**
   * [3n,750000000000000000000n,750000000000000000000n,1687744803n]
   */
  const { data: investmentData }: { data: Array<bigint> | undefined } =
    useContractRead({
      address: MANTLE_LAUNCHPAD_CONTRACT,
      abi: launchpadAbi.abi,
      functionName: "getProjectInvestor",
      args: [projectData.id, address],
      enabled: !!projectData.id && !!address,
    });

  const { writeAsync } = useContractWrite({
    address: MANTLE_LAUNCHPAD_CONTRACT,
    abi: launchpadAbi.abi,
    functionName: "claimVesting",
    args: [projectData.id],
  });

  const { data: releaseAmount }: { data: bigint | undefined } = useContractRead(
    {
      address: MANTLE_LAUNCHPAD_CONTRACT,
      abi: launchpadAbi.abi,
      functionName: "getReleasedAmount",
      args: [projectData.id, address],
      enabled: !!projectData.id && !!address,
    }
  );

  const parsedInvestmentData = useMemo(() => {
    if (!investmentData) return;
    const [
      allowanceAmount,
      investedAmount,
      reminingVestingAmount,
      lastClaimTime,
    ] = investmentData;
    return {
      allowanceAmount: allowanceAmount.toString(),
      investedAmount: ethers.formatEther(investedAmount),
      reminingVestingAmount: ethers.formatEther(reminingVestingAmount),
      lastClaimTime: ethers.formatEther(lastClaimTime),
    };
  }, [investmentData]);

  const parsedReleaseAmount = useMemo(() => {
    if (!releaseAmount) return "N/A";
    return ethers.formatEther(releaseAmount);
  }, [releaseAmount]);
  async function claimVesting() {
    if (!projectData.id) {
      toast.error("Invalid project id");
    }
    if (!address) {
      toast.error("Please connect your wallet");
    }

    if (!writeAsync) {
      toast.error("Something went wrong");
    }

    try {
      const tx = await writeAsync();
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      toast.promise(provider.waitForTransaction(tx.hash), {
        loading: "Waiting for transaction to confirm",
        success: "Transaction confirmed",
        error: "Transaction failed",
      });

      window.location.reload();
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  return (
    <div>
      <div className="flex space-x-[67px] mb-[32px]">
        <div>
          <div>
            <span className="text-[14px] font-[600] tracking-[-0.03em]">
              Total token amount
            </span>
          </div>

          <div>
            <span className="font-[800] text-[24px] tracking-[-0.03em] text-[#E2E8F0]">
              {parsedInvestmentData?.investedAmount}
            </span>
          </div>
        </div>

        <div>
          <div>
            <span className="text-[14px] font-[600] tracking-[-0.03em]">
              Claimed Amount
            </span>
          </div>

          <div>
            <span className="font-[800] text-[24px] tracking-[-0.03em] text-[#E2E8F0]">
              {parseFloat(parsedInvestmentData?.investedAmount || "0") -
                parseFloat(parsedInvestmentData?.reminingVestingAmount || "0")}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[rgba(252,252,252,0.2)] rounded-[20px] pl-[25px] pr-[33px] py-[16px] flex space-between items-center">
        <div className="flex flex-1 space-x-[32px]">
          <div>
            <div>
              <span className="font-[600] text-[14px] tracking-[-0.03em]">
                Remaining amount
              </span>
            </div>

            <div>
              <span className="font-[800] text-[24px] tracking-[-0.03em]">
                {parsedInvestmentData?.reminingVestingAmount}
              </span>
            </div>
          </div>

          <div>
            <div>
              <span className="font-[600] text-[14px] tracking-[-0.03em]">
                Released Amount
              </span>
            </div>

            <div>
              <span className="font-[800] text-[24px] tracking-[-0.03em]">
                {parsedReleaseAmount}
              </span>
            </div>
            <div>
              <span className="font-[600] text-[14px] tracking-[-0.03em] text-[rgba(255,255,255,0.75)]">
                Available to claim
              </span>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={claimVesting}
            className="py-[16px] px-[32px] rounded-[10px] bg-white disabled:opacity-[0.5] disabled:cursor-not-allowed"
          >
            <span className="font-[600] text-[14px] tracking-[-0.04em] text-[#431E5A]">
              Withdraw
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}