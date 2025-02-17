import { Box, ButtonProps } from "@chakra-ui/react";
import { useTheme } from "@/hooks/theme";
import { Button } from "./button";

type Props = ButtonProps;

export function GradientButton(props: Props) {
  const { jumpGradient } = useTheme();
  return (
    <Box p="2px" h="max" bg={jumpGradient} borderRadius={18}>
      <Button full white disabled={props.isDisabled} onClick={props.onClick}>
        {props.children}
      </Button>
    </Box>
  );
}
