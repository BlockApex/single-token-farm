import { Tutorial, TutorialItemInterface } from "@/components/shared";
import React from "react";
import isEmpty from "lodash/isEmpty";
import { StatusEnum } from "@near/apollo";
import Badge from "../../launchpad/project-card/badge";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { MantleStatusEnum } from "./project-user-area";

export default function MantleProjectInfo({
  projectName,
  projectSubTitle,
  projectDescription,
  projectStatus,
  website,
  image,
  whitepaper,
  stepItems,
}: {
  projectName: string;
  projectSubTitle: string;
  projectDescription: string;
  projectStatus: StatusEnum | MantleStatusEnum;
  image?: string;
  website?: string;
  whitepaper?: string;
  stepItems?: TutorialItemInterface[];
}) {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] p-[24px] rounded-[20px] relative mb-[24px] project-info">
      {!isEmpty(stepItems) && <Tutorial items={stepItems || []} />}

      <div className="absolute right-[52px] top-[20px] flex space-x-[8px]">
        <Badge type={projectStatus} />
      </div>

      <div className="flex items-center space-x-[9px] mb-[16px]">
        <div>
          <img
            src={image || "/assets/svgs/jump.svg"}
            className="w-[43px] h-[43px] rounded-full"
          />
        </div>

        <div>
          <div className="mb-[-4px]">
            <span className="text-white text-[24px] font-[800] tracking-[-0.04em]">
              {projectName}
            </span>
          </div>

          <div>
            <span className="text-[20px] font-[600] text-white opacity-[0.5] leading-[6px] tracking-[-0.04em]">
              {projectSubTitle}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-[24px] pl-[54px] max-w-[622px]">
        <span className="text-white text-[14px] font-[500]">
          {projectDescription}
        </span>
      </div>

      <div className="flex justify-between pl-[54px]">
        <div className="flex space-x-[16px]">
          <div>
            <button
              disabled={!!!website}
              className="border border-[rgba(252,252,252,0.2)] py-[10px] px-[16px] rounded-[10px] flex items-center space-x-[4px] disabled:cursor-not-allowed hover:opacity-[0.8]"
              onClick={() => {
                window.open(website!, "_blank");
              }}
            >
              <span className="font-[500] text-[14px] tracking-[-0.04em]">
                Website
              </span>

              <ArrowTopRightOnSquareIcon className="w-[14px] h-[14px] text-white" />
            </button>
          </div>

          <div>
            <button
              disabled={!!!whitepaper}
              className="border border-[rgba(252,252,252,0.2)] py-[10px] px-[16px] rounded-[10px] flex items-center space-x-[4px] disabled:cursor-not-allowed hover:opacity-[0.8]"
              onClick={() => {
                window.open(whitepaper!, "_blank");
              }}
            >
              <span className="font-[500] text-[14px] tracking-[-0.04em]">
                Whitepaper
              </span>

              <ArrowTopRightOnSquareIcon className="w-[14px] h-[14px] text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
