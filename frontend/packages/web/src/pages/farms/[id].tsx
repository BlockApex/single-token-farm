import React, { useState, useEffect } from "react";
import PageContainer from "@/components/PageContainer";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { Token } from "@/assets/svg/token";
import toast from "react-hot-toast";
import { SuccessToast, ErrorToast, InfoTooltip } from "@/components/shared";
import { Button, TopCard } from "@/components";
import { Skeleton, Text, Spinner } from "@chakra-ui/react";
import { Open } from "@/assets/svg";
import AddLiquidity from "@/components/AddLiquidity";
import UnstakeModal from "@/components/modules/farms/UnstakeModal";
import StakeModal from "@/components/modules/farms/StakeModal";
import { BigNumber } from "bignumber.js";
import { ifRewardExist } from "@/api/farm";
import { lpReadableValue, LP_TOKEN_DECIMALS } from "@/utils/pool-utils";
import {
  useGetFarmStakedBalance,
  useGetStakedBalance,
  useGetFarmDetails,
  useGetUserRewardsByFarm,
} from "@/hooks/modules/farms";
import { useGetUserShare } from "@/hooks/modules/pools";
import { formatNumberWithSuffix } from "@/utils/conversion";
import { useWalletSelector } from "@/context/wallet-selector";
import { accounts, NEAR_BLOCK_URL } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import {
  Transaction,
  Action,
  FunctionCallAction,
} from "@near-wallet-selector/core";
import { getTxRec } from "@/tools";
import TokenWithSymbol from "@/components/modules/farms/Token";
import TokenIcon from "@/components/modules/farms/TokenIcon";

