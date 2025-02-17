import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { IDOProjectDatabaseData } from "../helper/types";
import { useMantleIdoProjectCountQuery } from "@/hooks/modules/mantle/launchpad";
import IDOPreviewCard from "./PreviewCard.component";

export default function MantleLaunchpad() {
  const { projectCounts } = useMantleIdoProjectCountQuery() as {
    projectCounts: bigint | undefined;
  };

  const [projects, setProjects] = useState<IDOProjectDatabaseData[]>([]);

  useEffect(() => {
    fetchProjectDeatils();
    async function fetchProjectDeatils() {
      const res = await fetch(
        `https://jump-pg-prisma-api-production.up.railway.app/api/mantle-projects/`
      );
      const data = await res.json();
      setProjects(data);
    }
  }, []);
  return (
    <PageContainer>
      <div className=" flex flex-wrap gap-3">
        {projects &&
          projects.length > 0 &&
          projects.map((project, index) => {
            return (
              <IDOPreviewCard
                projectData={project}
                key={`${index}-mantle-preview`}
              />
            );
          })}
      </div>

      <hr />
    </PageContainer>
  );
}