import { useState, useEffect } from "react";
import { utils } from "near-api-js";
import { Token } from "@/assets/svg/token";
import { RxTriangleDown } from "react-icons/rx";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Text,
  Collapse,
} from "@chakra-ui/react";
import Balance from "@/components/modules/Swap/Balance";
import TokenSelector from "@/components/TokenSelector";
import Tokens from "@/components/modules/pools/Tokens";
import { useWalletSelector } from "@/context/wallet-selector";
import { InfoTooltip, TokenLogos, TokenLogo } from "@/components/shared";
import { RoundCross, BigChevron } from "@/assets/svg";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import Duration from "./Duration";
import { useGetUserShare } from "@/hooks/modules/pools";
import { BigNumber } from "bignumber.js";
import {
  calculateLPPercentage,
  lpReadableValue,
  LP_TOKEN_DECIMALS,
} from "@/utils/pool-utils";
import {
  toNonDivisibleNumber,
  formatNumberWithSuffix,
  formatValueInDecimals,
} from "@/utils/conversion";
import toast from "react-hot-toast";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import {
  Transaction,
  Action,
  FunctionCallAction,
} from "@near-wallet-selector/core";

const gradientStyle = {
  background:
    "radial-gradient(circle, rgba(174,108,198,1) 65%, rgba(112,112,238,1) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
  display: "inline",
};

const TooltipContent = () => {
  return (
    <div className="p-2">
      <p className="text-white-400">
        <b>Tutorial Tips:</b> Deposit reward in farm.
      </p>
    </div>
  );
};

