import PageContainer from "@/components/PageContainer";
import { parseRawIDOData } from "@/components/modules/mantle/helper/helper";
import MantleProjectInfo from "@/components/modules/mantle/launchpad/project-info";
import MantleProjectInvestment from "@/components/modules/mantle/launchpad/project-investment";
import MantleProjectStats from "@/components/modules/mantle/launchpad/project-stats";
import MantleUserArea, {
  MantleStatusEnum,
} from "@/components/modules/mantle/launchpad/project-user-area";
import {
  useERC20Metadata,
  useMantleIdoProjectQuery,
} from "@/hooks/modules/mantle/launchpad";
import { Spinner } from "@chakra-ui/react";
import { StatusEnum } from "@near/apollo";
import { parse } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { twMerge } from "tailwind-merge";
import { useAccount } from "wagmi";

export default function Project() {
  const { id } = useParams();
  const { address } = useAccount();
  const [tab, setTab] = useState("pool");

  const [projectDeatils, setProjectDetails] = useState({
    id: "",
    name: "",
    description: "",
    logo: null,
    website: null,
    whitepaper: null,
  });
  const { project, isLoading, isError, isFetching, isRefetching } =
    useMantleIdoProjectQuery(id || "");

  const parsedProject = parseRawIDOData(project);
  const status = useCallback(() => {
    if (!parsedProject) return MantleStatusEnum.Upcoming;
    if (parseInt(parsedProject.privateStartTime) * 1000 > Date.now()) {
      return MantleStatusEnum.Upcoming;
    }

    if (
      parseInt(parsedProject.privateStartTime) * 1000 < Date.now() &&
      parseInt(parsedProject.privateEndTime) * 1000 > Date.now()
    ) {
      return MantleStatusEnum.Private;
    }

    if (
      parseInt(parsedProject.publicStartTime) * 1000 < Date.now() &&
      parseInt(parsedProject.publicEndTime) * 1000 > Date.now()
    ) {
      return MantleStatusEnum.Public;
    }

    if (parseInt(parsedProject.publicEndTime) * 1000 < Date.now()) {
      return MantleStatusEnum.Closed;
    }
  }, [parsedProject]);
  useEffect(() => {
    if (!parsedProject) return;
    const id = parsedProject.id;
    if (!id) return;
    fetchProjectDeatils(id);
    async function fetchProjectDeatils(id) {
      const res = await fetch(
        `https://jump-pg-prisma-api-production.up.railway.app/api/mantle-projects/${id}`
      );
      const data = await res.json();
      setProjectDetails(data);
    }
  }, [parsedProject?.id]);
  const {
    name: saleTokenName,
    symbol: saleTokenSymbol,
    decimals: saleTokenDecimals,
  } = useERC20Metadata(parsedProject?.saleToken || "");

  const {
    name: vestingTokenName,
    symbol: vestingTokenSymbol,
    decimals: vestingTokenDecimals,
  } = useERC20Metadata(parsedProject?.vestingToken || "");

  if (parsedProject?.id == "0")
    return <PageContainer>Project not found</PageContainer>;

  if (isFetching || isRefetching)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-screen">
          <Spinner thickness="4px" width={128} height={128} />
        </div>
      </PageContainer>
    );

  return (
    <PageContainer>
      <div className=" flex justify-center flex-col  space-y-[24px] xl:space-y-[0xp] xl:space-x-[24px] xl:flex-row ">
        <div className="xl:max-w-[748px] w-full">
          <MantleProjectInfo
            projectName={projectDeatils?.name}
            projectDescription={projectDeatils?.description}
            image={projectDeatils?.logo || ""}
            projectStatus={status() || MantleStatusEnum.Upcoming}
            projectSubTitle={parsedProject?.vestingToken}
            website={projectDeatils?.website || ""}
            whitepaper={projectDeatils?.whitepaper || ""}
          />

          <div className="bg-[rgba(255,255,255,0.1)] p-[24px] rounded-[20px] w-full relative details">
            <div className="flex-grow space-x-[24px] mb-[67px]">
              <button
                onClick={() => setTab("pool")}
                className={twMerge(
                  "py-[10px] px-[24px] rounded-[10px] text-white border border-[rgba(255,255,255,0.1)]",
                  tab === "pool" && "bg-white text-[#431E5A] border-white"
                )}
              >
                <span className="font-[700] text-[16px] tracking-[-0.04em]">
                  Pool details
                </span>
              </button>

              <button
                onClick={() => setTab("investiments")}
                disabled={!address}
                className={twMerge(
                  "py-[10px] px-[24px] rounded-[10px] text-white border border-[rgba(255,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-[0.5]",
                  tab === "investiments" &&
                  "bg-white text-[#431E5A] border-white"
                )}
              >
                <span className="font-[700] text-[16px] tracking-[-0.04em]">
                  My investments
                </span>
              </button>
            </div>

            {tab === "pool" && parsedProject && (
              <MantleProjectStats
                projectData={parsedProject}
                saleTokenSymbol={saleTokenSymbol}
                vestingTokenSymbol={vestingTokenSymbol}
                saleTokenName={saleTokenName}
                vestingTokenName={vestingTokenName}
              />
            )}

            {tab === "investiments" && parsedProject && (
              <MantleProjectInvestment
                projectData={parsedProject}
                saleTokenSymbol={saleTokenSymbol}
                vestingTokenSymbol={vestingTokenSymbol}
                saleTokenName={saleTokenName}
                vestingTokenName={vestingTokenName}
              />
            )}
          </div>
        </div>
        {parsedProject && (
          <MantleUserArea
            projectData={parsedProject}
            saleTokenSymbol={saleTokenSymbol || ""}
          />
        )}
      </div>
    </PageContainer>
  );
}