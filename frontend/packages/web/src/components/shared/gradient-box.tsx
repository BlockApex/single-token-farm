import { Box, BoxProps } from "@chakra-ui/react";
import { useTheme } from "../../hooks/theme";

export const GradientBox: React.FC<BoxProps> = ({ children, ...props }) => {
  const { jumpGradient, gradientBoxTopCard } = useTheme();
  return (
    <Box p="3px" background={jumpGradient} borderRadius="26px">
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        w="100%"
        p="70px"
        borderRadius="24px"
        bg={gradientBoxTopCard}
        {...props}
      >
        {children}
      </Box>
    </Box>
  );
};
