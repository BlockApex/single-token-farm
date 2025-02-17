import { Box, Flex } from "@chakra-ui/react";
import { GradientText } from "../../shared";

export function FormHeader({ title, step }: { title: string; step: string }) {
  return (
    <Flex
      width="100%"
      direction={{ base: "column", md: "row" }}
      alignItems={{ base: "start", md: "end" }}
      justifyContent="flex-start"
      pl={4}
      gap="30px"
      height="fit-content"
    >
      <GradientText
        fontSize="40px"
        fontWeight="700"
        letterSpacing="-3%"
        lineHeight="40px"
      >
        {title}
      </GradientText>
      <Box
        width="109px"
        height="33.4px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        backgroundColor="#6E3A85"
        borderRadius="43.95px"
      >
        <GradientText
          fontSize="16px"
          fontWeight="600"
          letterSpacing="-3%"
          lineHeight="16px"
        >
          {step}
        </GradientText>
      </Box>
    </Flex>
  );
}
