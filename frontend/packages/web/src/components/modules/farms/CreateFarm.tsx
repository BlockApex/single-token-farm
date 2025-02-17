import { useEffect, useState } from "react";
import TokenSelector from "@/components/TokenSelector";
import { useWalletSelector } from "@/context/wallet-selector";
import { utils } from "near-api-js";
import { format } from 'date-fns';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    Button,
    Text,
} from "@chakra-ui/react";
import { RoundCross } from "@/assets/svg";
import { getDefaultTokens } from "@/utils/defaultTokens";
import { TokenMetadataType } from "@/utils/types";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import {
    DateInput,
    InfoTooltip,
    Radio,
    Checkbox,
    SimpleSelect,
} from "@/components/shared";
import { useGetPoolsByTokens } from "@/hooks/modules/pools";
import {
    Transaction,
    Action,
    FunctionCallAction,
} from "@near-wallet-selector/core";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import toast from "react-hot-toast";
import {
    toNonDivisibleNumber,
    formatNumberWithSuffix,
    convertTokenAmountWithDecimal,
    formatValueInDecimals
} from "@/utils/conversion";
import RewardTokenList from "./RewardTokenList";

const gradientStyle = {
    background:
        "radial-gradient(circle, rgba(174,108,198,1) 65%, rgba(112,112,238,1) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "transparent",
    display: "inline",
};


interface RewardToken {
    token: TokenMetadataType,
    rewardPerSession: string
}

