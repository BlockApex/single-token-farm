import React, { useEffect, useState } from "react";
import { utils } from "near-api-js";
import { BigNumber } from "bignumber.js";
import {
  Transaction,
  Action,
  FunctionCallAction,
} from "@near-wallet-selector/core";
import toast from "react-hot-toast";
import { useWalletSelector } from "@/context/wallet-selector";
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
import { useNavigate } from "react-router";
import { FeeTier, TokenLogo, InfoTooltip } from "@/components/shared";
import { RoundCross, Open, BigChevron } from "@/assets/svg";
import { IconButton } from "@/components";
import { TokenLogos, TableBody, Td, Checkbox } from "@/components/shared";
import TokenWithInput from "@/components/TokenWithInput";
import { Token } from "@/assets/svg/token";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import {
  calculateLPPercentage,
  lpReadableValue,
  LP_TOKEN_DECIMALS,
} from "@/utils/pool-utils";
import { toNonDivisibleNumber, toReadableNumber , toPrecision , scientificNotationToString} from "@/utils/conversion";
import { useRemoveLiquidity } from "@/hooks/modules/pools";
import { useGetStakedBalance } from "@/hooks/modules/farms";

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
        Remove liquidity from your active pools. Note: You must remove LP tokens
        from farms before being able to remove liquidity from pools.
      </p>
    </div>
  );
};

