import { connect, keyStores } from "near-api-js";
import { TokenMetadataType } from "./types";

export const nearNetwork = import.meta.env.VITE_NEAR_NETWORK;

type INearConfigs = {
  networkId: string;
  nodeUrl: string;
  helperUrl: string;
  explorerUrl: string;
};

const mainnetConfig = {
  networkId: "mainnet",
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: "https://near.lava.build",
  walletUrl: "https://wallet.near.org",
  helperUrl: "https://api.kitwallet.app",
  explorerUrl: "https://nearblocks.io",
};

const testnetConfig = {
  networkId: "testnet",
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://testnet.mynearwallet.com/",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://testnet.nearblocks.io",
};

export const config = {
  testnet: testnetConfig,
  mainnet: mainnetConfig,
};

// Retrieve the selectedRPC value from localStorage (if it exists)
const selectedRPC = (() => {
  try {
    return JSON.parse(localStorage.getItem("selectedRPC") || "{}");
  } catch {
    return {};
  }
})();

// Use the selectedRPC URL if available; otherwise, use the default nodeUrl
export const rpcUrl =
  selectedRPC?.url && selectedRPC?.url !== "" ? selectedRPC.url : config[nearNetwork].nodeUrl;

  

// Create the nearConfigs object dynamically with the updated RPC URL
export const nearConfigs = {
  ...config[nearNetwork],
  nodeUrl: rpcUrl, // Override the default nodeUrl with the selectedRPC URL if it exists
};

export const RPC = nearConfigs.nodeUrl; // Export the final RPC URL

/**
 * Connect to NEAR with the given config
 * @param config Configuration for NEAR connection
 * @returns NEAR instance
 */
export const connectDefaultNear = async (config) => {
  const near = await connect(config);
  return near;
};


export const tokens_without_images = [
  {
    icon:"https://s2.coinmarketcap.com/static/img/coins/64x64/11808.png",
    symbol:"wNEAR"
  },
  {
    icon:"https://img.ref.finance/images/2396.png",
    symbol:"WETH"
  },
  {
    icon:"https://img.ref.finance/images/8104.png",
    symbol:"1INCH"
  },
  {
    icon:"https://img.ref.finance/images/6719.png",
    symbol:"GRT"
  },
  {
    icon:"https://img.ref.finance/images/2502.png",
    symbol:"HT"
  },
  {
    icon:"https://img.ref.finance/images/10052.png",
    symbol:"GTC"
  },
  {
    icon:"https://img.ref.finance/images/sFRAX_coin.svg",
    symbol:"sFRAX"
  },
  {
    icon:"https://img.ref.finance/images/SOLWormhole.svg",
    symbol:"SOL"
  },
  {
    icon:"https://ref-new-1.s3.amazonaws.com/token/05572f4bf6b5cede28daa0cf039769dc.svg",
    symbol:"USDC"
  },
  {
    icon:"https://img.ref.finance/images/truNEAR-logo.svg",
    symbol:"TruNEAR"
  },
  {
    icon:"https://assets.coingecko.com/coins/images/53347/standard/POP.jpg?1736173283",
    symbol:"PRESENCE"
  }
]

/**
 * Fetch whitelisted tokens from Ref Finance
 * @param near NEAR instance
 * @returns List of whitelisted tokens with metadata
 */
export const getWhitelistedTokens = async (near) => {
  const refContractId =
    nearNetwork === "mainnet" ? "v2.ref-finance.near" : "ref-finance-101.testnet";

  const account = await near.account(refContractId);
  const tokens = await account.viewFunction(
    refContractId,
    "get_whitelisted_tokens",
    {}
  );

  const metadataExtractedTokens: TokenMetadataType[] = [];

  if (tokens) {
    for (const token of tokens) {
      try {
        const metadata = await account.viewFunction(token, "ft_metadata", {});
        if (metadata) {
          let _token = { ...metadata, address: token };
          if(!metadata.icon){
            let _icon  = tokens_without_images.find((t)=>t.symbol === _token.symbol)?.icon;
            _token = {..._token , icon:_icon};
          }
          metadataExtractedTokens.push(_token);
        }
      } catch (error) {
        continue;
      }
    }
  }
  return metadataExtractedTokens;
};
