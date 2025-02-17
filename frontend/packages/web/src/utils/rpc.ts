const nearNetwork = import.meta.env.VITE_NEAR_NETWORK;

interface DefaultRPCType {
  name: string;
  url: string;
  ping: number;
}

export const rpcData: DefaultRPCType[] =
  nearNetwork.toLowerCase() === "mainnet"
    ? [
      { name: "Lava RPC", url: "https://near.lava.build", ping: 0 },
      {
        name: "Official NEAR RPC",
        url: "https://rpc.mainnet.near.org",
        ping: 0,
      },
      {
        name: "Fast Near RPC",
        url: "https://free.rpc.fastnear.com",
        ping: 0,
      },
    ]
    : [
      {
        name: "Official NEAR RPC",
        url: "https://rpc.testnet.near.org",
        ping: 447,
      },
    ];
