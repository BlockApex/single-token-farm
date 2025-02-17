import { useMemo } from "react";
import { Badge } from "./project-card/badge";
import { StatusEnum } from "@near/apollo";
import isBefore from "date-fns/isBefore";
import { getUTCDate } from "@near/ts";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Tutorial, TutorialItemInterface } from "@/components";
import isEmpty from "lodash/isEmpty";
import { LaunchpadListing } from "@near/apollo";

const closedArray = [
  "sale_finalized",
  "pool_created",
  "pool_project_token_sent",
  "pool_price_token_sent",
  "liquidity_pool_finalized",
];

export function ProjectInfo({
  status,
  website,
  whitepaper,
  project_token_info,
  project_name,
  description_project,
  open_sale_1_timestamp,
  final_sale_2_timestamp,
  stepItems,
}: LaunchpadListing & { stepItems?: TutorialItemInterface[] }) {
  const openSale = useMemo(() => {
    return getUTCDate(Number(open_sale_1_timestamp));
  }, [open_sale_1_timestamp]);

  const finalSale = useMemo(() => {
    return getUTCDate(Number(final_sale_2_timestamp));
  }, [final_sale_2_timestamp]);

  const projectStatus = useMemo(() => {
    if (status !== "funded" && closedArray.includes(status!)) {
      return StatusEnum.Closed;
    }

    const now = getUTCDate();

    if (status === "funded" && isBefore(now, openSale)) {
      return StatusEnum.Waiting;
    }

    if (status === "funded" && isBefore(finalSale, now)) {
      return StatusEnum.Closed;
    }

    if (
      status === "funded" &&
      isBefore(openSale, now) &&
      isBefore(now, finalSale)
    ) {
      return StatusEnum.Open;
    }

    return StatusEnum.Open;
  }, [status, openSale, finalSale]);

  return (
    <div className="bg-[rgba(255,255,255,0.1)] p-[24px] rounded-[20px] relative mb-[24px] project-info">
      {!isEmpty(stepItems) && <Tutorial items={stepItems || []} />}

      <div className="absolute right-[52px] top-[20px] flex space-x-[8px]">
        <Badge type={projectStatus} />
      </div>

      <div className="flex items-center space-x-[9px] mb-[16px]">
        <div>
          <img
            src={project_token_info?.image ?? ""}
            className="w-[43px] h-[43px] rounded-full"
          />
        </div>

        <div>
          <div className="mb-[-4px]">
            <span
              className="text-white text-[24px] font-[800] tracking-[-0.04em]"
              children={project_name}
            />
          </div>

          <div>
            <span
              className="text-[20px] font-[600] text-white opacity-[0.5] leading-[6px] tracking-[-0.04em]"
              children={project_token_info?.name}
            />
          </div>
        </div>
      </div>

      <div className="mb-[24px] pl-[54px] max-w-[622px]">
        <span
          children={description_project}
          className="text-white text-[14px] font-[500]"
        />
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
