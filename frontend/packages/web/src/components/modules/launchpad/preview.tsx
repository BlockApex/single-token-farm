import isEmpty from "lodash/isEmpty";
import { useNavigate } from "react-router";
import { ProjectCard } from "@/components";
import { FolderOpenIcon } from "@heroicons/react/24/outline";
import { useWalletSelector } from "@/context/wallet-selector";
import { StatusEnum, useLaunchpadConenctionQuery } from "@near/apollo";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useViewInvestorAllowance } from "@/hooks/modules/launchpad";
import { viewMethod } from "@/helper/near";
import { LAUNCHPAD } from "@/env/contract";

export const PreviewProjects = ({
  title,
  status,
}: {
  title: string;
  status: StatusEnum;
}) => {
  const navigate = useNavigate();

  const { accountId } = useWalletSelector();
  const [visibleProjects, setVisibleProjects] = useState<any>([]);
  const {
    data: { launchpad_projects: { data: projects } = { data: [] } } = {},
    loading,
  } = useLaunchpadConenctionQuery({
    variables: {
      status,
      limit: 4,
      offset: 0,
      accountId: accountId ?? "",
    },
    skip: !status,
    fetchPolicy: "no-cache",
  });
  const projectIds = projects?.map((project) => project?.listing_id);

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
      const visibleProjects = projects?.filter((project, index) => {
        if (projectVisibility[index]) {
          return project;
        }
      });

      setVisibleProjects(visibleProjects);
    }
  }, [projectIds, accountId, projects]);

  return (
    <div className="mb-[48px] w-full">
      <div className="flex justify-between items-center mb-[56px]">
        <div>
          <span className="font-inter text-white text-[20px] font-[700]">
            {title}
          </span>
        </div>

        <div>
          <button
            onClick={() => navigate("/projects")}
            className="bg-[#6E3A85] px-[33px] py-[10px] rounded-[9.5px] hover:opacity-[.8]"
          >
            <span className="text-white text-[13px] font-[700]">
              View all sales
            </span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-start h-[80px]">
          <div className="animate-spin h-[32px] w-[32px] border border-l-white rounded-full" />
        </div>
      )}

      {isEmpty(projects) && !loading && (
        <div className="flex items-center">
          <FolderOpenIcon className="h-[28px] text-white mr-[4px]" />
          No items here
        </div>
      )}

      <div className="flex space-x-[18px] justify-left w-[1500px] max-w-full overflow-auto">
        {!isEmpty(projects) &&
          !loading &&
          projects?.map((project, i) => (
            <ProjectCard
              {...(project as any)}
              key={"launchpad-preview-" + title + "-" + i}
            />
          ))}
        {!isEmpty(visibleProjects) &&
          !loading &&
          visibleProjects.map((project, i) => {
            return (
              <ProjectCard
                {...(project as any)}
                key={"launchpad-preview-" + title + "-" + i}
              />
            );
          })}
      </div>
    </div>
  );
};
