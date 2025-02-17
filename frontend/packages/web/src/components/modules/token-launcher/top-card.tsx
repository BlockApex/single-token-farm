import { Box, Flex, Text } from "@chakra-ui/react";
import { JumpBigIcon } from "../../../assets/svg";
import { GradientText, Card } from "../../shared";
import { Tutorial } from "@/components";

export function TokenLauncherTopCard() {
  const stepItems = [
    {
      element: ".token-launcher-top-card",
      title: "Token Launcher",
      intro: (
        <div>
          <span>
            Here is the Jump DEFI Token Launcher, this page is where you can
            create your tokens.
          </span>
        </div>
      ),
    },
    {
      title: "Token Launcher Form",
      element: ".token-launcher-form",
      intro: (
        <div className="flex flex-col">
          <span>
            This is the Token Launcher form, complete all the steps to create
            your token.
          </span>
        </div>
      ),
    },
  ];

  return (
    <Card
      p="3px"
      flexGrow="1"
      borderRadius="25px"
      height={{ sm: "auto", md: "206px" }}
      className="relative token-launcher-top-card"
    >
      <Tutorial items={stepItems} />

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
              Token Laboratory
            </GradientText>
            <Text
              fontSize="45px"
              mt="20px"
              fontWeight="800"
              letterSpacing="-3%"
              lineHeight="45px"
            >
              Create your token
            </Text>
            <Text
              mt="16px"
              fontSize="1rem"
              fontWeight="600"
              letterSpacing="-3%"
              lineHeight="19.36px"
            >
              Create your own token in minutes with only a few clicks of your
              mouse!
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
  );
}
