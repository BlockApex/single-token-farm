import { useEffect, useState, useMemo } from "react";
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
import PageContainer from "@/components/PageContainer";
import { ContractData, Token, useVestingStore } from "@/stores/vesting-store";
import { useWalletSelector } from "@/context/wallet-selector";
import { useTheme } from "@/hooks/theme";
import stepItemsVesting, { extraItem } from "./vesting.tutorial";
import { formatBigNumberWithDecimals, getDecimals } from "@/tools";
import { useFilter } from "./vesting.config";

export const Vesting = () => {
  const [filter, setFilter] = useState<string | null>(null);

  const { accountId, selector } = useWalletSelector();
  const { glassyWhiteOpaque } = useTheme();

  const {
    getInvestorInfo,
    getVestings,
    withdraw,
    cleanupData,
    investorInfo,
    vestings,
    loading,
  } = useVestingStore();

  useEffect(() => {
    (async () => {
      if (!accountId) {
        cleanupData();

        return;
      }

      await getVestings(selector, accountId);
      await getInvestorInfo(selector);
    })();
  }, [accountId]);

  const filtered = useMemo(() => {
    return useFilter(filter, vestings);
  }, [filter, vestings]);

  const isLoading = useMemo(() => {
    if (!accountId) {
      return false;
    }

    return isEmpty(investorInfo);
  }, [investorInfo, accountId]);

  const decimals = useMemo(() => {
    return getDecimals(investorInfo?.token?.decimals);
  }, [investorInfo]);

  const totalLocked = useMemo(() => {
    return formatBigNumberWithDecimals(
      investorInfo?.totalLocked || 1,
      decimals
    );
  }, [investorInfo, decimals]);

  const totalUnlocked = useMemo(() => {
    return formatBigNumberWithDecimals(
      investorInfo?.totalUnlocked || 1,
      decimals
    );
  }, [investorInfo, decimals]);

  const totalWithdrawn = useMemo(() => {
    return formatBigNumberWithDecimals(
      investorInfo?.totalWithdrawn || 1,
      decimals
    );
  }, [investorInfo, decimals]);

  const stepItems = useMemo(() => {
    const items = stepItemsVesting;

    if (accountId! && !isEmpty(vestings)) {
      items.push(extraItem);
    }

    return items;
  }, [accountId, vestings]);

  return (
    <PageContainer>
      <TopCard
        gradientText="Jump Vesting"
        bigText="Unlock and Claim JUMP Rewards"
        bottomDescription=" Claim your JUMP and boost the rate of vested rewards"
        stepItems={stepItems}
        content={
          accountId ? (
            <Flex gap="1.25rem" flex="1" className="flex-col lg:flex-row">
              <Skeleton
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
                    accountId ? (
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
                            src={investorInfo?.token?.icon}
                          />
                        </Box>
                        <Text>{totalLocked}</Text>
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
                    accountId ? (
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
                            src={investorInfo?.token?.icon}
                          />
                        </Box>
                        <Text>{totalUnlocked}</Text>
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
                  title={accountId ? "Total Withdrawn" : ""}
                  className="amount-withdrawn"
                  value={
                    accountId ? (
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
                            src={investorInfo?.token?.icon}
                          />
                        </Box>
                        <Text>{totalWithdrawn}</Text>
                      </Flex>
                    ) : (
                      "Connect Wallet"
                    )
                  }
                  bottomText="Total quantity "
                />
              </Skeleton>
            </Flex>
          ) : (
            <></>
          )
        }
      />

      <If
        fallback={
          accountId
            ? !loading && <Empty text="No vestings available" />
            : loading && (
                <Empty text="Connect your wallet to view Jump Vesting" />
              )
        }
        condition={!isEmpty(investorInfo) && !isEmpty(vestings)}
      >
        <>
          <Flex justifyContent="space-between">
            <Select
              value={filter}
              placeholder="Vesting Schedules"
              items={[
                { label: "Completed", value: "completed" },
                { label: "Vesting Live", value: "runing" },
              ]}
              onChange={(value: string | null) => setFilter(value)}
            />

            <Flex maxW="330px" alignItems="center">
              <GradientButton
                onClick={async () => {
                  withdraw(
                    vestings
                      .filter(({ available_to_withdraw }) => {
                        return (
                          Number(available_to_withdraw) >
                          Math.pow(10, investorInfo.token?.decimals || 0)
                        );
                      })
                      .map(({ id }) => String(id)),
                    accountId as string,
                    selector
                  );
                }}
                className="justify-center w-[150px]"
              >
                Claim All
              </GradientButton>
            </Flex>
          </Flex>
          {vestings && (
            <Stack spacing="32px">
              {filtered.map((vesting, index) => (
                <VestingCard
                  className="vesting-card"
                  {...vesting}
                  token={investorInfo.token as Token}
                  contractData={investorInfo.contractData as ContractData}
                  key={"vesting-" + index}
                />
              ))}
            </Stack>
          )}
        </>
      </If>
    </PageContainer>
  );
};

export default Vesting;
