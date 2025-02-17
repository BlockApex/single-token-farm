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
import UnclaimedList from "./UnclaimedList";
import { formatNumberWithSuffix } from "@/utils/conversion";


const TooltipContent = () => {
  return (
    <div className="p-2">
      <p className="text-white-400">
        Claimable rewards are shown here. Click the claim all button, or select
        the individual rewards you wish to claim.
      </p>
    </div>
  );
};

const MyRewards = () => {
  const { accountId, selector } = useWalletSelector();
  const { account } = useRPCStore();
  const { rewards, loading, error } = useGetUserRewards(accountId!);
  const [selected, setSelected] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [rewardTab, setRewardTab] = useState(0);

  const handleSelect = (reward: any) => {
    if (reward.withdraw_amount <= 0) {
      toast.error("Not enough tokens");
      return;
    }
    const isSelected = selected.some((r) => r._id === reward._id);
    if (isSelected) {
      setSelected(selected.filter((r) => r._id !== reward._id));
    } else {
      setSelected([...selected, reward]);
    }
  };



  const isSelected = (reward: any) => {
    const isSelected = selected.some((r) => r._id === reward?._id);
    if (isSelected) {
      return true;
    } else {
      return false;
    }
  };


  const registerAccountTx = async (
    token: string
  ): Promise<Transaction | null> => {
    const gas = "300000000000000"; // Same gas limit as addLiquidity
    const deposit = utils.format.parseNearAmount("0.1") as string; // 0.1 NEAR deposit
    try {
      const storageCheck = await account!.viewFunction(
        token,
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
          receiverId: token,
          actions: actions,
        };

        return transaction;
      } else {
        return null;
      }
    } catch (err) {
      console.log(err, "REGISTER ERROR");
      return null;
    }
  };

  const claimTx = (rewards: any) => {
    const contract = accounts.FARM; // Assuming this is your farm contract
    const gas = "300000000000000"; // Same gas limit as addLiquidity
    const deposit = "1"; // 0.1 NEAR deposit
    let transactions: Transaction[] = [];
    for (const reward of rewards) {
      const actions: FunctionCallAction[] = [
        {
          type: "FunctionCall",
          params: {
            methodName: "withdraw_reward",
            args: {
              token_id: reward?.token_id,
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
      transactions.push(transaction);
    }
    return transactions;
  };
  const handleClaim = async (rewards) => {
    if (!rewards.length) {
      toast.error("Please select reward token");
      return
    }
    let transactions: Transaction[] = [];
    for (const reward of rewards) {
      let tx = await registerAccountTx(reward?.token_id);
      if (tx) {
        transactions.push(tx);
      }
    }
    let tx = claimTx(rewards);
    transactions = [...transactions, ...tx];
    await (
      await selector.wallet()
    ).signAndSendTransactions({
      transactions,
    });
  };

  const handleClaimAll = () => {
    let filteredRewards = rewards.filter((r: any) => r.withdraw_amount > 0);
    if (filteredRewards?.length) {
      setSelected([...filteredRewards]);
      handleClaim([...filteredRewards]);
    } else {
      toast.error("You don't have any rewards yet");
    }
  };









  return (
    <div className="bg-white-600 w-full h-auto rounded-lg relative">
      <div className="p-4">
        <section className="w-full flex items-center justify-between">
          <h1 className="text-xl tracking-tighter font-bold leading-6 flex items-center">
            My Rewards
            <InfoTooltip label={<TooltipContent />}>
              <span className="ml-2 ">
                <QuestionMarkOutlinedIcon className="w-4 h-4" />
              </span>
            </InfoTooltip>
          </h1>
          <button onClick={() => setShow(!show)}>
            <BigChevron className={show ? "" : "rotate-180"} />
          </button>
        </section>
        <Collapse in={show}>
          <br />
          <RewardTabs
            rewardTab={rewardTab}
            setRewardTab={(s: number) => {
              setRewardTab(s)
            }}
          />
          {rewardTab === 0 ? (
            <>
              {loading ? (
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
              <>
                {accountId ? (
                  <>
                    {rewards && rewards?.length ? (
                      <div className="grid grid-cols-12">
                        <section className="w-full h-auto flex items-center justify-start flex-wrap  col-span-12 md:col-span-8">
                          {rewards?.map((reward: any, i: number) => {
                            return (
                              <div
                                key={i}
                                className="bg-white-600 flex items-center justify-start rounded-md mr-0  md:mr-4 py-2 pl-3 pr-6 mt-4 w-full md:w-auto"
                              >
                                <Checkbox
                                  checked={isSelected(reward)}
                                  label=""
                                  onChange={() => handleSelect(reward)}
                                />
                                {reward?.icon ? (
                                  <img
                                    src={reward?.icon}
                                    className="w-9 h-9 rounded-full"
                                  />
                                ) : (
                                  <Token width={40} height={40} />
                                )}
                                <div className="pl-4">
                                  <small className="text-white-400 font-bold text-xs">
                                    {reward?.symbol}
                                  </small>
                                  <p className="text-white font-bold text-sm">
                                    {formatNumberWithSuffix(parseFloat(reward?.withdraw_amount))}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </section>
                        <section className="w-full h-full mt-4 md:mt-auto p-2 md:p-4 flex flex-col items-start md:items-end justify-center col-span-12 md:col-span-4">
                          <Button
                            onClick={() => handleClaim(selected)}
                            outline
                            full
                            className="md:max-w-[130px]"
                          >
                            Withdraw
                          </Button>

                          <Button
                            full
                            className="mt-2 md:mt-6 bg-[#7B1FA2] md:max-w-[130px]"
                            style={{
                              boxShadow: "1px 4px 4px 0px rgba(0, 0, 0, 0.25)",
                            }}
                            onClick={handleClaimAll}
                          >
                            Withdraw All
                          </Button>
                        </section>
                      </div>
                    ) : (
                      ""
                    )}
                    {rewards && !rewards?.length && !loading ? (
                      <div className="flex items-center justify-center p-12">
                        <Text fontWeight="extrabold">No Rewards Found</Text>
                      </div>
                    ) : (
                      ""
                    )}
                    {error ? (
                      <div className="flex items-center justify-center mt-8 pb-8">
                        <Text fontWeight="extrabold" color='red'>{error}</Text>
                      </div>
                    ) : ''}
                  </>
                ) : (
                  <div className="flex items-center justify-center mt-8 pb-8">
                    <Text fontWeight="extrabold">
                      Connect your wallet to view rewards.
                    </Text>
                  </div>
                )}
              </>
            </>
          ) : ""}
          {/* Unclaimed Rewards: section */}
          {rewardTab === 1 ? (
            <UnclaimedList />
          ) : ""}
        </Collapse>
      </div>
    </div>
  );
};

export default MyRewards;