const CreateFarm = ({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
}) => {
    const { accountId, selector } = useWalletSelector();
    const { account } = useRPCStore();

    const [stakingToken, setStakingToken] = useState<null | TokenMetadataType>(null);
    const [rewardTokens, setRewardTokens] = useState<RewardToken[]>([]);
    const [sessionInterval, setSessionInterval] = useState("");
    const [lockupPeriod, setLockupPeriod] = useState("");
    const [selectedDate, setSelectedDate] = useState('');


    const TooltipContent = () => {
        return (
            <div className="p-2">
                <p className="text-white-400">
                    <b>Tutorial tips:</b> Select token below to create
                    farm.
                </p>
            </div>
        );
    };

    const SessionTooltipContent = ()=>{
        return(
            <div className="p-2">
            <p className="text-white-400">
                <b>Tutorial tips:</b> The session interval is the fixed period in which a farm calculates and distributes rewards, resetting staking parameters accordingly..
            </p>
        </div> 
        )
    }

    

    const storageDeposit =  ()=>{
        let txStorage: Transaction = {
          signerId: accountId!, 
          receiverId: accounts.SINGLE_FARM,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "storage_deposit",
                args: {},
                gas: "100000000000000", 
                deposit: utils.format.parseNearAmount("1") as string,
              },
            },
          ],
        };
        return txStorage;
    
      }

      

    const createFarm = (
        stakingToken: string,
        rewardTokens: string[],
        rewardPerSession: string[],
        lockupPeriodSec: number,
        sessionIntervalSec: number,
        startAt:number
      ): Transaction => {
        const contract = accounts.SINGLE_FARM;
        const gas = "300000000000000";
        const deposit = "1"
      
        if (!accountId) {
          throw new Error("Account ID is required");
        }
      
        const actions: FunctionCallAction[] = [
          {
            type: "FunctionCall",
            params: {
              methodName: "create_farm",
              args: {
                input:{
                    staking_token: stakingToken,
                    reward_tokens: rewardTokens,
                    lockup_period_sec: lockupPeriodSec,
                    reward_per_session: rewardPerSession,
                    session_interval_sec: sessionIntervalSec,
                    start_at_sec: startAt,
                }
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
      

    const handleCreateFarm = async () => {
        if (!stakingToken) {
            toast.error("Please select a staking token.");
            return;
        }
    
        if (rewardTokens.length === 0) {
            toast.error("Please add at least one reward token.");
            return;
        }

        for (const reward of rewardTokens) {
            if (!reward.rewardPerSession || Number(reward.rewardPerSession) <= 0) {
                toast.error(`Invalid reward amount for ${reward.token.symbol}.`);
                return;
            }
        }
    
        if (!sessionInterval) {
            toast.error("Please select a session interval.");
            return;
        }
    
        if (!lockupPeriod) {
            toast.error("Please select a lockup period.");
            return;
        }
    
        if (!selectedDate) {
            toast.error("Please select a start date.");
            return;
        }
    
        const parsedDate = new Date(selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        if (parsedDate < today) {
            toast.error("Start date cannot be in the past.");
            return;
        }

        const farmData = {
            staking_token: stakingToken.address,
            reward_tokens: rewardTokens.map(rt => rt.token.address),
            reward_per_session: rewardTokens.map(rt => toNonDivisibleNumber(rt.token?.decimals, rt.rewardPerSession)), 
            lockup_period_sec: Number(lockupPeriod),
            session_interval_sec: Number(sessionInterval),
            start_at_sec: Math.floor(new Date(selectedDate).getTime() / 1000)
        };
        let transactions: Transaction[] = [];
        try {
            let storageTx = storageDeposit();
            transactions.push(storageTx)
            const createFarmTx = createFarm(
                farmData.staking_token,
                farmData.reward_tokens,
                farmData.reward_per_session,
                farmData.lockup_period_sec,
                farmData.session_interval_sec,
                farmData.start_at_sec
            );
            transactions.push(createFarmTx)
            await (
                await selector.wallet()
              ).signAndSendTransactions({
                transactions,
              });
        } catch (error) {
            console.error("Error creating farm:", error);
            toast.error("Failed to create farm.");
        }



    };


    const handleClose = () => {
        setOpen(false);
    };



    const handleRewardTokens = (token: TokenMetadataType) => {
        let tokens_copy = [...rewardTokens];
        if (!tokens_copy.some(existingToken => existingToken.token.address === token.address)) {
            tokens_copy.push({ token, rewardPerSession: '' });
        }
        setRewardTokens(tokens_copy);
    }

    const handleRemoveRewardToken = (token: TokenMetadataType) => {
        let tokens_copy = [...rewardTokens];
        // Filter out the token with the matching address
        tokens_copy = tokens_copy.filter(existingToken => existingToken.token.address !== token.address);
        setRewardTokens(tokens_copy);
    }


    const handleRewardPerSessionChange = (address: string, newReward: string) => {
        setRewardTokens((prevTokens) =>
            prevTokens.map((rewardToken) =>
                rewardToken.token.address === address
                    ? { ...rewardToken, rewardPerSession: newReward }
                    : rewardToken
            )
        );
    };

    return (
        <>
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
                                Create New Farm
                                <InfoTooltip label={<TooltipContent />}>
                                    <span className="ml-2 mt-1">
                                        <QuestionMarkOutlinedIcon className="w-4 h-4" />
                                    </span>
                                </InfoTooltip>
                            </h2>
                            <button onClick={handleClose}>
                                <RoundCross />
                            </button>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="w-full h-auto relative">
                            <p className="text-[#9CA3AF] font-semibold text-sm">
                                Select rewards & duration for your existing liquidity pool to
                                create a farm
                            </p>

                            <div className="w-full flex items-center justify-between px-1">
                                <p className="text-white font-bold text-md mb-2 mt-4">
                                    Stake Token
                                </p>

                            </div>
                            <div className="w-full rounded-lg bg-[#ffffff1a]  p-4 ">
                                <TokenSelector
                                    token={stakingToken}
                                    setToken={setStakingToken}
                                    tokenToFilter={{}}
                                    key="stakingToken"
                                />
                            </div>


                            {/* REWARD TOKEN */}
                            <div className="w-full flex items-center justify-between px-1">
                                <p className="text-white font-bold text-md mb-2 mt-4">
                                    Reward Tokens
                                </p>
                            </div>
                            {rewardTokens.length ? <RewardTokenList tokens={rewardTokens} handleRemove={handleRemoveRewardToken} handleRewardPerSessionChange={handleRewardPerSessionChange} /> : ""}
                            <div className="w-full rounded-lg bg-[#ffffff1a]  p-4 ">
                                <TokenSelector
                                    token={{}}
                                    setToken={(t) => handleRewardTokens(t)}
                                    tokenToFilter={{}}
                                    key="rewardToken"
                                />
                            </div>
                            {/* INTERVAL SECTION */}

                            <div className="w-full flex items-center justify-between px-1">
                                <p className="text-white font-bold text-md mb-2 mt-4 flex items-center">
                                    Session Interval
                                    <InfoTooltip label={<SessionTooltipContent />}>
                                    <span className="ml-2 mt-1">
                                        <QuestionMarkOutlinedIcon className="w-4 h-4" />
                                    </span>
                                </InfoTooltip>
                                </p>
                                <p className="text-white font-bold text-md mb-2 mt-4">
                                    Lockup Period
                                </p>
                            </div>
                            <div className="w-full h-auto  rounded-lg bg-[#ffffff1a] py-2 px-3">
                                <div className="w-full flex items-center justify-between">
                                    <SimpleSelect
                                        options={[
                                            // { label: "2 Minutes", value: "120" },
                                            { label: "1 Week", value: "604800" },
                                            { label: "1 Month", value: "2592000" },
                                            { label: "2 Months", value: "5184000" },
                                            { label: "3 Months", value: "7776000" }
                                        ]}
                                        selectedValue={sessionInterval}
                                        onChange={(e) => setSessionInterval(e)}
                                        text=""
                                        placeholder="Select Interval"
                                    />
                                    <SimpleSelect
                                        options={[
                                            { label: "Every Minute", value: "60" },
                                            { label: "Hourly", value: "3600" },
                                            { label: "Daily", value: "86400" },
                                            // { label: "2 Months", value: "5184000" },
                                            // { label: "3 Months", value: "7776000" }
                                        ]}
                                        selectedValue={lockupPeriod}
                                        onChange={(e) => setLockupPeriod(e)}
                                        text=""
                                        placeholder="Select Period"
                                    />

                                </div>
                            </div>


                            <div className="flex items-center justify-between" >
                                <div className="flex flex-col items-start justify-start" >
                                    <p className="text-white font-bold text-md mb-2 mt-4">
                                        Start At
                                    </p>
                                    <DateInput
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                    />
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
                                onClick={handleCreateFarm}
                            // disabled={feeTierMessage || !token0 || !token1 ? true : false}
                            >
                                <Text sx={{ ...gradientStyle, fontSize: "24px" }}>
                                    Create Farm
                                </Text>
                            </Button>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default CreateFarm;