const  RemoveLiquidity = ({
  lps,
  pool,
  open,
  setOpen,
}: {
  lps: string;
  pool: any;
  open: boolean;
  setOpen: () => void;
}) => {
  const navigate = useNavigate()
  let lpBig = new BigNumber(lps);
  const { accountId, selector } = useWalletSelector();
  const { account } = useRPCStore();
  const [slippage, setSlippage] = useState(0.1);
  const [lp, setLp] = useState("");
  const [token0Amount, setToken0Amount] = useState("0");
  const [token1Amount, setToken1Amount] = useState("0");
  const { amounts, token0, token1, shares_total_supply, tvl , id} = pool; 
  let seed_id = `${accounts.AMM}@${id}`;
  const { balance, error, loading } = useGetStakedBalance(
    accountId!,
    seed_id 
  );
  let balanceBig = new BigNumber(balance);

  const onLpChange = () => {
    const enteredLp = new BigNumber(toNonDivisibleNumber(LP_TOKEN_DECIMALS, lp));
    const totalLPSupply = new BigNumber(shares_total_supply);
  
    // Calculate the pool share (enteredLp / totalLPSupply)
    const poolShare = enteredLp.dividedBy(totalLPSupply);
  
    // Calculate the raw amount of token0 and token1 to be removed
    const token0AmountToRemoveRaw = poolShare.multipliedBy(new BigNumber(amounts[0]));
    const token1AmountToRemoveRaw = poolShare.multipliedBy(new BigNumber(amounts[1]));
  
    // Apply slippage: reduce the amount by the slippage percentage
    const token0AmountWithSlippage = token0AmountToRemoveRaw.minus(
      token0AmountToRemoveRaw.multipliedBy(slippage).dividedBy(100)
    );
  
    const token1AmountWithSlippage = token1AmountToRemoveRaw.minus(
      token1AmountToRemoveRaw.multipliedBy(slippage).dividedBy(100)
    );
  
    // Convert BigNumber to a number and handle decimals properly, keeping precision until conversion
    const token0AmountToRemove = token0AmountWithSlippage.dividedBy(
      new BigNumber(10).pow(token0.decimals || token0.decimal)
    );
  
    const token1AmountToRemove = token1AmountWithSlippage.dividedBy(
      new BigNumber(10).pow(token1.decimals || token1.decimal)
    );
  
    // Convert to fixed-point string and update state
    setToken0Amount(token0AmountToRemove.toFixed(2));
    setToken1Amount(token1AmountToRemove.toFixed(2));
  };
  

  useEffect(() => {
    if(lp){
      onLpChange();
    }
  }, [lp, slippage]);

  const onMaxClick = () => {
    BigNumber.config({ DECIMAL_PLACES: 24 });
    const value = new BigNumber(lps);
    const result = value.dividedBy(new BigNumber('10').pow(LP_TOKEN_DECIMALS));
    setLp(result?.toString());
  };



  const getRemoveTx = (id:number , shares:string, amounts:string[]):Transaction =>{
    const gas = "300000000000000";
    const contract = accounts.AMM;
    let actions: FunctionCallAction[] = [
      {
        type: "FunctionCall",
        params: {
          methodName: "remove_liquidity",
          args: {
            pool_id:id,
            shares,
            min_amounts:amounts
          },
          gas,
          deposit: "1",
        },
      },
    ];
    let tx = {
      signerId: accountId!,
      receiverId: contract,
      actions: actions,
    };

    return tx;
  }



  const withdrawTx = (token:string):Transaction =>{
    const gas = "300000000000000";
    const contract = accounts.AMM;
    let actions: FunctionCallAction[] = [
      {
        type: "FunctionCall",
        params: {
          methodName: "withdraw",
          args: {
            token_id: token,
            amount: "0",
            unregister: false,
          },
          gas,
          deposit: "1",
        },
      },
    ];
    let tx = {
      signerId: accountId!,
      receiverId: contract,
      actions: actions,
    };

    return tx;
  }

  const handleRemoveLiquidity = async () => {
        // Validation Checkes
    if (!parseFloat(lp)) {
          toast.error("Please enter amount");
          return;
    }
    BigNumber.config({ DECIMAL_PLACES: 24 });
    console.log(new BigNumber(lps).dividedBy(new BigNumber('10').pow(LP_TOKEN_DECIMALS)).toString())
    console.log(new BigNumber(lp).toString())
    if (new BigNumber(lp).gt(new BigNumber(lps).dividedBy(new BigNumber('10').pow(LP_TOKEN_DECIMALS)))) {
      toast.error("Not enough balance");
      return;
    }

    let id = Number(pool?.id)
    let shares = toNonDivisibleNumber(LP_TOKEN_DECIMALS, lp)
    let amount0 = toNonDivisibleNumber(token0.decimals || token0.decimal , token0Amount)  
    let amount1 =  toNonDivisibleNumber(token1.decimals || token1.decimal , token1Amount)

    // console.log(amount0, amount1 , token0, token1)

    let transactions: Transaction[] = [];
    const gas = "300000000000000";
    let rmTx = getRemoveTx(id , shares , [amount0, amount1]);
    transactions.push(rmTx)
    let withdrawTx0 = withdrawTx(token0.address || token0?.id);
    transactions.push(withdrawTx0)
    let withdrawTx1 = withdrawTx(token1.address || token1?.id);
    transactions.push(withdrawTx1)
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
    setToken0Amount("0");
    setToken1Amount("0");
    setSlippage(0);
    setOpen()
  }

  return (
    <Modal isCentered isOpen={open} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent
        backgroundColor="#5F456A"
        maxW="600px"
        minW="400px"
        width="90%"
        maxH="700"
        overflowY="scroll"
      >
        <ModalHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
              Remove Liquidity
              <InfoTooltip label={<TooltipContent />}>
                <span className="ml-2 mt-1">
                  <QuestionMarkOutlinedIcon className="w-4 h-4" />
                </span>
              </InfoTooltip>
            </h2>
            <button onClick={() => setOpen()}>
              <RoundCross />
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="w-full h-auto relative">
            <p className="text-[#9CA3AF] font-semibold text-sm">
              Remove tokens from a liquidity pool
            </p>
            {balance > 0 ? (
            <span className="bg-[#ffffff1a] text-white text-sm font-bold px-4 py-1 rounded-full mt-2 inline-block">
            {lpReadableValue(LP_TOKEN_DECIMALS, balanceBig)} LP Tokens in Farm
            <button  onClick={()=>navigate(`/farms/${seed_id}`)} className="pl-2">
              <Open />
            </button>
          </span>
            ):""}
            {/* Available Tokens Section */}
            <section className="w-full flex items-center justify-between mt-4">
              <p className="text-white-400 text-sm font-bold">
                Available LP Tokens
              </p>
              <p className="text-[#D1D5DB] text-sm font-bold">
                {lpReadableValue(LP_TOKEN_DECIMALS, lpBig)} {" "}
                ({calculateLPPercentage(lps, shares_total_supply)}%)
              </p>
            </section>
            {/* Input section */}
            <div className="w-full rounded-lg bg-[#ffffff1a]  p-3 mt-4  md:mt-6">
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
              <div className="flex items-center justify-end">
                <button
                  onClick={onMaxClick}
                  className=" text-[#D1D5DB] font-bold text-md"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Slippage  */}
            <section className="w-full flex items-center justify-between mt-4  md:mt-6">
              <p className="text-white-400 text-sm font-bold">
                Slippage tolerance
              </p>
              <div className="md:w-[60%] flex items-center justify-end">
                <FeeTier
                  hasInput={false}
                  feeTier={slippage}
                  setFeeTier={setSlippage}
                />
              </div>
            </section>
            {/* Minimum Recieved  */}
            <section className="mt-4  md:mt-6">
              <p className="text-white-400 text-sm font-bold">
                Minimum Received
              </p>
              <div className="flex items-center justify-evenly mt-4">
                <div className="flex flex-col items-center justify-center">
                  {token0?.icon ? (
                    <img
                      src={token0?.icon}
                      className="w-12 h-12 rounded-full -mt-1"
                    />
                  ) : (
                    <Token width={50} height={50} className="" />
                  )}
                  <h6 className="text-lg tracking-tighter font-bold leading-6 mt-4">
                    {token0?.symbol}
                  </h6>
                  <h6 className="text-lg tracking-tighter font-bold leading-6">
                    {token0Amount}
                  </h6>
                </div>
                <div className="flex flex-col items-center justify-center">
                  {token1?.icon ? (
                    <img
                      src={token1?.icon}
                      className="w-12 h-12 rounded-full -mt-1"
                    />
                  ) : (
                    <Token width={50} height={50} className="" />
                  )}
                  <h6 className="text-lg tracking-tighter font-bold leading-6 mt-4">
                    {token1?.symbol}
                  </h6>
                  <h6 className="text-lg tracking-tighter font-bold leading-6">
                    {token1Amount}
                  </h6>
                </div>
              </div>
            </section>

            {/* Warning section */}
            {/* <section className="flex items-center justify-center mt-4 md:mt-6">
              <div className="mr-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <g clip-path="url(#clip0_334_4353)">
                    <path
                      d="M9 1.5C13.1423 1.5 16.5 4.85775 16.5 9C16.5 13.1423 13.1423 16.5 9 16.5C4.85775 16.5 1.5 13.1423 1.5 9C1.5 4.85775 4.85775 1.5 9 1.5ZM9 3C7.4087 3 5.88258 3.63214 4.75736 4.75736C3.63214 5.88258 3 7.4087 3 9C3 10.5913 3.63214 12.1174 4.75736 13.2426C5.88258 14.3679 7.4087 15 9 15C10.5913 15 12.1174 14.3679 13.2426 13.2426C14.3679 12.1174 15 10.5913 15 9C15 7.4087 14.3679 5.88258 13.2426 4.75736C12.1174 3.63214 10.5913 3 9 3ZM9 11.25C9.19891 11.25 9.38968 11.329 9.53033 11.4697C9.67098 11.6103 9.75 11.8011 9.75 12C9.75 12.1989 9.67098 12.3897 9.53033 12.5303C9.38968 12.671 9.19891 12.75 9 12.75C8.80109 12.75 8.61032 12.671 8.46967 12.5303C8.32902 12.3897 8.25 12.1989 8.25 12C8.25 11.8011 8.32902 11.6103 8.46967 11.4697C8.61032 11.329 8.80109 11.25 9 11.25ZM9 4.5C9.19891 4.5 9.38968 4.57902 9.53033 4.71967C9.67098 4.86032 9.75 5.05109 9.75 5.25V9.75C9.75 9.94891 9.67098 10.1397 9.53033 10.2803C9.38968 10.421 9.19891 10.5 9 10.5C8.80109 10.5 8.61032 10.421 8.46967 10.2803C8.32902 10.1397 8.25 9.94891 8.25 9.75V5.25C8.25 5.05109 8.32902 4.86032 8.46967 4.71967C8.61032 4.57902 8.80109 4.5 9 4.5Z"
                      fill="#CD7FF0"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_334_4353">
                      <rect width="18" height="18" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <Text
                sx={{ ...gradientStyle, fontSize: "14px", fontWeight: "600" }}
              >
                Warning: Not able to withdraw inputted amount
              </Text>
            </section> */}
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
              onClick={handleRemoveLiquidity}
            >
              <Text sx={{ ...gradientStyle, fontSize: "24px" }}>
                Remove Liquidity
              </Text>
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RemoveLiquidity;
