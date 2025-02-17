import { useEffect, useState } from "react";
import { add, differenceInSeconds } from 'date-fns';
import { utils } from "near-api-js";
import { BigNumber } from "bignumber.js";
import {
  Transaction,
  Action,
  FunctionCallAction,
} from "@near-wallet-selector/core";
import Tokens from "@/components/modules/pools/Tokens";
import toast from "react-hot-toast";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Image,
  Button,
  Text,
  Collapse,
} from "@chakra-ui/react";
import { useWalletSelector } from "@/context/wallet-selector";
import { RoundCross, Open, BigChevron } from "@/assets/svg";
import { IconButton } from "@/components";
import {
  TokenLogos,
  TableBody,
  Td,
  Checkbox,
  InfoTooltip,
} from "@/components/shared";
import TokenWithInput from "@/components/TokenWithInput";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import {
  toNonDivisibleNumber,
  toReadableNumber,
  toLowestDenomination,
  calculateFairShare,
  formatValueInDecimals,
  formatNumberWithSuffix,
  percent,
  scientificNotationToString,
  toPrecision,
} from "@/utils/conversion";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import {
  calculateLPPercentage,
  lpReadableValue,
  LP_TOKEN_DECIMALS,
} from "@/utils/pool-utils";

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
        <b>Tutorial Tips:</b> Add tokens to liquidity pool below. Reminder that
        initial liquidity deposit determine token price ratio.
      </p>
      <p className="text-white-400 mt-4">
        <b>Warning: </b>Impermanent loss may result from change in token ratio.
      </p>
    </div>
  );
};

