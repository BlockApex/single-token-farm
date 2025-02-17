import { Buffer } from "buffer";
import React, { Suspense } from "react";

import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { theme } from "./theme";
import "./index.css";
import "intro.js/introjs.css";
import { inject } from "@vercel/analytics";
import { ChainSelectorContextProvider } from "./context/chain-selector";
// TODO: Find a better way to handle this buffer error
window.Buffer = window.Buffer || Buffer;
inject();
ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ChainSelectorContextProvider />
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    </ChakraProvider>
  // </React.StrictMode>
);