const AddReward = ({
  open,
  setOpen,
  farm,
}: {
  open: boolean;
  farm: any;
  setOpen: (open: boolean) => void;
}) => {

  const { accountId, selector } = useWalletSelector();
  const { account } = useRPCStore();
  const [token, setToken] = useState<any>(null);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [rewardTokens , setRewardTokens] = useState([]);

  const handleSetToken = (token: any) => {
    setToken(token);
    setTokenOpen(false);
  };

  const getBalance = async (token: any) => {
    try{
      if (account && accountId) {
        let isNear = token.isNear;
        let balance;
        if (isNear === true) {
          balance = (await account.getAccountBalance()).available;
        } else {
          try {
            balance = await account.viewFunction(
              token?.address,
              "ft_balance_of",
              {
                account_id: accountId,
              }
            );
          } catch (e) {
            console.log(e);
          }
        }
        const formattedBalance = formatValueInDecimals(
          balance,
          isNear ? 24 : token?.decimals
        );
        setBalance(formattedBalance);
      }
    }catch(error){
      console.log(error , "UNDERERROR")
    }
  };

  useEffect(() => {
    if (token) {
      getBalance(token);
    }
  }, [token]);




  const rewardTx = (
    token: string,
    amount: string,
    farmId: string
  ): Transaction => {
    
    const contract = accounts.SINGLE_FARM;
    const gas = "300000000000000";

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall", // Ensure TypeScript understands this as a FunctionCallAction
        params: {
          methodName: "ft_transfer_call",
          args: {
            receiver_id: contract,
            amount: amount,
            msg: `ADD_REWARD:${farmId}`,
          },
          gas,
          deposit: "1",
        },
      },
    ];

    const transaction: Transaction = {
      signerId: accountId as string, // Ensure accountId is not null
      receiverId: token,
      actions: actions,
    };
    return transaction;
  };


  const registerAccount = async (token: string): Promise<Transaction | null> => {
    const gas = "300000000000000";
    const contract = accounts.SINGLE_FARM;
    const deposit = utils.format.parseNearAmount("0.05") as string; // 0.1 NEAR deposit
    try {

      const storageCheck = await account!.viewFunction(
        token,
        "storage_balance_of",
        {
          account_id: contract!,
        }
      );

      if (!storageCheck) {
        let actions: FunctionCallAction[] = [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                registration_only: true,
                account_id: contract,
              },
              gas,
              deposit,
            },
          },
        ];
        let tx = {
          signerId: accountId!,
          receiverId: token,
          actions: actions,
        };

        return tx;
      } else {
        return null
      }
    } catch (err) {
      console.log(err, "REGISTER ERROR")
      return null
    }
  };

  const handleAddReward = async () => {
    if (!token) {
      toast.error("Please Select Token");
      return;
    }
    if (Number(amount) <= 0) {
      toast.error("Amount is Required");
      return;
    }
    if (Number(amount) > Number(balance)) {
      toast.error("Insufficient Balance");
      return;
    }
    let transactions: Transaction[] = [];
    let _amount = toNonDivisibleNumber(token?.decimals, amount);
    let tx = await registerAccount(token?.address);
    if (tx) {
      transactions.push(tx);
    }

    let tx0 = rewardTx(token?.address, _amount, farm?.farm_id);
    transactions.push(tx0);
    await (
      await selector.wallet()
    ).signAndSendTransactions({
      transactions,
    });
  };

  const handleKeyDown = (e: any) => {
    if (e.key === '-') {
      e.preventDefault();
    }
  };


  const getTokensMetadata = async (addresses) => {
    if (!addresses || addresses.length === 0) return;
  
    try {
      const metadataPromises = addresses.map((address) =>
        account?.viewFunction(address, "ft_metadata", {})
      );
  
      const metadataResults = await Promise.all(metadataPromises);
      console.log(metadataResults , "HELLO RESULT.....")
      // Combine addresses with metadata
      const tokensWithMetadata = addresses.map((address, index) => ({
        address,
        ...metadataResults[index], // Includes symbol, decimals, icon, etc.
      }));
      console.log(tokensWithMetadata , "tokensWithMetadata")
      setRewardTokens(tokensWithMetadata);
    } catch (error) {
      console.error("Failed to fetch token metadata:", error);
    }
  };
  
  useEffect(() => {
    if (farm?.reward_tokens?.length) {
      getTokensMetadata(farm.reward_tokens);
    }
  }, [farm]);

  return (
    <Modal isCentered isOpen={open} onClose={() => setOpen(false)}>
      <ModalOverlay />
      <ModalContent
        backgroundColor="#5F456A"
        maxW="600px"
        minW="400px"
        width="90%"
      >
        <ModalHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
              Add Reward
              <InfoTooltip label={<TooltipContent />}>
                <span className="ml-2 mt-1 ">
                  <QuestionMarkOutlinedIcon className="w-4 h-4" />
                </span>
              </InfoTooltip>
            </h2>
            <button onClick={() => setOpen(false)}>
              <RoundCross />
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="w-full h-auto relative">
            <div className="w-full h-auto  rounded-lg bg-[#ffffff1a] py-2 px-3">
              <p className="text-white-400 text-sm font-bold text-right pr-3 mb-2">
                {token
                  ? `Balance: ${Number(balance) < 1
                    ? formatNumberWithSuffix(Number(balance))
                    : formatNumberWithSuffix(Number(balance))
                  }`
                  : "Balance: 0"}
              </p>
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center justify-start">
                  <section
                    onClick={() => setTokenOpen(true)}
                    role="button"
                    className="bg-[#00000033] rounded-sm min-w-full  md:min-w-[185px] min-h-[36px] flex items-center justify-between p-2"
                  >
                    <div className="flex items-center justify-start">
                      {token && token?.icon ? (
                        <img className="w-[20px] h-[20px]" src={token?.icon} />
                      ) : (
                        <Token width={40} height={40} />
                      )}
                      <p className="text-[14px] md:text-[16px] text-white font-normal pl-2">
                        {token ? token?.symbol : "Select Token"}
                      </p>
                    </div>
                    <RxTriangleDown />
                  </section>
                </div>
                <section>
                  <input
                    className="bg-transparent 
                             text-white 
                              font-bold 
                              text-md md:text-lg placeholder-white placeholder-opacity-70 border-none 
                             focus:border-white 
                               focus:outline-none 
                               focus:ring-0 
                                  hover:border-none text-right"
                    placeholder="0.0"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={0}
                    onKeyDown={handleKeyDown}
                  />
                  <p className="text-white text-sm font-bold text-right pr-3 m-0">
                    {/* $10.00 */}
                  </p>
                </section>
              </div>
            </div>
            {/* Button section */}
            <Button
              bg="#2b011a"
              size="lg"
              width="full"
              height="54px"
              my={6}
              rounded="lg"
              fontWeight="bold"
              variant="outline"
              onClick={handleAddReward}
            // disabled={feeTierMessage || !token0 || !token1 ? true : false}
            >
              <Text sx={{ ...gradientStyle, fontSize: "24px" }}>
                Add Reward
              </Text>
            </Button>
          </div>
          <RewardTokenList
            open={tokenOpen}
            setOpen={setTokenOpen}
            tokens={rewardTokens}
            setToken={handleSetToken}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddReward;

export const RewardTokenList = ({ open, setOpen, tokens, setToken }) => {
  const { account } = useRPCStore();

  return (
    <Modal isCentered isOpen={open} onClose={() => setOpen(false)}>
      <ModalOverlay />
      <ModalContent
        backgroundColor="#5F456A"
        maxW="600px"
        minW="400px"
        width="90%"
      >
        <ModalHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
              Select Token
              <InfoTooltip label={<TooltipContent />}>
                <span className="ml-2 mt-1 ">
                  <QuestionMarkOutlinedIcon className="w-4 h-4" />
                </span>
              </InfoTooltip>
            </h2>
            <button onClick={() => setOpen(false)}>
              <RoundCross />
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="w-full h-auto relative">
            {tokens.length ? tokens?.map((token: any, i: number) => {
              let updatedToken = { ...token, address: token?.reward_token };
              return (
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => setToken(token)}
                  >
                    {token?.icon ? (
                      <img
                        src={token?.icon}
                        style={{ height: "28px", width: "28px" }}
                        className="mr-2 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
                    )}
                    <Text fontSize={16}>{token?.symbol}</Text>
                  </div>
                  <Text
                    fontSize="14px"
                    height="20px"
                    color="#9c94a7"
                    fontWeight="bold"
                    textAlign="right"
                  >
                    {/* $_${token.rate} */}
                    <Balance connectedAccount={account} token={updatedToken} />
                  </Text>
                </div>
              );
            }):(
              <div className="flex items-center justify-center mt-8 mb-8" >
              <Text fontWeight="extrabold">You don't have any reward token to deposit</Text>
            </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
