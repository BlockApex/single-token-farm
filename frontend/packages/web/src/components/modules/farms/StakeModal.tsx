import { useState, useEffect } from "react";
import { utils } from "near-api-js";
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
import { Token } from "@/assets/svg/token";
import Tokens from "@/components/modules/pools/Tokens";
import { useWalletSelector } from "@/context/wallet-selector";
import { InfoTooltip, TokenLogos, TokenLogo } from "@/components/shared";
import { RoundCross, BigChevron } from "@/assets/svg";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import Duration from "./Duration";
import { useGetUserShare } from "@/hooks/modules/pools"
import { BigNumber } from "bignumber.js";
import {
  calculateLPPercentage,
  lpReadableValue,
  LP_TOKEN_DECIMALS,
} from "@/utils/pool-utils";
import { toNonDivisibleNumber, formatNumberWithSuffix, exponentialToDecimal, formatValueInDecimals } from "@/utils/conversion";
import toast from "react-hot-toast";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import {
  Transaction,
  Action,
  FunctionCallAction,
} from "@near-wallet-selector/core";
import TokenWithSymbol from "./Token";

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
      <p className="text-white-400" >
        <b>Tutorial Tips:</b> Add LP tokens to the Farm below.
      </p>
    </div>
  );
};


const StakeModal = ({
  open,
  setOpen,
  farm,
  staked
}: {
  open: boolean;
  farm: any;
  setOpen: (open: boolean) => void;
  staked: string
}) => {
  const { accountId, selector } = useWalletSelector();
  const { account } = useRPCStore();
  const [show, setShow] = useState(false);
  const [duration, setDuration] = useState(1);
  const [lp, setLp] = useState('');
  const [rewards, setRewards] = useState<any[]>([])
  const [roi, setRoi] = useState("")
  const [balance, setBalance] = useState("0");
  const [token, setToken] = useState<any>(null);



  const onMaxClick = () => {
    setLp(balance);
  };


  useEffect(() => {
    const total_staked = staked;

    if (lp) {
      const stakedAmount = new BigNumber(lp);
      const totalStakedLP = new BigNumber(total_staked);
      const durationInWeeks = duration * 4.345;

      let totalRewards = new BigNumber(0);

      // Calculate rewards for each reward token
      const rewards = Object.values(farm?.reward_tokens)?.map((item: any) => {
        const rewardPerWeek = new BigNumber(lpReadableValue(item?.decimals, new BigNumber(item?.reward_per_week)));
        console.log(rewardPerWeek.toString(), totalStakedLP.toString(), stakedAmount.toString())
        let rewardAmount = new BigNumber(0);
        if (totalStakedLP.isGreaterThan(0)) {
          rewardAmount = rewardPerWeek.dividedBy(totalStakedLP).multipliedBy(stakedAmount).multipliedBy(durationInWeeks);
        }
        console.log(rewardAmount.toString())

        // Add to total rewards
        totalRewards = totalRewards.plus(rewardAmount);

        return {
          ...item,
          value: rewardAmount.toString(), // Add calculated reward amount to the item
        };
      });

      setRewards(rewards);

      // Calculate ROI
      let investmentValue = stakedAmount;
      let ROI = investmentValue.isGreaterThan(0) ? totalRewards.dividedBy(investmentValue).multipliedBy(100) : new BigNumber(0);
      setRoi(ROI.toString())

    } else {
      const rewards = Object.values(farm?.reward_tokens)?.map((item: any) => ({ ...item, value: "-" }));
      setRewards(rewards);
    }
  }, [lp, duration, farm]);




  const registerAccountTx = async (): Promise<Transaction | null> => {
    const contract = accounts.FARM;
    const gas = "300000000000000";
    const deposit = utils.format.parseNearAmount("0.1") as string;
    try {

      const storageCheck = await account!.viewFunction(
        contract,
        "storage_balance_of",
        {
          account_id: accountId!,
        }
      );
      if (!storageCheck) {
        const actions: FunctionCallAction[] = [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: accountId,
                registration_only: true,
              },
              gas,
              deposit,
            },
          },
        ];

        const transaction: Transaction = {
          signerId: accountId as string, // Ensure accountId is not null
          receiverId: contract,
          actions: actions,
        };

        return transaction;
      } else {
        return null
      }
    } catch (err) {
      console.log(err, "REGISTER ERROR")
      return null
    }
  };

  const registerContractTx = async (tokenId: string): Promise<Transaction | null> => {
    const contract = accounts.AMM; // Assuming this is your AMM contract
    const gas = "300000000000000"; // Same gas limit as addLiquidity
    const deposit = "820000000000000000000"; // Increase deposit to required amount
    try {
      const storageCheck = await account!.viewFunction(
        accounts.AMM,
        "mft_has_registered",
        {
          token_id: tokenId,
          account_id: accounts.FARM,
        }
      );
      console.log(storageCheck, "FINALSTORAGE")

      if (!storageCheck) {
        const actions: FunctionCallAction[] = [
          {
            type: "FunctionCall",
            params: {
              methodName: "mft_register",
              args: {
                token_id: tokenId,
                account_id: accounts.FARM,
              },
              gas,
              deposit,
            },
          },
        ];

        const transaction: Transaction = {
          signerId: accountId as string, // Ensure accountId is not null
          receiverId: contract,
          actions: actions,
        };

        return transaction;
      } else {
        return null
      }
    } catch (err) {
      console.log(err, "REGISTER ERROR")
      return null
    }


  };

  const storageTx = (): Transaction => {
    const contract = accounts.AMM;
    const gas = "300000000000000";
    const deposit = utils.format.parseNearAmount("0.00125") as string;
    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall",
        params: {
          methodName: "storage_deposit",
          args: {},
          gas,
          deposit,
        },
      },
    ];

    const transaction: Transaction = {
      signerId: accountId as string, // Ensure accountId is not null
      receiverId: contract,
      actions: actions,
    };
    return transaction;
  }

  const storageTxFarm = (): Transaction => {
    const contract = accounts.FARM;
    const gas = "300000000000000";
    const deposit = utils.format.parseNearAmount("0.01") as string;
    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall",
        params: {
          methodName: "storage_deposit",
          args: {},
          gas,
          deposit,
        },
      },
    ];

    const transaction: Transaction = {
      signerId: accountId as string, // Ensure accountId is not null
      receiverId: contract,
      actions: actions,
    };
    return transaction;
  }



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


  const stakeTx = (
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
            msg: `STAKE:${farmId}`,
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

  const handleStake = async () => {
    if (!lp) {
      toast.error("Enter Amount");
      return
    }

    if (parseFloat(lp) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }


    if (new BigNumber(lp).gt(new BigNumber(balance))) {
      toast.error("Not enough balance");
      return;
    }

    let transactions: Transaction[] = [];

    let _shares = toNonDivisibleNumber(token.decimals, lp)
    let tx = await registerAccount(token?.address);
    if (tx) {
      transactions.push(tx);
    }
    let tx3 = stakeTx(token?.address, _shares, farm?.farm_id);
    transactions.push(tx3);

    try{
      await (
        await selector.wallet()
      ).signAndSendTransactions({
        transactions,
      });
    }catch(err){
      console.log(err , "stake.error")
    }

  }


  const checkDisabaled = () => {
    if (new BigNumber(lp).gt(new BigNumber(balance))) {
      return true;
    }
    return false;
  }


  const handleKeyDown = (e: any) => {
    if (e.key === '-') {
      e.preventDefault();
    }
  };

  const handleClose = () => {
    setLp("");
    setDuration(1);
    setOpen(false)
  }


  const getMetadata = async (tokenAddress) => {
    if (!tokenAddress || !account) return;

    try {
      const metadata = await account?.viewFunction(tokenAddress, "ft_metadata", {});
      setToken({...metadata , address:tokenAddress});
    } catch (error) {
      console.error("Failed to fetch token metadata:", error);
    }
  };

  useEffect(() => {
    if (account && farm?.staking_token) {
      getMetadata(farm.staking_token);
    }
  }, [account, farm]);



  const getBalance = async () => {
    try {
      if (account && accountId) {
        let isNear = token.isNear;
        let balance;
        if (isNear === true) {
          balance = (await account.getAccountBalance()).available;
        } else {
          try {
            balance = await account.viewFunction(
              farm.staking_token,
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
    } catch (error) {
      console.log(error, "UNDERERROR")
    }
  };

  useEffect(() => {
    if (token) {
      getBalance();
    }
  }, [token]);


  return (
    <Modal isCentered isOpen={open} onClose={handleClose}>
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
              Stake
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
            {/* Token section */}

            <div className="w-full flex items-center justify-between">
              <section className="flex items-center">
                <TokenWithSymbol address={farm.staking_token} />
              </section>
              <p>
                {token
                  ? `Balance: ${Number(balance) < 1
                    ? formatNumberWithSuffix(Number(balance))
                    : formatNumberWithSuffix(Number(balance))
                  }`
                  : "Balance: 0"}
              </p>
            </div>

            {/* Input section */}
            <div className="w-full rounded-lg bg-[#ffffff1a]  p-3 mt-4  md:mt-6">
              <input
                className="w-full bg-transparent text-white font-bold 
            text-md md:text-lg placeholder-white placeholder-opacity-70 border-none 
            focus:border-white 
            focus:outline-none 
            focus:ring-0 
            hover:border-none text-right pr-0"
                placeholder="0.0"
                type="number"
                min={0}
                value={lp}
                onChange={(e) => setLp(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex items-center justify-end">
                <button
                  onClick={onMaxClick}
                  className=" text-white-400 font-bold text-md">
                  Max
                </button>
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
              onClick={handleStake}
              isDisabled={checkDisabaled()}

            >
              <Text sx={{ ...gradientStyle, fontSize: "24px" }}>Stake</Text>
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default StakeModal;
