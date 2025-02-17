import React, { useCallback, useMemo } from "react";
import { IDOProjectDatabaseData } from "../helper/types";
import Badge from "../../launchpad/project-card/badge";
import { useContractRead, erc20ABI } from "wagmi";
import { useNavigate } from "react-router";

export default function IDOPreviewCard({
  projectData,
}: {
  projectData: IDOProjectDatabaseData;
}) {
  const navigate = useNavigate();
  const progress = useMemo(() => {
    const sold = projectData?.totalSold;
    const total = projectData?.totalSale;

    if (!sold || !total) {
      return 0;
    }

    return (parseInt(sold) / parseInt(total)) * 100;
  }, [projectData]);

  const { data: vestingToken } = useContractRead({
    address: projectData?.vestingToken,
    abi: erc20ABI,
    functionName: "symbol",
    enabled: !!projectData?.vestingToken,
  });

  const { data: saleToken } = useContractRead({
    address: projectData?.saleToken,
    abi: erc20ABI,
    functionName: "symbol",
    enabled: !!projectData?.saleToken,
  });

  const status = useCallback(() => {
    const privateStartTime = projectData?.privateStartTime;
    const privateEndTime = projectData?.privateEndTime;
    const publicStartTime = projectData?.publicStartTime;
    const publicEndTime = projectData?.publicEndTime;

    if (
      !privateStartTime ||
      !privateEndTime ||
      !publicStartTime ||
      !publicEndTime
    ) {
      return "Upcoming";
    }

    if (new Date(privateStartTime).getTime() > Date.now()) {
      return "Upcoming";
    }

    if (
      new Date(privateStartTime).getTime() < Date.now() &&
      new Date(privateEndTime).getTime() > Date.now()
    ) {
      return "Private";
    }

    if (
      new Date(publicStartTime).getTime() < Date.now() &&
      new Date(publicEndTime).getTime() > Date.now()
    ) {
      return "Public";
    }

    if (new Date(publicEndTime).getTime() < Date.now()) {
      return "Closed";
    }

    return "Upcoming";
  }, []);

  return (
    <div
      className="
        relative
        bg-[#FFFFFF]/[.10] 
        border-box
        min-w-[313px] w-[313px]
        rounded-[9.37553px]
        px-[18.75px] pt-[35px] pb-[23px]
        font-sans
      "
    >
      <div className=" right-[19px] top-[20px] flex space-x-[8px]">
        <div className="w-max bg-[#5E6DEC] rounded-[50px] px-[8px] px-[8px] h-[20px]">
          <span className="text-white text-[12px] font-[500] relative top-[-3px] tracking-[-0.04em]">
            {status()}
          </span>
        </div>
      </div>

      <div className="flex space-x-[6.25px] mb-[24px]">
        <div>
          <img
            src={projectData?.logo ?? "/assets/svgs/jump.svg"}
            alt={projectData?.name ?? "Token"}
            className="w-[45px] h-[45px] rounded-full"
          />
        </div>

        <div>
          <div className="mb-[-4px]">
            <span className="text-white text-[16px] font-[700] tracking-[-0.04em]">
              {projectData?.name}
            </span>
          </div>

          <div>
            <span className="text-[13px] font-[600] text-white opacity-[0.5] leading-[6px] tracking-[-0.04em]">
              {shortAddress(projectData?.vestingToken)}
            </span>
          </div>
        </div>
      </div>
      <>
        <div className="mb-[24px]">
          <div>
            <span className="text-white text-[12px] tracking-[-0.04em] font-[700]">
              Total Sold Token
            </span>
          </div>

          <div className="mb-[16px]">
            <span className="text-[20px] font-[700] tracking-[-0.04em]">
              {(Number(projectData.totalSold) || 0).toFixed(2)}
            </span>
          </div>

          <div>
            <div className="mb-[6px] text-end">
              <span className="text-white font-[700] text-[16px] tracking-[-0.04em]">
                {progress.toFixed(3).replace(/\.?0+$/, "") + "%"}
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
                  width: progress + "%",
                }}
                className="
                  h-[6.25px]
                  rounded-[40px]
                  bg-[linear-gradient(90deg,_#AE00FF_0%,_#FF1100_100%)]
                "
              />
            </div>
          </div>
        </div>
        <div className="mb-[4px] flex space-x-[29px] items-center">
          <div className="w-[99px]">
            <span className="font-[700] text-[14px] tracking-[-0.04em]">
              Tokens for sale:
            </span>
          </div>

          <div className="truncate max-w-[145px] overflow-hidden">
            <span className="text-white font-[700] text-[15.6259px] tracking-[-0.04em]">
              {projectData?.totalSale} {vestingToken || "Token"}
            </span>
          </div>
        </div>
        <div className="flex space-x-[29px] items-center ">
          <div className="w-[99px]">
            <span className="font-[700] text-[14px] tracking-[-0.04em]">
              Private Price:
            </span>
          </div>

          <div>
            <span className="text-white font-[700] text-[15.6259px] tracking-[-0.04em]">
              {projectData.privatePrice} {saleToken}
            </span>
          </div>
        </div>
        <div className="flex space-x-[29px] items-center mb-[16px]">
          <div className="w-[99px]">
            <span className="font-[700] text-[14px] tracking-[-0.04em]">
              Public Price:
            </span>
          </div>

          <div>
            <span className="text-white font-[700] text-[15.6259px] tracking-[-0.04em]">
              {projectData.publicPrice} {saleToken}
            </span>
          </div>
        </div>
      </>
      <div className="flex justify-center">
        <button
          onClick={() => navigate("telos-testnet/projects/" + projectData?.id)}
          className="rounded-[8.5px] bg-[#6E3A85] py-[9px] px-[33px] hover:opacity-[.8]"
        >
          <span className="font-[700] text-[12px] relative top-[-2px]">
            Join project
          </span>
        </button>
      </div>
    </div>
  );
}

function shortAddress(address: string | undefined) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
