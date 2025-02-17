import React, { Suspense, useEffect } from "react";
import { buildClient } from "../resolvers";
import { WalletSelectorModal } from "@/modals";
import { WalletSelectorContextProvider } from "@/context/wallet-selector";
import { ProviderNear } from "../hooks/near";
import { ApolloProvider } from "@apollo/client";
import App from "../app";
import MantleApp from "@/mantle-app";
import TelosApp from "@/telos-app";

interface ChainSelectorContextValue {
  chain: string;
  setChain: (chain: string) => void;
}

const ChainSelectorContext =
  React.createContext<ChainSelectorContextValue | null>(null);

export function ChainSelectorContextProvider({
  children,
}: {
  children?: React.ReactNode | React.ReactNode[];
}) {
  const [chain, setChain] = React.useState(
    localStorage.getItem("selected-chain") || "near"
  );

  useEffect(() => {
    localStorage.setItem("selected-chain", chain);
    //reload with clean url
  }, [chain]);
  return (
    <ChainSelectorContext.Provider value={{ chain, setChain }}>
      <WalletSelectorContextProvider>
        <ProviderNear
          environment={import.meta.env.VITE_NEAR_NETWORK || "testnet"}
        >
          {chain === "near" && (
            <ApolloProvider
              client={buildClient(import.meta.env.VITE_GRAPHQL_API_URI)}
            >
              <Suspense fallback={<p>Loading...</p>}>
                <App />
              </Suspense>
              <WalletSelectorModal />
            </ApolloProvider>
          )}

          {chain === "mantle" && <MantleApp />}
          {/*   {chain === "telos-testnet" && <TelosTestnetApp />} */}
          {chain === "telos" && <TelosApp />}
        </ProviderNear>
      </WalletSelectorContextProvider>
    </ChainSelectorContext.Provider>
  );
}

export function useChainSelector() {
  const context = React.useContext(ChainSelectorContext);

  if (!context) {
    throw new Error(
      "useChainSelector must be used within a ChainSelectorContextProvider"
    );
  }

  return context;
}
