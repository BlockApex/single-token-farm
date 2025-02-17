import React, { useMemo } from "react";
import { IDOProjectData } from "../helper/types";
import { convertSecondStringToDateTime } from "../helper/helper";
import { ethers, formatUnits } from "ethers";

export default function MantleProjectStats({
  projectData,
  saleTokenSymbol,
  vestingTokenSymbol,
  saleTokenDecimals,
  vestingTokenDecimals,
  saleTokenName,
  vestingTokenName,
}: {
  projectData: IDOProjectData;
  saleTokenSymbol: string | undefined;
  vestingTokenSymbol: string | undefined;
  saleTokenDecimals: number | undefined;
  vestingTokenDecimals: number | undefined;
  saleTokenName: string | undefined;
  vestingTokenName: string | undefined;
}) {
  const progress = useMemo(() => {
    const total = parseInt(
      formatUnits(
        projectData.totalSaleAmount as any,
        vestingTokenDecimals || 18
      )
    );
    const sold = parseInt(
      formatUnits(
        projectData.totalSoldAmount as any,
        vestingTokenDecimals || 18
      )
    );
    return (sold / total) * 100;
  }, [projectData.totalSoldAmount, projectData.totalSaleAmount]);

  const totalAllocation = useMemo(() => {
    const total = parseInt(
      formatUnits(
        projectData.totalSaleAmount as any,
        vestingTokenDecimals || 18
      )
    );
    const tokenPerAllocation = parseInt(
      formatUnits(
        projectData.tokenPerAllocation as any,
        vestingTokenDecimals || 18
      )
    );
    return total / tokenPerAllocation;
  }, [projectData.tokenPerAllocation, projectData.totalSaleAmount]);

  const remainingAllocation = useMemo(() => {
    const total = parseInt(
      formatUnits(
        projectData.totalSaleAmount as any,
        vestingTokenDecimals || 18
      )
    );
    const sold = parseInt(
      formatUnits(
        projectData.totalSoldAmount as any,
        vestingTokenDecimals || 18
      )
    );
    const tokenPerAllocation = parseInt(
      formatUnits(
        projectData.tokenPerAllocation as any,
        vestingTokenDecimals || 18
      )
    );
    return (total - sold) / tokenPerAllocation;
  }, [
    projectData.tokenPerAllocation,
    projectData.totalSaleAmount,
    projectData.totalSoldAmount,
  ]);

  const steps = useMemo(() => {
    return [
      <div
        className="bg-[rgba(252,252,252,0.2)] rounded-[20px] py-[36px] px-[23px] w-full ml-[36px]"
        key={`mantle-project-stats-step-1`}
      >
        <div>
          <span className="text-[12px] font-[700] tracking-[-0.04em] text-white">
            Total Sold Token
          </span>
        </div>

        <div className="mb-[27px] ">
          <span className="text-[24px] font-[700] tracking-[-0.04em]">
            {Number(ethers.formatEther(projectData.totalSoldAmount))
              .toFixed(3)
              .replace(
                //remove trailing zeros
                /\.?0+$/,
                ""
              )}{" "}
            {vestingTokenSymbol}
          </span>
        </div>

        <div>
          <div className="mb-[16px]">
            <span className="text-[14px] font-[700] tracking-[-0.04em] text-white">
              Total allocations bought
            </span>
          </div>

          <div
            className="
              flex-grow
              rounded-[40px]
              bg-white/[.38]
            "
          >
            <div
              style={{
                width: Math.max(0.3, progress) + "%",
              }}
              className="
                h-[10px]
                rounded-[40px]
                bg-[linear-gradient(90deg,_#AE00FF_0%,_#FF1100_100%)]
              "
            />
          </div>

          <div className="mt-[8px] text-end">
            <span className="text-white font-[700] text-[12px] tracking-[-0.04em]">
              {progress.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>,
      <div
        className="flex flex-col ml-[36px] w-full"
        key={`mantle-stat-status`}
      >
        <div className="mb-[32px]">
          <span className="font-[800] text-[16px] tracking-[-0.04em]">
            Status
          </span>
        </div>

        <div className="bg-[rgba(252,252,252,0.2)] rounded-[20px] py-[16px] px-[22px] w-full">
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Private Sale Start
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {convertSecondStringToDateTime(projectData.privateStartTime)}
            </span>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Private Sale End
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {convertSecondStringToDateTime(projectData.privateEndTime)}
            </span>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Start open sales
              </span>
            </div>

            <div>
              <span className="text-[16px] font-[800] tracking-[-0.04em]">
                {convertSecondStringToDateTime(projectData.publicStartTime)}
              </span>
            </div>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                End sale date
              </span>
            </div>

            <div>
              <span className="text-[16px] font-[800] tracking-[-0.04em]">
                {convertSecondStringToDateTime(projectData.publicEndTime)}
              </span>
            </div>
          </div>
        </div>
      </div>,
      <div
        className="flex flex-col ml-[36px] w-full"
        key={`mantle-stat-status`}
      >
        <div className="mb-[32px]">
          <span className="font-[800] text-[16px] tracking-[-0.04em]">
            Allocation
          </span>
        </div>

        <div className="bg-[rgba(252,252,252,0.2)] rounded-[20px] py-[16px] px-[22px] w-full">
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Total allocation available
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {totalAllocation}
            </span>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Remaining allocation
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {remainingAllocation}
            </span>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Token size per allocation
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {formatUnits(
                projectData.tokenPerAllocation as any,
                vestingTokenDecimals || 18
              )}{" "}
              {vestingTokenSymbol}
            </span>
          </div>
        </div>
      </div>,
      <div
        className="flex flex-col ml-[36px] w-full"
        key={`mantle-stat-status`}
      >
        <div className="mb-[32px]">
          <span className="font-[800] text-[16px] tracking-[-0.04em]">
            Token
          </span>
        </div>

        <div className="bg-[rgba(252,252,252,0.2)] rounded-[20px] py-[16px] px-[22px] w-full">
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Private Price per allocation
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {formatUnits(
                projectData.privateSalePrice as any,
                saleTokenDecimals || 18
              )}{" "}
              {saleTokenSymbol}
            </span>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Public Price per allocation
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {formatUnits(
                projectData.publicSalePrice as any,
                saleTokenDecimals || 18
              )}{" "}
              {saleTokenSymbol}
            </span>
          </div>
        </div>
      </div>,
      <div
        className="flex flex-col ml-[36px] w-full"
        key={`mantle-stat-status`}
      >
        <div className="mb-[32px]">
          <span className="font-[800] text-[16px] tracking-[-0.04em]">
            Vesting
          </span>
        </div>

        <div className="bg-[rgba(252,252,252,0.2)] rounded-[20px] py-[16px] px-[22px] w-full">
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Initial Allocation release
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {parseInt(projectData.initialReleasePercent) / 100}%
            </span>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Vesting Release
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {100 - parseInt(projectData.initialReleasePercent) / 100}%
            </span>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Vesting Start Date
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {convertSecondStringToDateTime(projectData.cliffStartTime)}
            </span>
          </div>
          <div className="mb-[8px]">
            <div>
              <span className="text-[14px] font-[600] tracking-[-0.04em]">
                Vesting End Date
              </span>
            </div>

            <span className="text-[16px] font-[800] tracking-[-0.04em]">
              {convertSecondStringToDateTime(projectData.cliffEndTime)}
            </span>
          </div>
        </div>
      </div>,
      "",
    ];
  }, []);

  return (
    <div>
      <ol role="list" className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li
            key={"project-step-item-" + stepIdx}
            className={classNames(
              stepIdx !== steps.length - 1 ? "pb-10" : "",
              "relative"
            )}
          >
            {stepIdx !== steps.length - 1 ? (
              <div className="absolute top-[0] left-[5px] -ml-px mt-0 h-full w-[2px] bg-[rgba(252,252,252,0.2)]" />
            ) : null}

            <div className="group relative flex items-start">
              <div className="flex items-start">
                <div className="relative z-10 flex h-[10px] w-[10px] items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
              </div>

              {step}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
