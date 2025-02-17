import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  colors: {
    brand: {
      100: "#7646FF",
      200: "#7646FF",
      300: "#7646FF",
      400: "#7646FF",
      500: "#7646FF", // you need this
      600: "#7646FF", // you need this
      700: "#7646FF", // you need this
      800: "#7646FF",
      900: "#7646FF",
    },
    darkerGrey: "#1E1E1E",
  },
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  styles: {
    global: {
      body: {
        background: false,
        fontSize: "16px",
      },
    },
  },
  config,
});
