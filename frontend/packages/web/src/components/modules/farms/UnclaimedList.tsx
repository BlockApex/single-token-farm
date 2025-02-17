import { Checkbox, TokenLogo, InfoTooltip } from "@/components/shared";
import { Token } from "@/assets/svg/token";
import { utils } from "near-api-js";
import { Button } from "@/components";
import { Collapse } from "@chakra-ui/react";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import { useWalletSelector } from "@/context/wallet-selector";
import { useGetUserRewards, useGetUserUnclaimedRewards } from "@/hooks/modules/farms";
import { Skeleton, Text, Spinner } from "@chakra-ui/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import {
    Transaction,
    Action,
    FunctionCallAction,
} from "@near-wallet-selector/core";
import { BigChevron } from "@/assets/svg";
import RewardTabs from "./RewardTabs";
import { formatNumberWithSuffix } from "@/utils/conversion";


const UnclaimedList = () => {
    const { accountId, selector } = useWalletSelector();
    const { account } = useRPCStore();
    const { rewards: unclaimedRewards, loading: unclaimedLoading, error: unclaimedError } = useGetUserUnclaimedRewards(accountId!)
    const [unclaimedSelected, setUnclaimedSelected] = useState<any[]>([]);



    const isUnclaimedSelected = (reward: any) => {
        const isSelected = unclaimedSelected.some((r) => r === reward);
        if (isSelected) {
            return true;
        } else {
            return false;
        }
    };

    const handleUnclaimSelect = (reward: any) => {
        const isSelected = unclaimedSelected.some((r) => r === reward);
        if (isSelected) {
            setUnclaimedSelected(unclaimedSelected.filter((r) => r !== reward));
        } else {
            setUnclaimedSelected([...unclaimedSelected, reward]);
        }
    };


    const getPoolId = (id: string) => {
        return id.split("@")[1]
    }




    const unclaimTx = (seedId): Transaction => {
        const contract = accounts.FARM;
        const gas = "300000000000000";

        if (!accountId) {
            throw new Error("Account ID is required");
        }

        const actions: FunctionCallAction[] = [
            {
                type: "FunctionCall",
                params: {
                    methodName: "claim_reward_by_seed",
                    args: {
                        seed_id: seedId,
                    },
                    gas,
                    deposit: "0",
                },
            },
        ];

        const transaction: Transaction = {
            signerId: accountId as string,
            receiverId: contract,
            actions: actions,
        };
        return transaction;
    };




    const handleUnclaim = async (rewards) => {
        if (!rewards.length) {
            toast.error("Please select reward token");
            return
        }

        let transactions: Transaction[] = [];
        for (const reward of rewards) {
            let tx = unclaimTx(reward);
            transactions.push(tx);
        }
        await (
            await selector.wallet()
        ).signAndSendTransactions({
            transactions,
        });

    }

    const handleUnClaimAll = () => {
        setUnclaimedSelected(Object.keys(unclaimedRewards))

        handleUnclaim(Object.keys(unclaimedRewards));

    };


    return (
        <>
            {unclaimedLoading ? (
                <div className="w-full flex items-center justify-center p-12">
                    <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="#4b2354"
                        size="xl"
                    />
                </div>
            ) : (
                ""
            )}
            {unclaimedError ? (
                <div className="flex items-center justify-center mt-8">
                    <Text fontWeight="extrabold">{unclaimedError}</Text>
                </div>
            ) : (
                ""
            )}
            <>
                {/* {accountId ? (
                    <>
                        {unclaimedRewards && unclaimedRewards?.length ? (
                            <div className="grid grid-cols-12">
                                <section className="w-full h-auto flex items-center justify-start flex-wrap  col-span-12 md:col-span-8">
                                    {unclaimedRewards?.map((reward: any, i: number) => {
                                        return (
                                            <div
                                                key={i}
                                                className="bg-white-600 flex items-center justify-start rounded-md mr-0  md:mr-4 py-2 pl-3 pr-6 mt-4 w-full md:w-auto"
                                            >
                                                <Checkbox
                                                    checked={isUnclaimedSelected(reward)}
                                                    label=""
                                                    onChange={() => handleUnclaimSelect(reward)}
                                                />
                                                {reward?.token_icon ? (
                                                    <img
                                                        src={reward?.token_icon}
                                                        className="w-9 h-9 rounded-full"
                                                    />
                                                ) : (
                                                    <Token width={40} height={40} />
                                                )}
                                                <div className="pl-4">
                                                    <small className="text-white-400 font-bold text-xs">
                                                        {reward?.token_symbol}
                                                    </small>
                                                    <p className="text-white font-bold text-sm">
                                                        {formatNumberWithSuffix(parseFloat(reward?.unclaimed_amount_units))}
                                                    </p>
                                                    <p
                                                        className="text-[#CD7FF0] font-bold text-sm mt-2"
                                                    >({getPoolId(reward?.seed_id)})</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </section>
                                <section className="w-full h-full mt-4 md:mt-auto p-2 md:p-4 flex flex-col items-start md:items-end justify-center col-span-12 md:col-span-4">
                                    <Button
                                        onClick={() => handleUnclaim(unclaimedSelected)}
                                        outline
                                        full
                                        className="md:max-w-[130px]"
                                    >
                                        Claim
                                    </Button>

                                    <Button
                                        full
                                        className="mt-2 md:mt-6 bg-[#7B1FA2] md:max-w-[130px]"
                                        style={{
                                            boxShadow: "1px 4px 4px 0px rgba(0, 0, 0, 0.25)",
                                        }}
                                        onClick={handleUnClaimAll}
                                    >
                                        Claim All
                                    </Button>
                                </section>
                            </div>
                        ) : (
                            ""
                        )}
                        {unclaimedRewards && !unclaimedRewards?.length && !unclaimedLoading ? (
                            <div className="flex items-center justify-center mt-8">
                                <Text fontWeight="extrabold">No Rewards Found</Text>
                            </div>
                        ) : (
                            ""
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center mt-8 pb-8">
                        <Text fontWeight="extrabold">
                            Connect your wallet to view rewards.
                        </Text>
                    </div>
                )} */}
                {accountId ? (
                    <div className="grid grid-cols-12  mt-4">
                        <section className="w-full h-auto flex items-center justify-start flex-wrap  col-span-12 md:col-span-8">

                            <>
                                {unclaimedRewards && Object.keys(unclaimedRewards).map((r: any, i: number) => {
                                    return (
                                        <div className="bg-white-600 rounded-md m-2 p-2 w-full md:w-auto" >
                                            <div className="flex items-center" >
                                                <Checkbox
                                                    checked={isUnclaimedSelected(r)}
                                                    label=""
                                                    onChange={() => handleUnclaimSelect(r)}
                                                />
                                                <p
                                                    className="text-[#CD7FF0] font-bold text-sm"
                                                >Pool ID: {getPoolId(r)}</p>
                                            </div>
                                            <div
                                                className="flex items-center justify-start "
                                            >
                                                {unclaimedRewards[r].map((reward: any, i: number) => {
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="bg-white-600 flex items-center justify-start rounded-md m-2 py-2 pl-3 pr-6  w-full md:w-auto"
                                                        >
                                                            {reward?.token_icon ? (
                                                                <img
                                                                    src={reward?.token_icon}
                                                                    className="w-9 h-9 rounded-full"
                                                                />
                                                            ) : (
                                                                <Token width={40} height={40} />
                                                            )}
                                                            <div className="pl-4">
                                                                <small className="text-white-400 font-bold text-xs">
                                                                    {reward?.token_symbol}
                                                                </small>
                                                                <p className="text-white font-bold text-sm">
                                                                    {formatNumberWithSuffix(parseFloat(reward?.unclaimed_amount_units))}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        </section>
                        {unclaimedRewards && Object.keys(unclaimedRewards).length ? (
                            <section className="w-full h-full mt-4 md:mt-auto p-2 md:p-4 flex flex-col items-start md:items-end justify-center col-span-12 md:col-span-4">
                                <Button
                                    onClick={() => handleUnclaim(unclaimedSelected)}
                                    outline
                                    full
                                    className="md:max-w-[130px]"
                                >
                                    Claim
                                </Button>

                                <Button
                                    full
                                    className="mt-2 md:mt-6 bg-[#7B1FA2] md:max-w-[130px]"
                                    style={{
                                        boxShadow: "1px 4px 4px 0px rgba(0, 0, 0, 0.25)",
                                    }}
                                    onClick={handleUnClaimAll}
                                >
                                    Claim All
                                </Button>
                            </section>
                        ) : ""}
                    </div>
                ) : (
                    <div className="flex items-center justify-center mt-8 pb-8">
                        <Text fontWeight="extrabold">
                            Connect your wallet to view rewards.
                        </Text>
                    </div>
                )}
                {unclaimedRewards && !Object.keys(unclaimedRewards)?.length && !unclaimedLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Text fontWeight="extrabold">No Rewards Found</Text>
                    </div>
                ) : (
                    ""
                )}
            </>
        </>
    )
}

export default UnclaimedList