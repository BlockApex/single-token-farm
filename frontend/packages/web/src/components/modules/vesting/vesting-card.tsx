import * as R from "ramda";
import { format, differenceInMilliseconds, addMilliseconds } from "date-fns";
import { Box, BoxProps, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { Button, ValueBox } from "@/components";
import { WalletIcon } from "@/assets/svg";
import { useTheme } from "../../../hooks/theme";
import { useMemo, useState } from "react";
import { getUTCDate } from "@near/ts";
import {
  useVestingStore,
  Vesting,
  Token,
  ContractData,
} from "@/stores/vesting-store";
import { BuyFastPass } from "@/modals";
import { useNearQuery } from "react-near";
import { JUMP_TOKEN } from "@/env/contract";
import { useWalletSelector } from "@/context/wallet-selector";
import { useTokenBalance } from "@/hooks/modules/token";
import Big from "big.js";
import { formatBigNumberWithDecimals } from "@/tools";

export function VestingCard(
  props: Vesting & BoxProps & { token: Token; contractData: ContractData }
) {
  const { jumpGradient, gradientBoxTopCard, glassyWhiteOpaque } = useTheme();

  const createdAt = useMemo(() => {
    return getUTCDate(Number(props.start_timestamp) / 1000000);
  }, [props.start_timestamp]);

  const endAt = useMemo(() => {
    return addMilliseconds(createdAt, Number(props.vesting_duration) / 1000000);
  }, [props.start_timestamp, props.vesting_duration]);

  const progress = useMemo(() => {
    const today = new Date();
    const base = differenceInMilliseconds(endAt, createdAt);
    const current = differenceInMilliseconds(today, createdAt) * 100;

    return Math.round(current / base);
  }, [props.start_timestamp, props.vesting_duration]);

  const { accountId, selector } = useWalletSelector();

  const { withdraw } = useVestingStore();

  const [showFastPass, setShowFastPass] = useState(false);

  const { data: baseTokenBalance } = useTokenBalance(JUMP_TOKEN, accountId);

  const decimals = useMemo(() => {
    return new Big(10).pow(props?.token?.decimals || 1);
  }, [props]);

  const totalAmount = useMemo(() => {
    return formatBigNumberWithDecimals(props.locked_value, decimals);
  }, [props, decimals]);

  const avaialbleToClaim = useMemo(() => {
    return formatBigNumberWithDecimals(props.available_to_withdraw, decimals);
  }, [props, decimals]);

  const withdrawnAmount = useMemo(() => {
    return formatBigNumberWithDecimals(props.withdrawn_tokens, decimals);
  }, [props, decimals]);

  return (
    <Box
      color="white"
      p="3px"
      background={useColorModeValue("transparent", jumpGradient)}
      borderRadius="26px"
      {...(R.omit(
        [
          "id",
          "beneficiary",
          "locked_value",
          "start_timestamp",
          "vesting_duration",
          "fast_pass",
          "withdrawn_tokens",
          "available_to_withdraw",
          "token",
          "contractData",
        ],
        props
      ) as Record<string, string>)}
    >
      <Box
        w="100%"
        bg={useColorModeValue(jumpGradient, gradientBoxTopCard)}
        borderRadius="24px"
      >
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          w="100%"
          p="40px"
          borderRadius="24px"
          flexWrap="wrap"
          gap={5}
          bg={useColorModeValue(glassyWhiteOpaque, "transparent")}
        >
          <Flex direction="column">
            <Flex
              padding="9px 20px"
              background="white"
              rounded="30px"
              width="max-content"
              maxW="100%"
            >
              <Text color="black" fontSize="16px" fontWeight="700">
                {`Total amount - ${totalAmount} JUMP`}
              </Text>
            </Flex>

            <Flex marginTop="10px" flexDirection="column">
              <Text fontSize="24px" fontWeight="600" letterSpacing="-0.03em">
                {`Ends at ${format(endAt, "dd MMMM y")}`}
              </Text>

              <Text
                maxW="500px"
                fontSize="30px"
                fontWeight="800"
                letterSpacing="-0.03em"
              >
                {`${format(getUTCDate(), "dd MMMM y")} - Vesting`}
              </Text>
            </Flex>

            <Flex
              flex="1"
              marginTop="13px"
              rounded="100px"
              bg="rgba(255, 255, 255, 0.38)"
            >
              <Flex
                height="10px"
                rounded="100px"
                bg={jumpGradient}
                width={progress + "%"}
              />
            </Flex>
          </Flex>

          <Flex
            gap={5}
            alignItems="center"
            flexGrow="1"
            maxWidth="840px"
            flexWrap="wrap"
          >
            <ValueBox
              minWidth="250px"
              borderColor={glassyWhiteOpaque}
              title="Available to Claim"
              value={`${avaialbleToClaim} ${props.token?.symbol}`}
              bottomText="Unlocked amount"
            />

            <ValueBox
              minWidth="250px"
              borderColor={glassyWhiteOpaque}
              title="Claimed Amount"
              value={`${withdrawnAmount} ${props.token?.symbol}`}
              bottomText="Withdrawn amount"
            />

            <Flex
              w="100%"
              maxW="300px"
              height="133px"
              flexDirection="column"
              justifyContent="space-evenly"
            >
              <Button
                disabled={
                  props.fast_pass || baseTokenBalance === "0" || !accountId
                }
                full
                white
                className="flex justify-between p-4"
                onClick={() => setShowFastPass(true)}
              >
                {props.fast_pass ? (
                  "Bought Fast Pass"
                ) : (
                  <>
                    Buy Fast Pass
                    <WalletIcon className="h-6" />
                  </>
                )}
              </Button>

              <Button
                disabled={props.available_to_withdraw === "0" || !accountId}
                full
                white
                className="flex justify-between p-4"
                onClick={async () => {
                  withdraw([String(props.id)], accountId as string, selector);
                }}
              >
                Withdraw Available Tokens
                <WalletIcon className="h-6" />
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Box>

      <BuyFastPass
        onClose={() => setShowFastPass(false)}
        isOpen={showFastPass}
        token={props.token}
        vestingId={props.id || ""}
        passCost={props.contractData.fast_pass_cost}
        totalAmount={props.locked_value}
        acceleration={Number(props.contractData?.fast_pass_acceleration)}
      />
    </Box>
  );
}
