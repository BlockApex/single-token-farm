import React from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import routes from "virtual:generated-pages-react";

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
export default function MantleApp() {
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
