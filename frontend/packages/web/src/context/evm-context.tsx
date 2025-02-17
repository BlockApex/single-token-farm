import "@rainbow-me/rainbowkit/styles.css";

import React, { useMemo } from "react";
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { Chain, configureChains, createConfig, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import {
  telosTestnet as telosTestnetRaw,
  telos as telosRaw,
} from "viem/chains";

export const RPC_URL = "https://rpc.mantle.xyz";

const mantle: Chain = {
  id: 5000,
  name: "Mantle",
  network: "mantle",
  nativeCurrency: {
    decimals: 18,
    name: "MNT",
    symbol: "$MNT",
  },
  //@ts-ignore
  iconUrl: "https://avatars.githubusercontent.com/u/110459454?s=280&v=4",
  iconBackground: "#fff",
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "SnowTrace", url: "https://snowtrace.io" },
    etherscan: { name: "SnowTrace", url: "https://snowtrace.io" },
  },
  testnet: true,
};

const telosTestnet: Chain = {
  ...telosTestnetRaw,
  name: "Telos Testnet",
  //@ts-ignore
  iconUrl:
    "https://assets-global.website-files.com/60ae1fd65f7b76f18ddd0bec/61044a5f70f5bbeb24b995ea_Symbol%202%402x.png",
};

const telos: Chain = {
  ...telosRaw,
  name: "Telos",
  //@ts-ignore
  iconUrl:
    "https://assets-global.website-files.com/60ae1fd65f7b76f18ddd0bec/61044a5f70f5bbeb24b995ea_Symbol%202%402x.png",
};

export function EvmContext({
  children,
}: {
  children?: React.ReactNode | React.ReactNode[];
}) {
  const {config, chains} = useMemo(() => {
    const { chains, publicClient } = configureChains(
      [telos, mantle, telosTestnet],
      [publicProvider()]
    );
    const { connectors } = getDefaultWallets({
      appName: "JumpDefi",
      chains,
      projectId: "25ec1fb7f72b633a77f7c8fb86ddbed9"
    });
    const wagmiConfig = createConfig({
      autoConnect: true,
      connectors: () => connectors().filter(c => c.id !== "walletConnectLegacy"),
      publicClient,
    });

    return { config: wagmiConfig, chains }
  }, [])

  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme({
          accentColor: "#7b3fe4",
          accentColorForeground: "white",
          borderRadius: "small",
          fontStack: "system",
          overlayBlur: "small",
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
