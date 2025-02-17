import { Button } from "@/components";
import PageContainer from "@/components/PageContainer";
import React, { useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { JumpBigIcon } from "../../../assets/svg";
import { GradientText, Card } from "@/components/shared";
export default function farm() {
  return (
    <PageContainer>
      <Card
        p="3px"
        flexGrow="1"
        borderRadius="25px"
        height={{ sm: "auto", md: "206px" }}
        className="relative token-launcher-top-card"
      >
        <Flex
          pl={{ base: "none", md: "10.3%" }}
          pr="2.5%"
          flex={1.6}
          flexDirection="column"
          justifyContent="space-between"
        >
          <Flex
            width="100%"
            flex={1}
            direction={{ base: "column", md: "row" }}
            alignItems="center"
            justifyContent="space-between"
          >
            <Flex direction="column" p={4}>
              <GradientText
                fontSize="20px"
                fontWeight="700"
                letterSpacing="-3%"
                lineHeight="20px"
              >
                Jump Swap
              </GradientText>
              <Text
                fontSize="45px"
                mt="20px"
                fontWeight="800"
                letterSpacing="-3%"
                lineHeight="45px"
              >
                LP Farms
              </Text>
              <Text
                mt="16px"
                fontSize="1rem"
                fontWeight="600"
                letterSpacing="-3%"
                lineHeight="19.36px"
              >
                Earn JUMP while trading on Jump DeFi
              </Text>
            </Flex>
            <Box
              display={{ base: "none", md: "flex" }}
              zIndex="1"
              overflow="hidden"
              maxHeight="206px"
            >
              <JumpBigIcon />
            </Box>
          </Flex>
        </Flex>
      </Card>
      <Button
        big
        onClick={() => {
          window.open("https://swap.jumpdefi.xyz", "_blank");
        }}
        className="mx-auto"
      >
        Open App
      </Button>
      <div className="flex flex-col justify-start h-[500px]"></div>
    </PageContainer>
  );
}
