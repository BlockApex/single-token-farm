import React, { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import routes from "virtual:generated-pages-react";
import { useAccount } from "wagmi";

import { ReportButton, Header, Nav } from "./components";
import ScrollToTop from "./tools/ScrollToTop";
import { EvmContext } from "./context/evm-context";
const Pages = () => {
  const filteredRoutes = routes.map((item) => {
    if (item.children) {
      return {
        ...item,
        children: item.children?.filter((children) => {
          if (
            !children.path?.includes("tutorial") &&
            !children.path?.includes("config")
          ) {
            return children;
          }
        }),
      };
    }

    return item;
  });

  return useRoutes(filteredRoutes);
};
export default function TelosApp() {
  const { connector } = useAccount();
  useEffect(() => {
    if (connector) {
      connector.getChainId().then((chainId) => {
        console.log(chainId);
        if (chainId !== 40) {
          toast.error(
            "You are connected to the wrong network. Please connect to the Telos Mainnet."
          );
        }
      });
    }
  }, []);
  return (
    <EvmContext>
      <Router>
        <ScrollToTop />
        <Header />
        <div className="w-full flex">
          <Nav />
          <Pages />
        </div>
        <Toaster position="top-center" />
      </Router>
    </EvmContext>
  );
}