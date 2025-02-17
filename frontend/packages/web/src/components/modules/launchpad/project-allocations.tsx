import Big from "big.js";
import { isBefore, format } from "date-fns";
import { getUTCDate } from "@near/ts";
import { WalletIcon } from "@/assets/svg";
import { useMemo, useState, useCallback } from "react";
import { Flex, Text, Skeleton } from "@chakra-ui/react";
import { useLaunchpadStore } from "@/stores/launchpad-store";
import { useWalletSelector } from "@/context/wallet-selector";
import { Steps } from "intro.js-react";
import { LaunchpadListing } from "@near/apollo";
import { investorAllocation } from "@/interfaces";

import {
  If,
  GradientText,
  NumberInput,
  Button,
  IconButton,
} from "@/components";

export function ProjectAllocations({
  isLoading,
  launchpadProject,
  priceTokenBalance,
  investorAllowance,
}: {
  isLoading: boolean;
  investorAllowance: string;
  priceTokenBalance: string;
  totalAllowanceData: string;
  launchpadProject: LaunchpadListing;
  investorAllocation: investorAllocation;
}) {
  const { accountId, selector } = useWalletSelector();
  const { buyTickets } = useLaunchpadStore();

  const [tickets, setTickets] = useState(0);

  const allocationsAvailable = useMemo(() => {
    return new Big(investorAllowance ?? "0");
  }, [investorAllowance]);

  const onJoinProject = useCallback(
    async (amount: number) => {
      if (
        typeof launchpadProject?.listing_id &&
        launchpadProject?.price_token
      ) {
        buyTickets(
          new Big(amount)
            .mul(new Big(launchpadProject.token_allocation_price || 0))
            .toString(),
          launchpadProject.price_token,
          launchpadProject.listing_id,
          accountId!,
          selector
        );
      }
    },
    [
      1,
      accountId,
      launchpadProject?.project_token,
      launchpadProject?.token_allocation_price,
    ]
  );

  const formatDate = (start_timestamp?: string) => {
    const date = getUTCDate(Number(start_timestamp ?? "0"));
    return format(date, "MM/dd/yyyy");
  };

  const enabledSales = useMemo(() => {
    const now = new Date();
    const startSale = new Date(Number(launchpadProject.open_sale_1_timestamp!));

    return isBefore(startSale, now);
  }, [launchpadProject]);

  const ticketsAmount = useMemo(() => {
    return new Big(launchpadProject.token_allocation_price! ?? 0).mul(
      new Big(tickets.toString())
    );
  }, [tickets]);

  const hasTicketsAmount = useMemo(() => {
    return new Big(priceTokenBalance ?? "0").gte(ticketsAmount);
  }, [ticketsAmount, priceTokenBalance]);

  const [showSteps, setShowSteps] = useState(false);

  const stepItems = [
    {
      title: "Project Allocations",
      element: ".project-allocations",
      intro: (
        <div className="flex flex-col space-y-[8px]">
          <span>
            In this session where you invest your Allowances and enter the
            projects vesting campaign.
          </span>

          <span className="text-[#EB5757]">
            When you burn an allowance, it is not possible to receive it again.
          </span>
        </div>
      ),
    },
    {
      title: "Project Allocations",
      element: ".project-allocations-tokens",
      intro: (
        <div className="flex flex-col space-y-[8px]">
          <span>Entering a vesting campaign is easy.</span>

          <span>
            First you select how many allocations you want (make sure you have
            the amount needed for each allocation) and click in Join Project.
          </span>

          <span className="text-[#EB5757]">
            Whenever you spend an allocation, it cannot be refunded. Upon
            entering the project, you will earn campaign rewards as per the
            schedule.
          </span>
        </div>
      ),
    },
  ];

  const decimals = useMemo(() => {
    if (!launchpadProject?.price_token_info?.decimals) {
      return new Big(1);
    }

    return new Big(10).pow(
      Number(launchpadProject?.price_token_info?.decimals)
    );
  }, [launchpadProject?.price_token_info]);

  const balance = useMemo(() => {
    return new Big(priceTokenBalance ?? 0).div(decimals).toFixed(2);
  }, [priceTokenBalance, decimals]);

  const total = useMemo(() => {
    return ticketsAmount.div(decimals);
  }, [ticketsAmount, decimals]);

  return (
    <>
      {!isLoading && (
        <div className="absolute right-[24px] top-[24px]">
          <IconButton onClick={() => setShowSteps(true)} />
        </div>
      )}

      <Steps
        enabled={showSteps}
        steps={stepItems}
        initialStep={0}
        onExit={() => setShowSteps(false)}
        options={{
          showProgress: false,
          showBullets: false,
          scrollToElement: false,
        }}
      />

      <If condition={!enabledSales && !isLoading}>
        <Flex className="absolute inset-0 rounded-[24px] z-[2] bg-opacity-[.2] backdrop-blur-[10px] bg-black flex items-center justify-center flex-col">
          <Text
            fontWeight="800"
            fontFamily="Inter"
            letterSpacing="-0.05em"
            fontSize="24px"
            as="h1"
          >
            Await start sales
          </Text>

          <Text
            color="white"
            fontWeight="800"
            fontFamily="Inter"
            letterSpacing="-0.05em"
            fontSize="24px"
            mb="-20px"
            as="h1"
          >
            {formatDate(launchpadProject.open_sale_1_timestamp!)}
          </Text>
        </Flex>
      </If>

      <Flex direction="column" flex={1} gap={1} className="h-full">
        <Skeleton isLoaded={!isLoading} className="rounded-[16px]">
          <GradientText fontWeight="800" letterSpacing="-0,03em" fontSize={24}>
            Join Project
          </GradientText>
        </Skeleton>

        <Skeleton
          isLoaded={!isLoading}
          className="w-full min-h-[55px] rounded-[16px]"
        >
          <Text
            fontWeight="800"
            fontFamily="Inter"
            letterSpacing="-0.05em"
            fontSize="50px"
            marginTop="-8px"
            lineHeight="50px"
            as="h1"
          >
            {launchpadProject?.project_name}
          </Text>
        </Skeleton>

        <Skeleton
          isLoaded={!isLoading}
          className="h-[92.5px] rounded-[16px] my-[30px] relative project-allocations-tokens"
        >
          <Flex gap="5px" direction="column" maxWidth="380px">
            <Flex flexWrap="wrap" justifyContent="space-between">
              <Text>
                Your Balance: {balance}{" "}
                {launchpadProject?.price_token_info?.symbol}
              </Text>
            </Flex>

            <NumberInput
              min={0}
              value={tickets}
              max={allocationsAvailable.toNumber()}
              onChange={(value) => setTickets(value || 0)}
            />

            <Text>
              You can buy: {allocationsAvailable.toNumber() + " "}
              allocations
            </Text>
          </Flex>
        </Skeleton>

        <If
          condition={!!accountId}
          fallback={
            <Button
              disabled
              onClick={() => onJoinProject(tickets)}
              className="justify-between w-full max-w-[380px]"
            >
              Connect Wallet
            </Button>
          }
        >
          <Skeleton
            isLoaded={!isLoading}
            className="w-full min-h-[60px] rounded-[16px]"
          >
            <Button
              onClick={() => onJoinProject(tickets)}
              className={`justify-between w-full max-w-[380px] ${
                hasTicketsAmount ? "bg-white" : "bg-[#EB5757]"
              }`}
              disabled={!hasTicketsAmount || tickets === 0}
            >
              Join{" "}
              {tickets > 0 ? (
                <>
                  For: {total} {launchpadProject?.price_token_info?.symbol}
                </>
              ) : (
                "Project"
              )}
              <WalletIcon />
            </Button>
          </Skeleton>
        </If>
      </Flex>
    </>
  );
}
