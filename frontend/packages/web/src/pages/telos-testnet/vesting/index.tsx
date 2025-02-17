import PageContainer from "@/components/PageContainer";
import React, { useMemo } from "react";
import { useAccount, useContractRead } from "wagmi";

import lockedJumpAbi from "@/contracts/LockedJump.json";

import tokenSvg from "@/assets/svg/tokenSvg.svg";
import isEmpty from "lodash/isEmpty";
import { Stack, Flex, Skeleton, Box, Image, Text } from "@chakra-ui/react";
import {
  If,
  TopCard,
  VestingCard,
  ValueBox,
  Select,
  GradientButton,
  Empty,
} from "@/components";

enum VestingFilter {
  VESTING = "VESTING",
  CLAIMED = "CLAIMED",
  ALL = "ALL",
}

export type VestingSchedule = {
  claimedAmount: BigNumberish;
  endTime: BigNumberish;
  fastPassUsed: boolean;
  lastClaimedTime: BigNumberish;
  startTime: BigNumberish;
  totalAmount: BigNumberish;
};

import { useTheme } from "@/hooks/theme";
import { LOCKED_JUMP_MANTLE_ADDRESS } from "@/env/contract";
import VestingScheduleComponent from "@/components/modules/mantle/vesting/VestingSchedule";
import { BigNumberish } from "ethers";
import toast from "react-hot-toast";
export default function MantleVesting() {
  const { address } = useAccount();
  const { glassyWhiteOpaque } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<VestingFilter>(VestingFilter.ALL);

  const { data: vestingSchedules } = useContractRead({
    address: LOCKED_JUMP_MANTLE_ADDRESS,
    abi: lockedJumpAbi.abi,
    functionName: "getVestingSchedules",
    args: [address],
    enabled: !!address,
  }) as { data: VestingSchedule[] | undefined };

  const vestingCount = useMemo(() => {
    if (!vestingSchedules) return 0;

    return (vestingSchedules as any[]).length;
  }, [vestingSchedules]);

  return (
    <PageContainer>
      <TopCard
        bigText="Unlock and Claim JUMP Rewards on Mantle Blockchain"
        gradientText="Mantle Jump Vesting"
        bottomDescription="Claim your JUMP and boost the rate of vested rewards"
        content={
          address ? (
            <Flex gap="1.25rem" flex="1" className="flex-col lg:flex-row">
              {/* <Skeleton
                height="114px"
                borderRadius={20}
                className="md:min-w-[240px]"
                endColor="rgba(255,255,255,0.3)"
                isLoaded={!isLoading}
              >
                <ValueBox
                  borderColor={glassyWhiteOpaque}
                  className="amount-locked"
                  title="Total Locked"
                  value={
                    address ? (
                      <Flex className="items-center space-x-[8px]">
                        <Box
                          borderRadius={99}
                          border="solid 3px"
                          outline={glassyWhiteOpaque}
                          borderColor={glassyWhiteOpaque}
                          boxSizing="content-box"
                          className="h-[28px] w-[28px]"
                        >
                          <Image
                            width="100%"
                            height="100%"
                            src={"/assets/svgs/token.svg"}
                          />
                        </Box>
                        <Text>Total Locked</Text>
                      </Flex>
                    ) : (
                      "Connect Wallet"
                    )
                  }
                  bottomText="All amount locked"
                />
              </Skeleton>

              <Skeleton
                height="114px"
                borderRadius={20}
                className="md:min-w-[240px]"
                endColor="rgba(255,255,255,0.3)"
                isLoaded={!isLoading}
              >
                <ValueBox
                  borderColor={glassyWhiteOpaque}
                  title="Total Unlocked"
                  className="amount-unlocked"
                  value={
                    address ? (
                      <Flex className="items-center space-x-[8px]">
                        <Box
                          borderRadius={99}
                          border="solid 3px"
                          outline={glassyWhiteOpaque}
                          borderColor={glassyWhiteOpaque}
                          boxSizing="content-box"
                          className="h-[28px] w-[28px]"
                        >
                          <Image
                            width="100%"
                            height="100%"
                            src={"/assets/svgs/token.svg"}
                          />
                        </Box>
                        <Text>Total Unlocked</Text>
                      </Flex>
                    ) : (
                      "Connect Wallet"
                    )
                  }
                  bottomText="Unlocked amount"
                />
              </Skeleton>

              <Skeleton
                height="114px"
                borderRadius={20}
                className="md:min-w-[240px]"
                endColor="rgba(255,255,255,0.3)"
                isLoaded={!isLoading}
              >
                <ValueBox
                  borderColor={glassyWhiteOpaque}
                  title={address ? "Total Withdrawn" : ""}
                  className="amount-withdrawn"
                  value={
                    address ? (
                      <Flex className="items-center space-x-[8px]">
                        <Box
                          borderRadius={99}
                          border="solid 3px"
                          outline={glassyWhiteOpaque}
                          borderColor={glassyWhiteOpaque}
                          boxSizing="content-box"
                          className="h-[28px] w-[28px]"
                        >
                          <Image
                            width="100%"
                            height="100%"
                            src={"/assets/svgs/token.svg"}
                          />
                        </Box>
                        <Text>withdraw a.</Text>
                      </Flex>
                    ) : (
                      "Connect Wallet"
                    )
                  }
                  bottomText="Total quantity "
                />
              </Skeleton>*/}
            </Flex>
          ) : (
            <></>
          )
        }
      />

      <If
        fallback={
          address
            ? !isLoading && <Empty text="No vestings available" />
            : isLoading && (
                <Empty text="Connect your wallet to view Jump Vesting" />
              )
        }
        condition={true}
      >
        <>
          <Flex justifyContent="space-between">
            {/* <Select
              value={filter}
              placeholder="Vesting Schedules"
              items={[{ label: "All", value: VestingFilter.ALL }]}
              onChange={(value: VestingFilter | null) => {
                if (!value) return;

                setFilter(value);
              }}
            />*/}
          </Flex>
          <Flex maxW="330px" alignItems="center"></Flex>
        </>
        {vestingSchedules && vestingSchedules.length > 0 ? (
          <div className="flex flex-col gap-3">
            {vestingSchedules.map((vestingSchedule, index) => {
              return (
                <div key={`${index}-mantle-locked-schedule`}>
                  <VestingScheduleComponent
                    index={index + 1}
                    vestingSchedule={vestingSchedule}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div></div>
        )}
      </If>
    </PageContainer>
  );
}