const FarmDetails = () => {
  const [searchParams] = useSearchParams();
  let { id } = useParams();
  const navigate = useNavigate();
  const { accountId, selector } = useWalletSelector();
  const { account } = useRPCStore();
  const [stakeToken, setStakeToken] = useState<any>(null);
  const [addModal, setAddModal] = useState(false);
  const [unstakeOpen, setUnstakeOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [isChecking, setChecking] = useState(false)
  const { farm, loading, error } = useGetFarmDetails(id!);
  const [myPower, setMyPower] = useState<any>(null);

  const TooltipContent = ({ tokenAddresses, rewards }: { tokenAddresses: string[], rewards: string[] }) => {
    const { account } = useRPCStore(); // Get NEAR account
    const [tokens, setTokens] = useState<{ address: string; decimals: number, icon: string }[]>([]);

    useEffect(() => {
      const fetchTokenMetadata = async () => {
        if (!account) return;

        try {
          const metadataPromises = tokenAddresses.map(async (address) => {
            const metadata = await account.viewFunction(address, "ft_metadata", {});
            return { address, decimals: metadata.decimals, icon: metadata.icon };
          });

          const resolvedTokens = await Promise.all(metadataPromises);
          setTokens(resolvedTokens);
        } catch (error) {
          console.error("Failed to fetch token metadata:", error);
        }
      };

      fetchTokenMetadata();
    }, [account, tokenAddresses]);

    return (
      <div className="min-w-[100px] p-2">
        {tokens.map((t, i) => (
          <div key={t.address} className="w-full flex items-center justify-between mb-2">
            {t?.icon ? (
              <img className={`w-4 h-4 rounded-full`} src={t?.icon} />
            ) : (
              <Token width={20} height={20} className="-ml-2" />
            )}
            <p className="text-white font-normal text-xs">
              {formatNumberWithSuffix(Number(rewards[i]) / 10 ** t.decimals)}
            </p>
          </div>
        ))}
      </div>
    );
  };



  const RewardAmoint = ({ address, _amount }) => {

    const { account } = useRPCStore();
    const [amount, setAmount] = useState('')

    const getMetadata = async () => {
      if (!address || !account) return;

      try {
        const metadata = await account.viewFunction(address, "ft_metadata", {});
        setAmount(lpReadableValue(metadata?.decimals, new BigNumber(_amount)))
      } catch (error) {
        console.error("Failed to fetch token metadata:", error);
      }
    };

    useEffect(() => {
      if (account) {
        getMetadata();
      }
    }, [account, farm]);


    return <p>{amount}</p>
  }



  const getMetadata = async (tokenAddress) => {
    if (!tokenAddress || !account) return;

    try {
      const metadata = await account.viewFunction(tokenAddress, "ft_metadata", {});
      setStakeToken({ ...metadata, address: tokenAddress });
    } catch (error) {
      console.error("Failed to fetch token metadata:", error);
    }
  };

  useEffect(() => {
    if (account && farm?.staking_token) {
      getMetadata(farm.staking_token);
    }
  }, [account, farm]);


  useEffect(() => {
    const errorCode = searchParams.get("errorCode");

    if (errorCode) {
      toast.dismiss(); // Dismiss any existing toasts

      if (errorCode === "userRejected") {
        setTimeout(() => {
          toast.error("Transaction was canceled by the user.");
        }, 1000);
      } else {
        setTimeout(() => {
          toast.error("An error occurred. Please try again.");
        });
      }

      // Clear the URL after displaying the toast
      navigate(window.location.pathname, { replace: true });
    }
  }, []);



  const handleTransaction = async () => {
    const tx = searchParams.get("transactionHashes");
    if (tx) {
      let link = `${NEAR_BLOCK_URL}/${tx}`
      let isError = await getTxRec(tx, accountId!);
      toast.dismiss();
      if (isError) {
        setTimeout(() => {
          toast.custom(<ErrorToast link={link} />);
        }, 1000);
      } else {
        setTimeout(() => {
          toast.custom(<SuccessToast link={link} />)
        }, 1000);
      }
    }
  };
  useEffect(() => {
    if (accountId) {
      handleTransaction();
    }
  }, [accountId]);



  const getMyPower = async (farmId: number, accountId: string,) => {
    try {
      const stakeInfo = await account?.viewFunction(accounts.SINGLE_FARM, "get_stake_info", {
        account_id: accountId,
        farm_id: farmId,
      });
      setMyPower(stakeInfo)
    } catch (error) {
      console.error("Error fetching stake info:", error);
      return null;
    }
  };

  useEffect(() => {
    if (farm && account) {
      getMyPower(farm.farm_id, accountId!)
    }
  }, [account, farm])



  const lockuptimeObj = {
    "120": "2 Minutes",
    "604800": "1 Week",
    "2592000": "1 Month",
    "5184000": "2 Months",
    "7776000": "3 Months",
  };
  
  
  
  const sessiontimeObj = {
    "120": "2 Minutes",
    "604800": "1 Week",
    "2592000": "1 Month",
    "5184000": "2 Months",
    "7776000": "3 Months",
    "60":"Every Minute",
    "3600":"Hourly",
    "86400":"Daily",
  };

  const convertSecondsToDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString(); // Converts to local date (without time)

  };




  const claimTx = (
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
          methodName: "claim_rewards",
          args: {
            farm_id: farmId,
          },
          gas,
          deposit: "1",
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


  const handleClaim = async  ()=>{
    const allZero = myPower?.accrued_rewards.every(value => value === '0');
    if(allZero){
      toast.error("Rewards are not available.");
      return
    }
    let transactions: Transaction[] = [];
    let tx  = claimTx(farm?.farm_id) 
    transactions.push(tx);
    try {
      await (
        await selector.wallet()
      ).signAndSendTransactions({
        transactions,
      });
    } catch (err) {
      console.log(err, "unstake.error")
    }
  }



  return (
    <PageContainer>
      <div className="mt-12" />
      <TopCard
        bigText="Deposit LP Tokens to Earn Token Rewards"
        bottomDescription="Use LP tokens received from providing liquidity for token pairs. Stake LP tokens to earn protocol rewards."
        gradientText="Jump Farms"
        jumpLogo
      />
      <div className="flex items-center justify-center">
        <div className="w-full md:w-[60%]">
          <div>
            <Link to="/farms">
              <span className="cursor-pointer">{"<"}- Farms</span>
            </Link>{" "}
            / Farm Details
          </div>
          {/* header section */}
          {loading ? (
            <div className="pb-4">
              {Array(8)
                .fill(0)
                .map((t, i) => (
                  <Skeleton
                    startColor="#4b2354"
                    endColor="#9a476f"
                    className="mb-4"
                    height="20px"
                    key={i}
                  />
                ))}
            </div>
          ) : (
            ""
          )}
          {farm ? (
            <div className="w-full flex items-center justify-between mt-4">
              <div className="flex items-center justify-start">
                <TokenWithSymbol address={farm.staking_token} />
              </div>
            </div>
          ) : (
            ""
          )}
          {/* Box section */}
          {farm ? (
            <div className="w-full h-auto rounded-lg bg-white-600 mt-4 p-4">
              {/* first two boxes */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="rounded-lg bg-white-600 flex items-start justify-between md:justify-start gap-8 p-4">
                  <div className="">
                    <h5 className="text-white-400 font-bolder text-md">
                      Total Staked
                    </h5>
                    <h4 className="text-white font-bold text-lg mt-2">
                      {stakeToken && lpReadableValue(stakeToken?.decimals, new BigNumber(farm?.total_staked))}
                    </h4>
                  </div>
                  <div className="">
                    {/* <h5 className="text-white-400 font-bolder text-md">APR</h5>
                    <h4 className="text-white font-bold text-lg mt-2">
                      {farm?.apr}%
                    </h4> */}
                  </div>
                </section>
                <section className="rounded-lg bg-white-600 flex items-start justify-between gap-8 p-4">
                  <div className="">
                    <h5 className="text-white-400 font-bolder text-md">
                      Rewards/Session
                    </h5>
                  </div>
                  <div className="h-full flex flex-col items-start justify-between" >
                    <InfoTooltip
                      label={<TooltipContent rewards={farm?.reward_per_session} tokenAddresses={farm?.reward_tokens} />}
                    >
                      <div className="relative flex items-center mt-auto md:mt-2">
                        {farm.reward_tokens?.map((token: any, i: number) => {
                          return (
                            <TokenIcon address={token} />
                          );
                        })}
                      </div>
                    </InfoTooltip>
                  </div>
                </section>
              </div>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-white-600 p-4 mt-4">
                  <section className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2">
                    <h5 className="text-white-400 font-bolder text-md">
                      Session Interval
                    </h5>
                    <h4 className="text-white font-bolder text-lg">
                      {sessiontimeObj[farm.session_interval_sec.toString()]}
                    </h4>
                  </section>
                  <section className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2">
                    <h5 className="text-white-400 font-bolder text-md">Locking Period</h5>
                    <h4 className="text-white font-bolder text-lg">
                      {lockuptimeObj[farm.lockup_period_sec.toString()]}
                    </h4>
                  </section>
                  <section className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2">
                    <h5 className="text-white-400 font-bolder text-md">Start At</h5>
                    <h4 className="text-white font-bolder text-lg">
                      {convertSecondsToDate(farm?.start_at_sec)}
                    </h4>
                  </section>
                </div>
                <div className="rounded-lg bg-white-600 p-4 mt-4">
                  <section className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2">
                    <h5 className="text-white-400 font-bolder text-md">
                      My Power
                    </h5>
                    <h4 className="text-white font-bolder text-lg">
                      {myPower?.amount ? stakeToken && lpReadableValue(stakeToken?.decimals, new BigNumber(myPower.amount)) : "0"}
                    </h4>
                  </section>
                </div>
              </div>
            </div>
          ) : (
            ""
          )}
          {/* Last Single box */}
          {myPower && myPower.reward_tokens.length ? (
         <div className="rounded-lg bg-white-600 p-4 mt-4">
         <h5 className="text-white font-bold text-md">
               Unclaimed Rewards
             </h5>

           <section className="flex flex-col md:flex-row items-start justify-between gap-2 md:gap-6">
             <div className="flex flex-row md:flex-col items-start justify-start">
               {myPower && myPower.reward_tokens?.length && accountId
                 ? myPower?.reward_tokens.map((t, i) => {
                   return (
                     <div className="flex items-center mb-2 mr-2">
                       <TokenIcon address={t} />
                       <h5 className="text-white-400 font-bold text-md ml-4">
                         {/* {formatNumberWithSuffix(myPower?.accrued_rewards[i])} */}
                         {myPower && <RewardAmoint _amount={myPower?.accrued_rewards[i]} address={t} />}
                       </h5>
                     </div>
                   );
                 })
                 : ""}
             </div>
             <button
               onClick={handleClaim}
               className="bg-[#CD7FF0] text-white font-bold text-sm min-w-[150px] rounded-sm"
             // disabled={farm?.total_reward_raw <= 0}
             >
               Claim Rewards
             </button>
           </section>
         </div>
          ):""}
 
        </div>

      </div>
      {/* {farm ? (
        <UnstakeModal
          staked={lpReadableValue(LP_TOKEN_DECIMALS, totalStakedBig)}
          farm={farm}
          open={unstakeOpen}
          setOpen={setUnstakeOpen}
        />
      ) : (
        ""
      )}
      {farm ? (
        <StakeModal
          staked={lpReadableValue(LP_TOKEN_DECIMALS, totalStakedBig)}
          open={stakeOpen}
          setOpen={setStakeOpen}
          farm={farm}
        />
      ) : (
        ""
      )} */}
      <div className="pb-32" />
    </PageContainer>
  );
};

export default FarmDetails;
