import Big from "big.js";
import { motion } from "framer-motion";
import { InfoIcon } from "@/assets/svg";
import { ValueBox } from "@/components";
import { useTheme } from "@/hooks/theme";
import { Token, StakingToken } from "@near/ts";
import { Flex, Text, Image, useColorModeValue } from "@chakra-ui/react";
import { useMemo } from "react";
import { format, isBefore, addMilliseconds } from "date-fns";
import { getUTCDate } from "@near/ts";

export function TokenAccordion({
  rewards,
  metadata,
  token_id,
  balance,
  stakedAt,
  minStakedPeriod,
  penalty,
}: Token & {
  rewards: StakingToken[];
  minStakedPeriod: string;
  penalty: string;
  token: string;
}) {
  const { jumpGradient, gradientBoxTopCard, glassyWhiteOpaque } = useTheme();

  const staked = useMemo(() => {
    return getUTCDate(Number(stakedAt) / 1000000);
  }, [stakedAt, token_id]);

  const endPenalty = useMemo(() => {
    return addMilliseconds(staked, Number(minStakedPeriod) / 1000000);
  }, [minStakedPeriod, token_id]);

  const hasWithdrawPenalty = useMemo(() => {
    const today = getUTCDate();

    return isBefore(today, endPenalty);
  }, [staked, endPenalty, token_id]);

  const withdrawPenalty = useMemo(() => {
    const denom = new Big("10000000000");
    const penaltyBN = new Big(penalty);

    return penaltyBN.div(denom).toString() + "%";
  }, [rewards, token_id, penalty]);

  const getFormatedBalance = (balance, decimals) => {
    const decimalsBig = Big(10).pow(decimals);
    const balanceBig = new Big(balance).div(decimalsBig).toFixed(2);

    return balanceBig;
  };

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
      key={"nft-staking-token-accordion" + token_id}
    >
      <Flex width="100%" flexDirection="column">
        <Flex width="100%" className="flex-col lg:flex-row" gap="20px">
          <Flex width="309px" height="298px" flexShrink="0">
            <Image
              width="100%"
              height="100%"
              borderRadius="20px"
              src={`https://images.weserv.nl/?url=${metadata.media}&w=800&fit=contain`}
            />
          </Flex>

          <Flex
            flexGrow="1"
            minHeight="298px"
            padding="3px"
            borderRadius="25px"
            maxWidth="100%"
            flexWrap="wrap"
            background={useColorModeValue("transparent", jumpGradient)}
          >
            <Flex
              flexGrow="1"
              borderRadius="25px"
              boxSize="border-box"
              bg={useColorModeValue(jumpGradient, gradientBoxTopCard)}
            >
              <Flex
                flexGrow="1"
                borderRadius="25px"
                boxSize="border-box"
                flexDirection="column"
                padding="35px 39px 35px 39px"
                bg={useColorModeValue(glassyWhiteOpaque, "transparent")}
              >
                <Flex marginBottom="25px" flexDirection="column">
                  <Text
                    color="white"
                    fontSize="20px"
                    fontWeight="700"
                    letterSpacing="-0.03em"
                  >
                    {metadata.title}
                  </Text>

                  <Text
                    color="white"
                    fontSize="24px"
                    fontWeight="600"
                    lineHeight="29px"
                  >
                    {metadata.description}
                  </Text>
                </Flex>

                <Flex gap="15px" width="100%" flexWrap="wrap">
                  {rewards?.map(
                    ({ account_id, icon, name, symbol, decimals }, i) => (
                      <ValueBox
                        className="md:min-w-[250px]"
                        borderColor={glassyWhiteOpaque}
                        title={name + " Rewards"}
                        color="white"
                        value={
                          <Flex className="items-top space-x-[4px]">
                            {icon && <Image src={icon} className="h-[28px]" />}

                            <Text
                              children={getFormatedBalance(
                                balance[account_id],
                                decimals
                              )}
                            />
                          </Flex>
                        }
                        bottomText={symbol}
                        key={"nft-staking-rewards" + i}
                      />
                    )
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        <Flex
          width="100%"
          background="#EB5757"
          borderRadius="20px"
          minHeight="90px"
          alignItems="center"
          padding="12px 32px"
          flexWrap="wrap"
          margin="22px 0px 36px 0px"
          gap="12px"
          opacity={hasWithdrawPenalty ? 1 : 0}
        >
          <Flex flexShrink="0" className="mx-auto lg:mx-0">
            <InfoIcon color="white" />
          </Flex>

          <Text
            color="white"
            fontSize="20px"
            fontWeight="400"
            lineHeight="24px"
            className="text-center lg:text-left"
          >
            This NFT is subject to an early withdraw penalty of{" "}
            {withdrawPenalty}, wait until
            {format(endPenalty, " dd MMMM, yyyy - HH:mm a")}
          </Text>
        </Flex>
      </Flex>
    </motion.div>
  );
}
