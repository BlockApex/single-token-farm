import { useState } from "react";
import { add } from 'date-fns';
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
    Button,
    Text,
} from "@chakra-ui/react";
import { useWalletSelector } from "@/context/wallet-selector";
import { RoundCross } from "@/assets/svg";
import {
    InfoTooltip,
} from "@/components/shared";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import {
    toNonDivisibleNumber,
} from "@/utils/conversion";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import {
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

const UnLock = ({ open, setOpen, lps, pool }) => {
    const { accountId, selector } = useWalletSelector();
    const { account } = useRPCStore();

    let lpBig = new BigNumber(lps);
    const [lp, setLp] = useState("");

    const { token0, token1, id } = pool;

    const onMaxClick = () => {
        let maxLps = Number(lps) / 10 ** LP_TOKEN_DECIMALS;
        setLp(maxLps.toString());
    };

    const handleKeyDown = (e: any) => {
        if (e.key === '-') {
            e.preventDefault();
        }
    };

    const handleClose = () => {
        setLp("")
        setOpen(false)
    }


    const unlockTx = (
        amount:string,
        tokenId: string,
      ): Transaction => {
        const contract = accounts.TOKEN_LOCKING; // Assuming this is your AMM contract
        const gas = "300000000000000"; // Same gas limit as addLiquidity
        const deposit = "1"; // No deposit required for this call
        const actions: FunctionCallAction[] = [
            {
              type: "FunctionCall",
              params: {
                methodName: "withdraw",
                args: {
                  amount:amount,
                  token_id: `${accounts.AMM}@${tokenId}`,
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
    const handleUnlock = async () => {
        if (!lp) {
            toast.error("Enter Amount");
            return;
        }
        if (parseFloat(lp) > Number(lps) / 10 ** LP_TOKEN_DECIMALS) {
            toast.error("Not enough balance ");
            return;
        }
        let transactions: Transaction[] = [];
        let shares = toNonDivisibleNumber(LP_TOKEN_DECIMALS, lp)
        let tx  = unlockTx(shares , `:${id}`, )
        transactions.push(tx);
        await (
            await selector.wallet()
          ).signAndSendTransactions({
            transactions,
          });
    }
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
                    <div className="flex items-center justify-between mt-4">
                        <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
                            Unlock LP
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
                            onClick={handleUnlock}
                        >
                            <Text sx={{ ...gradientStyle, fontSize: "24px" }}>Unlock</Text>
                        </Button>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default UnLock;
