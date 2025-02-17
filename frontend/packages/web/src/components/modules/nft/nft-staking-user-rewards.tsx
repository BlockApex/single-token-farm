import Big from "big.js";
import { ValueBox, If } from "@/components";
import { Text, Flex, Image, Skeleton } from "@chakra-ui/react";
import { useNftStaking } from "@/stores/nft-staking-store";
import { StakingToken } from "@near/ts";
import { useMemo } from "react";
import isEmpty from "lodash/isEmpty";
import { useWalletSelector } from "@/context/wallet-selector";
import { useTheme } from "@/hooks/theme";

export function NFTStakingUserRewards({
  rewards,
}: {
  rewards: StakingToken[];
}) {
  const { glassyWhiteOpaque } = useTheme();
  const { tokens } = useNftStaking();
  const { accountId } = useWalletSelector();

  const tokenRewads = useMemo(() => {
    return rewards?.map((token) => {
      const totalBalance = tokens.reduce((sum, { balance }) => {
        const tokenBalance = new Big(
          balance[token.account_id || ""].toString()
        );

        return sum.add(tokenBalance);
      }, new Big(0));

      const decimalsBig = Big(10).pow(token.decimals);
      const balanceBig = new Big(totalBalance.toString())
        .div(decimalsBig)
        .toFixed(2);

      return {
        ...token,
        userBalance: balanceBig,
      };
    });
  }, [tokens, rewards]);

  return (
    <Flex
      flex={1}
      direction="column"
      flexWrap="wrap"
      className="relative nft-position"
    >
      <Text fontWeight="800" fontSize={30} letterSpacing="-0.03em" mb={3}>
        Your Position:
      </Text>

      <Flex gap={3} flexWrap="wrap">
        <If
          fallback={
            <>
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  height="128px"
                  borderRadius={20}
                  flex="1"
                  endColor="rgba(255,255,255,0.3)"
                  key={"nft-staking-user-reward-" + i}
                />
              ))}
            </>
          }
          condition={!isEmpty(tokenRewads)}
        >
          {tokenRewads &&
            tokenRewads.map(({ name, userBalance, icon }, index) => (
              <ValueBox
                key={"user-rewards-" + index}
                flex="1"
                flexGrow="1"
                alignItems="stretch"
                maxHeight="max-content"
                title={`Your ${name} Rewards`}
                value={
                  accountId ? (
                    <Flex className="items-top space-x-[4px]">
                      {icon && (
                        <Image
                          borderRadius={99}
                          border="solid 3px"
                          outline={glassyWhiteOpaque}
                          boxSizing="content-box"
                          borderColor={glassyWhiteOpaque}
                          src={icon}
                          className="h-[28px]"
                        />
                      )}
                      <Text children={userBalance} />
                    </Flex>
                  ) : (
                    "Connect Wallet"
                  )
                }
                bottomText={name}
              />
            ))}
        </If>
      </Flex>
    </Flex>
  );
}
