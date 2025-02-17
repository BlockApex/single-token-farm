import {
  JUMP_MANTLE_ADDRESS,
  LOCKED_JUMP_MANTLE_ADDRESS,
} from "@/env/contract";
import { VestingSchedule } from "@/pages/mantle/vesting";
import React, { useMemo, useState } from "react";
import {
  Address,
  useAccount,
  useContractRead,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import lockedJumpAbi from "@/contracts/LockedJump.json";
import jumpTokenAbi from "@/contracts/erc20.json";
import BN from "bn.js";
import { Box, BoxProps, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useTheme } from "@/hooks/theme";
import { Button, ValueBox } from "@/components/shared";
import toast from "react-hot-toast";
import { RPC_URL } from "@/context/evm-context";
import { parseUnits } from "viem";
export default function VestingScheduleComponent({
  index,
  vestingSchedule,
}: {
  index: number;
  vestingSchedule: VestingSchedule;
}) {
  const [transactionHash, setTransactionHash] = useState<string | undefined>(
    undefined
  );
  const { address, connector } = useAccount();
  const {
    jumpGradient,
    gradientBackground,
    gradientBoxTopCard,
    glassyWhiteOpaque,
  } = useTheme();

  const { writeAsync: claim } = useContractWrite({
    address: LOCKED_JUMP_MANTLE_ADDRESS,
    abi: lockedJumpAbi.abi,
    functionName: "claimVesting",
    args: [index],
  });

  const { writeAsync: buyFastPass } = useContractWrite({
    address: LOCKED_JUMP_MANTLE_ADDRESS,
    abi: lockedJumpAbi.abi,
    functionName: "buyFastPass",
    args: [address, index],
  });

  const { data: ClaimableAmount } = useContractRead({
    address: LOCKED_JUMP_MANTLE_ADDRESS,
    abi: lockedJumpAbi.abi,
    functionName: "getClaimableAmount",
    args: [address, index],
  }) as { data: BN | undefined };
  const { data: fastPassPrice } = useContractRead({
    address: LOCKED_JUMP_MANTLE_ADDRESS,
    abi: lockedJumpAbi.abi,
    functionName: "getFastPassPrice",
    args: [address, index],
    enabled: !!address && !!index && vestingSchedule.fastPassUsed === false,
  }) as { data: BN | undefined };
  const parsedSchedule = useMemo(() => {
    return {
      claimedAmount: toFixedDown(
        parseFloat(
          ethers.formatUnits(vestingSchedule.claimedAmount.toString(), 18)
        ),
        4
      ),
      endTime: vestingSchedule.fastPassUsed
        ? //half of the time
          new Date(
            parseInt(vestingSchedule.endTime.toString()) * 1000 -
              (parseInt(vestingSchedule.endTime.toString()) * 1000 -
                parseInt(vestingSchedule.startTime.toString()) * 1000) /
                2
          ).toLocaleDateString()
        : new Date(
            parseInt(vestingSchedule.endTime.toString()) * 1000
          ).toLocaleDateString(),
      fastPassUsed: vestingSchedule.fastPassUsed,
      startTime: new Date(
        parseInt(vestingSchedule.startTime.toString()) * 1000
      ).toLocaleDateString(),
      totalAmount: toFixedDown(
        parseFloat(
          ethers.formatUnits(vestingSchedule.totalAmount.toString(), 18)
        ),
        4
      ),
      ClaimableAmount: toFixedDown(
        parseFloat(ethers.formatUnits(ClaimableAmount?.toString() || "0", 18)),
        4
      ),
      Prgress: toFixedDown(
        ((parseFloat(
          ethers.formatUnits(vestingSchedule.claimedAmount.toString(), 18)
        ) +
          parseFloat(
            ethers.formatUnits(ClaimableAmount?.toString() || "0", 18)
          )) /
          parseFloat(
            ethers.formatUnits(vestingSchedule.totalAmount.toString(), 18)
          )) *
          100,
        1
      ),
      fastPassPrice: toFixedUp(
        parseFloat(ethers.formatUnits(fastPassPrice?.toString() || "0", 18)),
        4 || 0
      ),
    };
  }, [vestingSchedule, ClaimableAmount, fastPassPrice]);

  const { writeAsync: ApproveToken } = useContractWrite({
    address: JUMP_MANTLE_ADDRESS,
    abi: jumpTokenAbi.abi,
    functionName: "approve",
    args: [LOCKED_JUMP_MANTLE_ADDRESS, ethers.MaxUint256],
  });
  async function handleBuyFastPass() {
    const approveTx = await ApproveToken();
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    await toast.promise(provider.waitForTransaction(approveTx.hash), {
      loading: "Approving...",
      success: "Approved successfully!",
      error: "Something went wrong, please try again later.",
    });
    if (!buyFastPass) {
      toast.error("Something went wrong, please try again later.");
      return;
    }
    const tx = await buyFastPass();
    await toast.promise(provider.waitForTransaction(tx.hash), {
      loading: "Buying...",
      success: "Bought successfully!",
      error: "Something went wrong, please try again later.",
    });

    window.location.reload();
  }

  async function handleClaim() {
    if (!address) return;
    if (!claim) {
      toast.error("Something went wrong, please try again later.");
      return;
    }
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    try {
      const tx = await claim();
      let claimSuccess = false;
      //SHOULD USE waitForTransaction

      const res = await toast.promise(
        new Promise(async (res, rej) => {
          while (!claimSuccess) {
            const transaction = await provider.getTransaction(tx.hash);
            const confirmation = await transaction?.confirmations();
            if (confirmation && confirmation > 9) {
              claimSuccess = true;
              res(true);
            }
            if (transaction?.blockNumber === null) {
              claimSuccess = true;
              rej(false);
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          rej(false);
        }),
        {
          loading: "Claiming...",
          success: "Claimed successfully!",
          error: "Something went wrong, please try again later.",
        }
      );
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong, please try again later.");
    }
  }

  return (
    <Box
      color="white"
      p="3px"
      background={useColorModeValue("transparent", jumpGradient)}
      borderRadius="26px"
    >
      <Box
        w="100%"
        p="24px"
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
                {`Total amount - ${parsedSchedule.totalAmount} JUMP`}
              </Text>
            </Flex>
            <Flex marginTop="10px" flexDirection="column">
              <Text fontSize="24px" fontWeight="600" letterSpacing="-0.03em">
                {`Ends at ${parsedSchedule.endTime}`}
              </Text>

              <Text
                maxW="500px"
                fontSize="30px"
                fontWeight="800"
                letterSpacing="-0.03em"
              >
                {`${parsedSchedule.startTime} - Vesting`}
              </Text>
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
                  width={parsedSchedule.Prgress + "%"}
                />
              </Flex>
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
              value={`${parsedSchedule.ClaimableAmount} JUMP`}
              bottomText="Unlocked amount"
            />
            <ValueBox
              minWidth="250px"
              borderColor={glassyWhiteOpaque}
              title="Claimed Amount"
              value={`${parsedSchedule.claimedAmount} JUMP`}
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
                full
                white
                disabled={parsedSchedule.fastPassUsed}
                className="flex justify-between p-4"
                onClick={handleBuyFastPass}
              >
                {parsedSchedule.fastPassUsed
                  ? "Fast Pass Activated"
                  : `Buy Fast Pass ${parsedSchedule.fastPassPrice.toFixed(
                      6
                    )} JUMP`}
              </Button>

              <Button
                full
                white
                className="flex justify-between p-4"
                onClick={handleClaim}
              >
                Withdraw Available Tokens
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

function toFixedDown(num: number, digits: number) {
  const re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
    m = num.toString().match(re);
  return m ? parseFloat(m[1]) : num.valueOf();
}

function toFixedUp(num: number, digits: number) {
  const re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
    m = num.toString().match(re);
  return m ? parseFloat(m[1]) + 1 / Math.pow(10, digits) : num.valueOf();
}