import { useColorModeValue } from "@chakra-ui/react";

export const useTheme = () => {
  return {
    blackAndWhite: useColorModeValue("black", "white"),
    gradientBackground: useColorModeValue(
      "radial-gradient(41.57% 98.54% at 58.43% 41.55%, #FFFFFF 0%, #FEEFFF 100%)",
      "radial-gradient(40.33% 70.37% at 60.65% 14.31%, #340000 0%, #21002F 100%)"
    ),
    gradientBoxTopCard: useColorModeValue(
      "radial-gradient(41.57% 98.54% at 58.43% 41.55%, #FFFFFF 0%, #FEEFFF 100%)",
      "radial-gradient(42.13% 91.13% at 52.8% 40.03%, #340000 0%, #21002F 100%)"
    ),
    jumpGradient: "linear-gradient(90deg, #510B72 0%, #740B0B 100%)",
    darkRed: "#340000",
    darkPurple: "#21002F",
    glassyWhite: "rgba(255,255,255,0.10)",
    glassyWhiteOpaque: "rgba(255,255,255,0.40)",
    darkPurpleOpaque: "rgba(33,0,47, 0.20)",
  };
};
