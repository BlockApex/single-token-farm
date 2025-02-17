import { TopCard } from "@/components";
import PageContainer from "@/components/PageContainer";
import { Flex } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { etherUnits } from "viem";
import { Address, erc20ABI, useContractWrite } from "wagmi";
import { usePrepareContractWrite } from "wagmi";
import { JumpIcon } from "@/assets/svg/jump-logo";
export default function Faucet() {
  const TokenList = [
    {
      name: "Telos JUMP",
      address: "0x22Cc51D80E35Ea39cf2397DBBF78E46250F7c2ab",
      logo: "https://pbs.twimg.com/profile_images/1542962559963107328/o4ACEmqH_400x400.jpg",
    },
    {
      name: "JUSDC",
      address: "0x638e1Fb2248a409A5c1f6C19671A46F6e46cC25F",
      logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    },
    {
      name: "wETH",
      address: "0x153986de1deae3d3470219E056a3Db516e03af5b",
      logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    },
    {
      name: "T-Shiba",
      address: "0x60318245a7858324EC5e765e988d6bD1A0E05A35",
      logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Shiba_Inu_coin_logo.png",
    },
    {
      name: "T-DAI",
      address: "0x87D96C1711F93A81b0E75DEEDa9723D293c14384",
      logo: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png",
    },
    {
      name: "T-FC FAN TOKEN",
      address: "0xeC15d881177B465130b307596355243526D49a30",
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5225.png",
    },
  ];

  const [selectedToken, setSelectedToken] = useState(TokenList[0]);

  //extend erc20ABI with a faucet function function mint(uint256 amount) public

  const FaucetABI = [
    ...erc20ABI,
    {
      inputs: [
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "mint",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  const { config } = usePrepareContractWrite({
    abi: FaucetABI,
    address: selectedToken.address as Address,
    functionName: "mint",
    args: [ethers.parseEther("100")],
  });

  const { writeAsync } = useContractWrite(config);

  function addTokenToWallet(address: string, symbol: string, image: string) {
    const token = {
      type: "ERC20",
      options: {
        address: address,
        symbol: symbol,
        decimals: 18,
        image: image,
      },
    };
    //@ts-ignore
    window.ethereum.request({
      method: "wallet_watchAsset",
      params: token,
    });
  }

  return (
    <PageContainer>
      <TopCard
        bigText="Faucet"
        gradientText="Claim your tokens to test on Telos-Testnet"
        bottomDescription="Mint your favorite tokens to test on Telos-Testnet."
        jumpLogo
      />
      <div className="flex flex-wrap justify-center gap-4">
        {TokenList.map((token) => (
          <>
            <div className="w-[300px] h-[380px] bg-white/10 rounded-lg flex flex-col items-center justify-around">
              <img
                src={token.logo}
                className="h-[100px] w-[100px] rounded-full"
              />
              <p className="text-white text-2xl font-bold">{token.name}</p>
              <img
                className="rounded-full h-[50px] w-[50px] cursor-pointer hover:scale-110 transition-all duration-200 ease-in-out"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/512px-MetaMask_Fox.svg.png"
                onClick={() =>
                  addTokenToWallet(token.address, token.name, token.logo)
                }
              />
              <button
                onClick={() => {
                  setSelectedToken(token);
                  writeAsync?.();
                }}
                className="bg-white/20 rounded px-8 py-3 hover:bg-white/10 transition-all duration-200 ease-in-out"
              >
                Claim
              </button>
            </div>
          </>
        ))}
      </div>
    </PageContainer>
  );
}