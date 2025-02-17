import { useEffect, useMemo, useState } from "react";
import { useLaunchPadProjectQuery } from "@near/apollo";
import { useNavigate, useParams } from "react-router";
import { BackButton } from "@/components/shared/back-button";
import { useWalletSelector } from "@/context/wallet-selector";
import {
  ProjectInfo,
  ProjectStats,
  ProjectInvestments,
  ProjectUserArea,
} from "@/components";
import {
  useViewVestedAllocations,
  useViewInvestorAllocation,
} from "@/hooks/modules/launchpad";
import { twMerge } from "tailwind-merge";
import { useTokenBalance } from "@/hooks/modules/token";
import { stepItemsProject } from "./projects.tutorial";
import PageContainer from "@/components/PageContainer";
import { viewMethod } from "@/helper/near";

export const Project = () => {
  const { id } = useParams();
  const { accountId } = useWalletSelector();
  const [investorAllowance, setInvestorAllowance] = useState("0");
  const [loadingAllowance, setLoadingAllowance] = useState(true);
  const navigate = useNavigate();

  const {
    data: { launchpad_project: launchpadProject } = {},
    loading: loadingLaunchpadProject,
  } = useLaunchPadProjectQuery({
    variables: {
      accountId: accountId ?? "",
      projectId: id ?? "",
    },
    skip: !id,
  });
  //TODO: This should be in hook
  useEffect(() => {
    (async () => {
      try {
        setLoadingAllowance(true);
        if (!accountId || !id) {
          setLoadingAllowance(false);
          return;
        }
        const a = await viewMethod(
          import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
          "view_allowance_raw",
          {
            account_id: accountId,
            listing_id: id,
          }
        );
        setInvestorAllowance(a);
      } catch (e) {
        console.log(e);
      } finally {
        setLoadingAllowance(false);
      }
    })();
  }, [accountId, id]);

  const { data: investorAllocation, loading: loadingAllocation } =
    useViewInvestorAllocation(accountId!, id!);

  const { data: vestedAllocations, loading: loadingVestedAllocations } =
    useViewVestedAllocations(accountId!, launchpadProject?.listing_id!);

  /*   const { data: investorAllowance, loading: loadingAllowance } =
    useViewInvestorAllowance(accountId!, launchpadProject?.listing_id!);
 */
  const { data: priceTokenBalance, loading: loadingPriceTokenBalance } =
    useTokenBalance(launchpadProject?.price_token, accountId!);

  const isLoading = useMemo(
    () =>
      loadingAllocation ||
      loadingAllowance ||
      loadingLaunchpadProject ||
      loadingPriceTokenBalance ||
      loadingVestedAllocations,
    [
      loadingAllowance,
      loadingAllocation,
      loadingLaunchpadProject,
      loadingPriceTokenBalance,
      loadingVestedAllocations,
    ]
  );

  const [tab, setTab] = useState("pool");

  return (
    <PageContainer>
      <BackButton href="/projects">All Projects</BackButton>

      {isLoading && (
        <div className="flex items-center justify-center pt-[72px]">
          <div className="animate-spin h-[32px] w-[32px] border border-l-white rounded-full" />
        </div>
      )}
      {!isLoading && (
        <div
          className="
            flex justify-center flex-col 
            space-y-[24px]
            xl:space-y-[0xp] xl:space-x-[24px] xl:flex-row
          "
        >
          <div className="xl:max-w-[748px] w-full">
            <ProjectInfo
              {...(launchpadProject as any)}
              stepItems={stepItemsProject}
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
                  disabled={!accountId}
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

              {tab === "pool" && (
                <ProjectStats {...(launchpadProject as any)} />
              )}

              {tab === "investiments" && (
                <ProjectInvestments
                  launchpadProject={launchpadProject!}
                  investorAllowance={investorAllowance!}
                  investorAllocation={investorAllocation!}
                  vestedAllocations={vestedAllocations!}
                />
              )}
            </div>
          </div>

          <ProjectUserArea
            priceTokenBalance={priceTokenBalance!}
            launchpadProject={launchpadProject!}
            investorAllowance={investorAllowance!}
            //@ts-ignore
            investorAllocation={investorAllocation!}
          />
        </div>
      )}
    </PageContainer>
  );
};

export default Project;
