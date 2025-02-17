import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMemo } from "react";
import isEmpty from "lodash/isEmpty";
import { debounce } from "lodash-es";
import { twMerge } from "tailwind-merge";
import {
  FolderOpenIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import {
  useViewInvestor,
  useViewTotalEstimatedInvestorAllowance,
  useXTokenBalance,
  useSettings,
  useXJumpMetadata,
} from "@/hooks/modules/launchpad";
import {
  LaunchpadConenctionQueryVariables,
  useLaunchpadConenctionQuery,
  VisibilityEnum,
} from "@near/apollo";
import {
  Button,
  TopCard,
  LoadingIndicator,
  BackButton,
  ProjectCard,
} from "@/components";
import { useWalletSelector } from "@/context/wallet-selector";
import { MemberArea } from "@/components/modules/launchpad/home-member-area";
import { stepItemsProjects, stepItemsMemberArea } from "./projects.tutorial";
import { PAGINATE_LIMIT } from "./projects.config";
import { viewMethod } from "@/helper/near";
import { LAUNCHPAD } from "@/env/contract";

export const Projects = () => {
  const [baseTokenMetadata, setBaseTokenMetadata] = useState<any>();
  const [filterSearch, setSearch] = useState<string | null>(null);
  const [launchpadSettings, setlaunchpad] = useState<any>();
  const [loadingItems, setLoadingItems] = useState(false);
  const [filter, setFilter] = useState({});

  const { accountId, selector } = useWalletSelector();

  const navigate = useNavigate();

  // Blockchain Data:
  const xTokenBalance = useXTokenBalance(accountId!);
  const investor = useViewInvestor(accountId!);
  const [visibleProjects, setVisibleProjects] = useState<any>([]);

  const { data: totalAllowanceData = "0" } =
    useViewTotalEstimatedInvestorAllowance(accountId!);

  useEffect(() => {
    (async () => {
      const metadata = await useXJumpMetadata(selector);
      const settings = await useSettings(selector);

      setBaseTokenMetadata(metadata);
      setlaunchpad(settings);
    })();
  }, []);

  // Graphql Data:
  const queryVariables: LaunchpadConenctionQueryVariables = useMemo(() => {
    return {
      limit: PAGINATE_LIMIT,
      accountId: accountId ?? "",
      search: filterSearch,
      ...filter,
    };
  }, [accountId, filterSearch, filter]);

  const {
    data: {
      launchpad_projects: { data: launchpadProjects, hasNextPage = false } = {
        data: [],
      },
    } = {},
    loading: loadingProjects,
    fetchMore,
    refetch,
  } = useLaunchpadConenctionQuery({
    variables: {
      limit: PAGINATE_LIMIT,
      accountId: accountId ?? "",
    },
    notifyOnNetworkStatusChange: true,
  });
  const projectIds =
    launchpadProjects?.map((project) => project?.listing_id) || [];

  useEffect(() => {
    getVisibility();
    async function getVisibility() {
      if (isEmpty(projectIds) || !projectIds || !accountId) {
        return;
      }
      const totalAllowances = projectIds.map(async (projectId) => {
        const a = await viewMethod(LAUNCHPAD, "view_allowance_raw", {
          account_id: accountId,
          listing_id: projectId,
        });
        return a;
      });
      const returnTotalAllowances = await Promise.all(totalAllowances);
      const allowances = projectIds.map(async (projectId) => {
        const a = await viewMethod(LAUNCHPAD, "view_investor_allowance", {
          account_id: accountId,
          listing_id: projectId,
        });
        return a;
      });
      const returnAllowances = await Promise.all(allowances);

      const allocations = projectIds.map(async (projectId) => {
        const a = await viewMethod(LAUNCHPAD, "view_investor_allocation", {
          account_id: accountId,
          listing_id: projectId,
        });
        return a;
      });
      const returnAllocations = await Promise.all(allocations);

      const projectVisibility = returnAllowances.map((allowance, index) => {
        if (
          allowance !== "0" ||
          returnAllocations[index] !== null ||
          returnTotalAllowances[index] !== "0"
        ) {
          return true;
        }
        return false;
      });
      const visibleProjects = launchpadProjects?.filter((project, index) => {
        if (projectVisibility[index]) {
          return project;
        }
      });
      setVisibleProjects(visibleProjects);
    }
  }, [projectIds, accountId]);

  const refetchItems = (
    variables: Partial<LaunchpadConenctionQueryVariables> = {},
    search?: string
  ) => {
    setFilter(variables);
    setSearch(search || null);
    refetch({
      search,
      offset: 0,
      visibility: null,
      showMineOnly: false,
      ...variables,
    });
  };

  const fetchMoreItems = useCallback(
    debounce(async (queryVariables: LaunchpadConenctionQueryVariables) => {
      if (loadingProjects || !hasNextPage) {
        return;
      }

      setLoadingItems(true);

      await fetchMore({
        variables: {
          offset: (launchpadProjects ?? []).length,
          ...queryVariables,
        },
      });

      setLoadingItems(false);
    }, 240),
    [loadingItems, hasNextPage, loadingProjects, launchpadProjects]
  );

  return (
    <div className="p-[30px] w-full overflow-hidden pt-[150px] relative">
      <BackButton href="/">Jump Pad</BackButton>

      <div className="flex flex-col space-y-[24px] xl:space-y-[0px] xl:flex-row xl:space-x-[24px] mb-[86px] mt-[30px]">
        <TopCard
          gradientText=""
          maxW="max-w-[548px] xl:max-w-[none]"
          bigText="Boost your Jump Pad experience with xJUMP"
          bottomDescription="Get early access to the best NEAR projects before they hit the market,  and increase your allocation tier by using xJUMP "
          jumpLogo
          stepItems={stepItemsProjects}
        />

        <MemberArea
          isLoaded={true}
          investor={investor?.data!}
          totalAllowance={totalAllowanceData}
          launchpadSettings={launchpadSettings!}
          baseToken={{
            balance: xTokenBalance?.data!,
            metadata: baseTokenMetadata!,
          }}
          stepItems={stepItemsMemberArea}
        />
      </div>

      <div className="projects relative">
        <div className="flex items-center mb-[49px]">
          <div className="flex-grow space-x-[52px]">
            <button
              onClick={() => refetchItems({})}
              className={twMerge(
                "p-[10px] rounded-[10px] text-white",
                isEmpty(filter) && "bg-white text-[#431E5A]"
              )}
            >
              <span className="font-[700] text-[16px] tracking-[-0.04em]">
                All sales
              </span>
            </button>

            <button
              onClick={() =>
                refetchItems({ visibility: VisibilityEnum.Private })
              }
              className={twMerge(
                "p-[10px] rounded-[10px] text-white",
                Object.keys(filter).includes("visibility") &&
                  "bg-white text-[#431E5A]"
              )}
            >
              <span className="font-[700] text-[16px] tracking-[-0.04em]">
                Private sales
              </span>
            </button>

            <button
              className={twMerge(
                "p-[10px] rounded-[10px] text-white",
                Object.keys(filter).includes("showMineOnly") &&
                  "bg-white text-[#431E5A]"
              )}
              onClick={() => refetchItems({ showMineOnly: true })}
            >
              <span className="font-[700] text-[16px] tracking-[-0.04em]">
                My sales
              </span>
            </button>
          </div>

          <div>
            <div className="relative hidden log:block">
              <input
                placeholder="Search project"
                className="bg-[rgba(255,255,255,0.1)] px-[16px] py-[10px] rounded-[10px] text-[14px] font-[400] leading-[18px] text-white w-[355px] placeholder:text-[rgba(255,255,255,0.5)] placeholder:text-[14px] placeholder:font-[400]"
                onInput={(event) =>
                  refetchItems(
                    { ...filter },
                    (event.target as HTMLInputElement).value
                  )
                }
              />

              <MagnifyingGlassIcon
                className="
                  w-[18px] h-[18px] text-white
                  pointer-none opacity-[0.5]
                  absolute right-[12px] top-[calc(50%-9px)]
                "
              />
            </div>
          </div>
        </div>

        <div
          className="
								flex flex-wrap gap-3
          "
        >
          {!loadingProjects &&
            (launchpadProjects ?? [])
              .filter((project) => project?.public)
              .concat(visibleProjects)
              .map((project, index) => {
                return (
                  <ProjectCard
                    {...(project as any)}
                    key={"jumpad-projects-project-" + index}
                  />
                );
              })}
        </div>

        {!loadingProjects && isEmpty(launchpadProjects) && (
          <div className="flex items-center">
            <FolderOpenIcon className="h-[28px] text-white mr-[4px]" />
            No items here
          </div>
        )}

        {loadingProjects && !loadingItems && (
          <div className="flex items-center justify-center mt-[48px]">
            <div className="animate-spin h-[32px] w-[32px] border border-l-white rounded-full" />
          </div>
        )}

        {hasNextPage && (
          <div className="flex items-center justify-center mt-[48px]">
            <Button
              className="w-[168px]"
              onClick={() => fetchMoreItems(queryVariables)}
            >
              {loadingItems ? <LoadingIndicator /> : "Load more items"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
