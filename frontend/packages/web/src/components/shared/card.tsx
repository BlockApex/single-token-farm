import { Box, BoxProps, useColorModeValue } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { useTheme } from "../../hooks/theme";

export const Card = ({ children, ...props }: PropsWithChildren<BoxProps>) => {
  const { glassyWhite, jumpGradient } = useTheme();
  return (
    <Box
      borderRadius={25}
      bg={useColorModeValue(jumpGradient, "transparent")}
      {...props}
    >
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        w="100%"
        color="white"
        p="40px"
        h="100%"
        borderRadius="24px"
        bg={glassyWhite}
      >
        {children}
      </Box>
    </Box>
  );
};