const Lock = ({ open, setOpen, lps, pool }) => {
  const { accountId, selector } = useWalletSelector();
  const { account } = useRPCStore();

  let lpBig = new BigNumber(lps);
  const [lp, setLp] = useState("");
  const [months, setMonths] = useState("");

  const { amounts, token0, token1, shares_total_supply, tvl , id} = pool;

  const onMaxClick = () => {
    let maxLps = Number(lps) / 10 ** LP_TOKEN_DECIMALS;
    setLp(maxLps.toString());
  };

  const monthsToSeconds = (months: number): number => {
    const currentDate = new Date();
    const futureDate = add(currentDate, { months }); // Add the specified number of months
    
    // Get the future timestamp in seconds (milliseconds / 1000)
    const futureTimestampInSeconds = Math.floor(futureDate.getTime() / 1000);
    
    return futureTimestampInSeconds;
  };


  
  const lockTx = (
    amount: string,
    tokenId: string,
    unlockTime: number
  ): Transaction => {
    const contract = accounts.AMM; // Assuming this is your AMM contract
    const gas = "300000000000000"; // Same gas limit as addLiquidity
    const deposit = "1"; // No deposit required for this call
    const msg = {
      Lock: {
        unlock_time_sec: unlockTime,
      },
    };
    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall",
        params: {
          methodName: "mft_transfer_call",
          args: {
            receiver_id: accounts.TOKEN_LOCKING,
            token_id: tokenId,
            amount: amount,
            msg:JSON.stringify(msg),
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
  };


  const registerTx = async (tokenId:string): Promise<Transaction | null> =>{
    const contract = accounts.AMM; // Assuming this is your AMM contract
    const gas = "300000000000000"; // Same gas limit as addLiquidity
    const deposit = "900000000000000000000"; // No deposit required for this call
    try{
      const storage = await account!.viewFunction(
        accounts.AMM,
        "mft_has_registered",
        {
          token_id: tokenId,
          account_id: accounts.TOKEN_LOCKING, // Add this field

        }
      );

      if(!storage){
        const actions: FunctionCallAction[] = [
          {
            type: "FunctionCall",
            params: {
              methodName: "mft_register",
              args: {
                token_id: tokenId,
                account_id: accounts.TOKEN_LOCKING,
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
      }else{
        return null
      }
    }catch(e){
      console.log(e , "REGISTER ERROR")
      return null
    }

  }


  const registerAccount =  (): Transaction =>{
    const contract = accounts.TOKEN_LOCKING; // Assuming this is your AMM contract
    const gas = "300000000000000"; // Same gas limit as addLiquidity
    const deposit = utils.format.parseNearAmount("0.1") as string; // 0.1 NEAR deposit
    const actions: FunctionCallAction[] = [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id:accountId
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
      
  }


  const handleLock = async () => {
    if (!lp) {
      toast.error("Enter Amount");
      return;
    }
    if(parseFloat(lp) > Number(lps) / 10 ** LP_TOKEN_DECIMALS){
      toast.error("Not enough balance ");
      return;
    }
    if(Number(months) <= 0){
      toast.error("Lock Period is required");
      return
    }
    if(Number(months) > 12 || Number(months) < 1){
      toast.error("Months should be between 1 to 12");
      return
    }
    let transactions: Transaction[] = [];
    let shares = toNonDivisibleNumber(LP_TOKEN_DECIMALS, lp)
    let time = monthsToSeconds(Number(months))
    let tx0 = registerAccount();
    transactions.push(tx0)
    let tx1 = await registerTx(`:${id}`);
    if(tx1){
      transactions.push(tx1)
    }
    let tx2 = lockTx(shares, `:${id}`,time )
    transactions.push(tx2);
    await (
      await selector.wallet()
    ).signAndSendTransactions({
      transactions,
    });
  };

  const handleKeyDown = (e:any) => {
    if (e.key === '-') {
      e.preventDefault();
    }
  };

  const handleClose = () => {
    setLp("")
    setMonths("")
    setOpen(false)
  }

  return (
    <Modal isCentered isOpen={open} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent
        backgroundColor="#5F456A"
        maxW="600px"
        minW="400px"
        width="90%"
        // maxH="800"
        // overflowY="scroll"
        // marginTop={10}
      >
        <ModalHeader>
          <div className="flex items-center justify-between mt-4">
            <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
              Lock LP
              <InfoTooltip label={<TooltipContent />}>
                <span className="ml-2 mt-1">
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
            {/* Available Tokens Section */}
            <section className="w-full flex items-center justify-between">
              <p className="text-white-400 text-sm font-bold">Balance</p>
              <p className="text-[#D1D5DB] text-sm font-bold">
                {lpReadableValue(LP_TOKEN_DECIMALS, lpBig)}
              </p>
            </section>
            {/* Input Section */}
            <div className="w-full rounded-lg bg-[#ffffff1a]  p-3 mt-4">
              <section className="flex items-center">
                <Tokens token0={token0} token1={token1} showSymbol={false} />
                <input
                  className="
                w-full
                bg-transparent 
                text-[rgba(255, 255, 255, 0.90);] 
                font-bold 
                text-md md:text-lg placeholder-white placeholder-opacity-70 border-none 
              focus:border-white 
                focus:outline-none 
                focus:ring-0 
                hover:border-none text-right pr-0"
                  placeholder="0.0"
                  type="number"
                  value={lp}
                  onChange={(e) => setLp(e.target.value)}
                  min={0}
                  
                  onKeyDown={handleKeyDown}
                />
              </section>
              <div className="flex items-center justify-end">
                <button
                  onClick={onMaxClick}
                  className=" text-[#D1D5DB] font-bold text-md"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Lock Period Section */}
            <br />
            <p className="text-white-400 text-sm font-bold">Lock Period</p>
            <div className="w-full rounded-lg bg-[#ffffff1a]  p-2 mt-4">
              <section className="flex items-center justify-between">
                <input
                  className="
                w-full
                bg-transparent 
                text-[rgba(255, 255, 255, 0.90);] 
                font-bold 
                text-md md:text-lg placeholder-white placeholder-opacity-70 border-none 
              focus:border-white 
                focus:outline-none 
                focus:ring-0 
                hover:border-none text-left pr-0"
                  placeholder="0"
                  type="number"
                  value={months}
                  onChange={(e) => {
                    const value = Math.floor(parseFloat(e.target.value));
                    setMonths(value.toString())
                  }}
                  min={1}
                  onKeyDown={handleKeyDown}
                />
                <p className="text-[rgba(255, 255, 255, 0.70)] font-bold text-sm pr-4">
                  {Number(months) > 1 ? "Months" : "Month"}
                </p>
              </section>
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
              onClick={handleLock}
            >
              <Text sx={{ ...gradientStyle, fontSize: "24px" }}>Lock</Text>
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default Lock;
