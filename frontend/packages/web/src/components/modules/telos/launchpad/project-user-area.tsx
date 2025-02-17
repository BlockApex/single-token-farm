import { Button } from "@/components/shared";
import Big from "big.js";
import React, { useCallback, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { IDOProjectData } from "../helper/types";
import { ethers, formatEther } from "ethers";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { NumberInput } from "@/components";
import { erc20ABI } from "wagmi";
import launchPadAbi from "@/contracts/Launchpad.json";
import { toast } from "react-hot-toast";
import { TELOS_LAUNCHPAD_CONTRACT } from "@/env/contract";
import useERCToken from "@/hooks/modules/mantle/launchpad/useERCToken";

export enum MantleStatusEnum {
  Upcoming = "Upcoming",
  Private = "Private Sale",
  Public = "Public Sale",
  Closed = "Closed",
}

export default function MantleUserArea({
  projectData,
  saleTokenSymbol,
}: {
  projectData: IDOProjectData;
  saleTokenSymbol: string;
}) {
  const { address } = useAccount();
  const { balance } = useERCToken(projectData.saleToken);
  const [amount, setAmount] = useState(0);
  const [totalPriceInSaleToken, setTotalPriceInSaleToken] = useState<bigint>(
    BigInt(0)
  );

  const { config: approveConfig } = usePrepareContractWrite({
    address: projectData.saleToken,
    abi: erc20ABI,
    functionName: "approve",
    args: [TELOS_LAUNCHPAD_CONTRACT!, totalPriceInSaleToken],
  });

  const { writeAsync: approveWrite, data: approveWriteData } =
    useContractWrite(approveConfig);

  const { data: approved } = useWaitForTransaction({
    hash: approveWriteData?.hash,
  });

  const { config: investConfig } = usePrepareContractWrite({
    address: TELOS_LAUNCHPAD_CONTRACT!,
    abi: launchPadAbi.abi,
    functionName: "invest",
    args: [projectData.id, amount],
    enabled:
      !!amount && !!projectData.id && !!address && approved !== undefined,
  });

  const {
    writeAsync: investWrite,
    data: investWriteData,
    error: investWriteError,
  } = useContractWrite(investConfig);

  const { data: invested } = useWaitForTransaction({
    hash: investWriteData?.hash,
  });

  useEffect(() => {
    invested && window.location.reload();
  }, [invested]);

  useEffect(() => {
    if (!approved) return;
    if (investWriteError) {
      toast.error(investWriteError.message);
      return;
    }
    if (!investWrite) {
      toast.error("Invest Transaction Preflight Failed, please try again");
      return;
    }
    investWrite();
  }, [investWrite, investWriteError]);

  async function handleInvest() {
    if (!approved) {
      if (!approveWrite) {
        toast.error("Something went wrong, please try again later");
      } else {
        const tx = await approveWrite();
        try {
          await fetch(
            "https://jump-pg-prisma-api-production.up.railway.app/api/telos-testnet-projects/" +
              projectData.id
          );
        } catch (e) {
          //
        }
        if (tx) {
          //
        }
      }
    }
  }

  const status = useCallback(() => {
    if (parseInt(projectData.privateStartTime) * 1000 > Date.now()) {
      return MantleStatusEnum.Upcoming;
    }

    if (
      parseInt(projectData.privateStartTime) * 1000 < Date.now() &&
      parseInt(projectData.privateEndTime) * 1000 > Date.now()
    ) {
      return MantleStatusEnum.Private;
    }

    if (
      parseInt(projectData.publicStartTime) * 1000 < Date.now() &&
      parseInt(projectData.publicEndTime) * 1000 > Date.now()
    ) {
      return MantleStatusEnum.Public;
    }

    if (parseInt(projectData.publicEndTime) * 1000 < Date.now()) {
      return MantleStatusEnum.Closed;
    }
  }, [projectData]);

  const currentPrice = useCallback(() => {
    switch (status()) {
      case MantleStatusEnum.Upcoming:
        return "0";
      case MantleStatusEnum.Private:
        return ethers
          .formatEther(projectData.privateSalePrice)
          .toString()
          .replace(/\.?0+$/, "");
      case MantleStatusEnum.Public:
        return ethers
          .formatEther(projectData.publicSalePrice)
          .toString()
          .replace(/\.?0+$/, "");
      case MantleStatusEnum.Closed:
        return "0";
    }
  }, [projectData, status]);

  const remainingAllocation = useCallback(() => {
    const total = parseInt(formatEther(projectData.totalSaleAmount as any));
    const sold = parseInt(formatEther(projectData.totalSoldAmount as any));
    const tokenPerAllocation = parseInt(
      formatEther(projectData.tokenPerAllocation as any)
    );
    return (total - sold) / tokenPerAllocation;
  }, [
    projectData.tokenPerAllocation,
    projectData.totalSaleAmount,
    projectData.totalSoldAmount,
  ])();

  const { data: privateInvestAllowAmount } = useContractRead({
    address: TELOS_LAUNCHPAD_CONTRACT!,
    abi: launchPadAbi.abi,
    functionName: "getAllocationAmount",
    args: [projectData.id, address],
    enabled: !!address && !!projectData.id,
  }) as {
    data: bigint | undefined;
  };

  return (
    <div className="investment relative bg-[rgba(255,255,255,0.1)] rounded-[20px] py-[24px] pb-[64px] px-[64px] flex-1 flex flex-col items-center h-max mb-[8px] max-w-[548px]">
      <div
        className={twMerge(
          " text-sm font-bold px-[24px] py-[8px] rounded-[50px] bg-[#559C71] w-max flex space-x-[10px] mb-[40px]"
        )}
      >
        Status: {status()}
      </div>
      <div className="bg-[rgba(252,252,252,0.2)] pl-[25px] pr-[19px] py-[18px] rounded-[20px] w-full mb-[8px]">
        <div className="">
          <span className="font-[600] text-[14px] tracking-[-0.03em]">
            Your Private Sale Allocation:{" "}
            {privateInvestAllowAmount?.toString() || 0}
          </span>
        </div>
      </div>
      <div className="bg-[rgba(252,252,252,0.2)] pl-[25px] pr-[19px] py-[18px] rounded-[20px] w-full flex justify-between items-center mb-[16px]">
        <div>
          <div className="mb-[23px]">
            <NumberInput
              min={0}
              value={amount}
              max={
                status() === MantleStatusEnum.Private
                  ? parseInt(privateInvestAllowAmount?.toString() || "0")
                  : status() === MantleStatusEnum.Public
                  ? remainingAllocation
                  : 0
              }
              onChange={(value) => {
                if (isNaN(value)) return setAmount(0);

                setAmount(value);
                setTotalPriceInSaleToken(
                  ethers.parseEther(
                    Big(value)
                      .times(currentPrice() || "0")
                      .toString()
                  )
                );
              }}
            />
          </div>
          <div className="mb-[8px]">
            <span className="font-[600] text-[14px] tracking-[-0.03em]">
              {currentPrice() ||
                "0".replace(
                  //remove trailing zeros
                  /\.?0+$/,
                  ""
                )}{" "}
              {saleTokenSymbol} per allocation
            </span>
          </div>
        </div>
      </div>

      <Button className="w-full" disabled={amount == 0} onClick={handleInvest}>
        {amount > 0 ? (
          <div>
            <span className="font-[600] text-[14px] tracking-[-0.03em]">
              Join Project For{" "}
              {amount > 0
                ? Big(currentPrice() || "0")
                    .times(amount)
                    .toString()
                : 0}{" "}
              {saleTokenSymbol}
            </span>
          </div>
        ) : (
          <div>
            <span className="font-[600] text-[14px] tracking-[-0.03em]">
              Join Project
            </span>{" "}
          </div>
        )}
      </Button>
      <p className=" mt-6 text-gray-300 text-sm mb-3">
        {saleTokenSymbol} Balance : {ethers.formatUnits(balance)}
      </p>
    </div>
  );
}
