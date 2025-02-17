import { useTheme } from "@/hooks/theme";
import { CircularProgress } from "@chakra-ui/react";

export function LoadingIndicator() {
  const { darkPurple } = useTheme();
  return <CircularProgress isIndeterminate color={darkPurple} />;
}
