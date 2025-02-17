/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable react/no-children-prop */
import Big from "big.js";
import { useMemo, useCallback } from "react";
import { isBefore } from "date-fns";
import { useWalletSelector } from "@/context/wallet-selector";
import { useLaunchpadStore } from "@/stores/launchpad-store";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { getUTCDate } from "@near/ts";
import format from "date-fns/format";
import { StatusEnum } from "@near/apollo";

import { NumberInput } from "@/components";
import { LaunchpadListing } from "@near/apollo";
import {
  useViewInvestorAllocation,
  useViewInvestorAllowance,
} from "@/hooks/modules/launchpad";

const formatConfig = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};

const closedArray = [
  "sale_finalized",
  "pool_created",
  "pool_project_token_sent",
  "pool_price_token_sent",
  "liquidity_pool_finalized",
];
enum SaleStatusEnum {
  "INACTIVE" = "INACTIVE",
  "NOT_STARTED" = "NOT_STARTED",
  "OPEN_SALE_1" = "OPEN_SALE_1",
  "OPEN_SALE_2" = "OPEN_SALE_2",
  "FINAL_SALE" = "FINAL_SALE",
  "SALE_FINALIZED" = "SALE_FINALIZED",
}
export function ProjectUserArea({
  launchpadProject: {
    status: projectStatus,
    listing_id,
    price_token,
    project_token,
    public: isPublic,
    price_token_info,

    token_allocation_price,
    open_sale_1_timestamp,
    open_sale_2_timestamp,
    final_sale_2_timestamp,
  },
  priceTokenBalance,
  investorAllowance,
  investorAllocation,
}: {
  investorAllowance: string;
  priceTokenBalance: string;
  launchpadProject: LaunchpadListing;
  investorAllocation: string;
}) {
  const { accountId, selector } = useWalletSelector();
  const { buyTickets } = useLaunchpadStore();
  const [tickets, setTickets] = useState(0);
  const onJoinProject = useCallback(
    async (amount: number) => {
      if (typeof listing_id && price_token) {
        buyTickets(
          new Big(amount).mul(new Big(token_allocation_price || 0)).toString(),
          price_token,
          listing_id,
          accountId!,
          selector
        );
      }
    },
    [1, accountId, project_token, token_allocation_price]
  );

  const ticketsAmount = useMemo(() => {
    return new Big(token_allocation_price! ?? 0).mul(
      new Big(tickets.toString())
    );
  }, [tickets, token_allocation_price]);

  const hasTicketsAmount = useMemo(() => {
    return new Big(priceTokenBalance ?? "0").gte(ticketsAmount);
  }, [ticketsAmount, priceTokenBalance]);

  const decimals = useMemo(() => {
    if (!price_token_info?.decimals) {
      return new Big(1);
    }

    return new Big(10).pow(Number(price_token_info?.decimals));
  }, [price_token_info]);

  const balance = useMemo(() => {
    return new Big(priceTokenBalance ?? 0).div(decimals).toFixed(2);
  }, [priceTokenBalance, decimals]);

  const total = useMemo(() => {
    return ticketsAmount.div(decimals);
  }, [ticketsAmount, decimals]);

  const ticketPrice = useMemo(() => {
    return new Big(token_allocation_price || 0);
  }, [token_allocation_price]);

  const formatNumber = (value, decimals, config: any = formatConfig) => {
    const decimalsBig = new Big(10).pow(Number(decimals) || 1);

    const formattedBig = new Big(value ?? 0).div(decimalsBig).toFixed(12);

    return new Intl.NumberFormat("en-US", config).format(Number(formattedBig));
  };

  const formatDate = (date: Date) => format(date, "MM/dd/yyyy HH:mm", {});

  const openSale = useMemo(() => {
    return getUTCDate(Number(open_sale_1_timestamp));
  }, [open_sale_1_timestamp]);
  const openSale2 = useMemo(() => {
    return getUTCDate(Number(open_sale_2_timestamp));
  }, [open_sale_2_timestamp]);
  const finalSale = useMemo(() => {
    return getUTCDate(Number(final_sale_2_timestamp));
  }, [final_sale_2_timestamp]);

  //=========================================================
  const allocationsAvailable = useMemo(() => {
    return Number(investorAllowance || 0) || 0;
  }, [investorAllowance]);

  //=========================================================

  const sale_status = useMemo(() => {
    if (projectStatus !== "funded" && closedArray.includes(projectStatus!)) {
      return SaleStatusEnum.INACTIVE;
    }
    const now = getUTCDate();
    if (projectStatus === "funded" && openSale > now) {
      return SaleStatusEnum.NOT_STARTED;
    }

    if (projectStatus === "funded" && now > openSale && now < openSale2) {
      return SaleStatusEnum.OPEN_SALE_1;
    }

    if (projectStatus === "funded" && now > openSale2 && now < finalSale) {
      return SaleStatusEnum.OPEN_SALE_2;
    }

    if (projectStatus === "funded" && now > finalSale) {
      return SaleStatusEnum.FINAL_SALE;
    }

    return SaleStatusEnum.SALE_FINALIZED;
  }, [projectStatus, openSale, finalSale, openSale2]);

  const status = useMemo(() => {
    if (projectStatus !== "funded" && closedArray.includes(projectStatus!)) {
      return {
        bg: "bg-[#CE2828]",
        status: StatusEnum.Closed,
        label: `Sales closed at: ${"a"} GMT`,
      };
    }

    const now = getUTCDate();

    if (projectStatus === "funded" && isBefore(now, openSale)) {
      return {
        bg: "bg-[#5E6DEC]",
        status: StatusEnum.Waiting,
        label: "Sales start(GMT): ",
        value: formatDate(openSale),
      };
    }

    if (projectStatus === "funded" && isBefore(finalSale, now)) {
      return {
        bg: "bg-[#CE2828]",
        status: StatusEnum.Closed,
        label: "Sales closed at(GMT):",
        value: formatDate(finalSale),
      };
    }

    if (sale_status === SaleStatusEnum.OPEN_SALE_1) {
      return {
        bg: "bg-[#559C71]",
        status: StatusEnum.Open,
        label: "Open sales Phase 1 ends at(GMT):",
        value: formatDate(openSale2),
      };
    }

    if (sale_status === SaleStatusEnum.OPEN_SALE_2) {
      return {
        bg: "bg-[#559C71]",
        status: StatusEnum.Open,
        label: "Open sales Phase 2 ends at(GMT):",
        value: formatDate(finalSale),
      };
    }

    return {
      bg: "bg-[#559C71]",
      status: StatusEnum.Open,
      label: "Sales ends at(GMT):",
      value: formatDate(finalSale),
    };
  }, [projectStatus, openSale, finalSale]);
  return (
    <div className="investment relative bg-[rgba(255,255,255,0.1)] rounded-[20px] py-[24px] pb-[64px] px-[64px] flex-1 flex flex-col items-center h-max mb-[8px] max-w-[548px]">
      <div
        className={twMerge(
          "px-[24px] py-[8px] rounded-[50px] bg-[#559C71] w-max flex space-x-[10px] mb-[40px]",
          status.bg
        )}
      >
        <span
          className="tracking-[-0.04em] font-[500] text-[16px]"
          children={status.label}
        />

        <span
          className="font-[800] text-[16px] tracking-[-0.04em]"
          children={status.value}
        />
      </div>
      <div className="bg-[rgba(252,252,252,0.2)] pl-[25px] pr-[19px] py-[18px] rounded-[20px] w-full mb-[8px]">
        <div className="mb-[16px]">
          <span className="font-[600] text-[14px] tracking-[-0.03em]">
            Allocation amount
          </span>
        </div>

        <div className="mb-[23px]">
          <NumberInput
            min={0}
            value={tickets}
            max={1000000000}
            /*   max={
              isPublic
                ? 1000000000000
                : sale_status == SaleStatusEnum.OPEN_SALE_1
                ? parseInt(allocationsAvailable.toString())
                : sale_status == SaleStatusEnum.OPEN_SALE_2
                ? parseInt(allocationsAvailable.toString())
                : 1000000000000
            } */
            onChange={(value) => {
              setTickets(value || 0);
            }}
          />
        </div>

        <div>
          <span
            children={`Your allocation balance: ${
              isPublic
                ? "Public"
                : sale_status == SaleStatusEnum.NOT_STARTED
                ? "SALE NOT STARTED"
                : sale_status == SaleStatusEnum.OPEN_SALE_2
                ? allocationsAvailable -
                  //@ts-ignore
                  (investorAllocation.allocationsBought || 0)
                : //@ts-ignore
                  allocationsAvailable -
                  //@ts-ignore
                  (investorAllocation.allocationsBought || 0)
            }`}
            className="text-[14px] font-[600] tracking-[-0.03em] text-[rgba(255,255,255,0.75)]"
          />
        </div>
      </div>
      <div className="bg-[rgba(252,252,252,0.2)] pl-[25px] pr-[19px] py-[18px] rounded-[20px] w-full flex justify-between items-center mb-[16px]">
        <div>
          <div className="mb-[8px]">
            <span className="font-[600] text-[14px] tracking-[-0.03em]">
              Price
            </span>
          </div>

          <div className="mb-[8px]">
            <span
              children={`${formatNumber(
                token_allocation_price,
                price_token_info?.decimals,
                {
                  minimumFractionDigits: 0,
                }
              )} ${price_token_info?.symbol}`}
              className="font-[800] text-[24px] tracking-[-0.03em] text-[#E2E8F0]"
            />
          </div>

          <div>
            <span
              children={`Your balance: ${balance} ${price_token_info?.symbol}`}
              className="text-[14px] font-[600] tracking-[-0.03em] text-[rgba(255,255,255,0.75)]"
            />
          </div>
        </div>
      </div>
      <div className="w-full">
        <button
          onClick={() => onJoinProject(tickets)}
          disabled={!hasTicketsAmount || tickets === 0}
          className={twMerge(
            "rounded-[10px] px-[16px] py-[10px] w-full disabled:opacity-[0.5] disabled:cursor-not-allowed",
            [hasTicketsAmount ? "bg-white" : "bg-[#EB5757] cursor-not-allowed"]
          )}
        >
          <span className="font-[600] text-[14px] text-[#431E5A]">
            Join{" "}
            {tickets > 0 ? (
              <>
                For:{" "}
                {formatNumber(
                  ticketsAmount,
                  new Big(price_token_info?.decimals! || "0"),
                  {
                    minimumFractionDigits: 0,
                  }
                )}{" "}
                {price_token_info?.symbol}
              </>
            ) : (
              "Project"
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
