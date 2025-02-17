import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UnstakeModal from "@/components/modules/farms/UnstakeModal";
import StakeModal from "@/components/modules/farms/StakeModal";
import AddReward from "@/components/modules/farms/AddReward";

import { formatNumberWithSuffix } from "@/utils/conversion";
import { Token } from "@/assets/svg/token";
import { InfoTooltip } from "@/components/shared";
import { useWalletSelector } from "@/context/wallet-selector";
import {
  useGetFarmStakedBalance,
  useGetStakedBalance,
  useGetUserRewardsByFarm,
  useGetFarmDetails,
} from "@/hooks/modules/farms";
import { BigNumber } from "bignumber.js";
import { lpReadableValue, LP_TOKEN_DECIMALS } from "@/utils/pool-utils";
import { useGetUserShare } from "@/hooks/modules/pools";
import { ifRewardExist } from "@/api/farm";
import toast from "react-hot-toast";
import TokenWithSymbol from "./Token";
import { useRPCStore } from "@/stores/rpc-store";
import TokenIcon from "./TokenIcon";
import { accounts } from "@/utils/account-ids";



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
  "60": "Every Minute",
  "3600": "Hourly",
  "86400": "Daily",
};


const Farm = ({ farm }) => {
  const { account } = useRPCStore();
  const navigate = useNavigate();
  const [stakeToken, setStakeToken] = useState<any>(null);
  const { accountId } = useWalletSelector();
  const [unstakeOpen, setUnstakeOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [isChecking, setChecking] = useState(false);
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



  const convertSecondsToDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString();

  };

  const getMyPower = async (farmId: number, accountId: string,) => {
    try {
      const stakeInfo = await account?.viewFunction(accounts.SINGLE_FARM, "get_stake_info", {
        account_id: accountId,
        farm_id: farmId,
      });
      console.log(stakeInfo, "STAKEINFO......")
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

  const isLockupEnded = (lockupEndSec) => {
    const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
    return currentTime >= lockupEndSec;
  };

  const handleUnstakeModal = async (e) => {
    e.stopPropagation();
    try {
      if (farm?.farm_id) {
        setChecking(true)
        // let response = await ifRewardExist(farm?.seed_id, accountId!)
        let isEnded = isLockupEnded(myPower?.lockup_end_sec);
        setChecking(false);
        if (isEnded) {
          setUnstakeOpen(true);
        } else {
          toast.error('You cannot unstake untill the locking period ends.')
        }
      }
    } catch (e) {
      console.log(e)
    }
  }


  return (
    <div
      onClick={() => navigate(`/farms/${farm?.farm_id}`)}
      className="w-full bg-white-600 mb-4 rounded-lg p-4 cursor-pointer"
    >
      <div className="w-full grid grid-cols-12 gap-4 md:gap-8">
        {/* Col 1 */}
        <div className="col-span-12 md:col-span-3">
          <div className="flex items-start justify-start">
            <TokenWithSymbol address={farm.staking_token} />
          </div>
        </div>
        {/* Col 2 */}
        <div className="col-span-12 md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white-400 font-normal text-sm ">Total Staked</p>
            <p className="text-white font-bold text-sm ">
              {stakeToken && lpReadableValue(stakeToken?.decimals, new BigNumber(farm?.total_staked))}
            </p>
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-white-400 font-normal text-sm ">My Power</p>
            <p className="text-white font-bold text-sm ">
              {myPower?.amount ? stakeToken && lpReadableValue(stakeToken?.decimals, new BigNumber(myPower.amount)) : "0"}

            </p>
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-white-400 font-normal text-sm ">Status</p>
            <p className="text-white font-bold text-sm ">
              {farm?.status === 'Active' ? <span className="w-2 h-2 bg-green block rounded-full" ></span> : <span className="w-2 h-2 bg-red block rounded-full"></span>}
            </p>
          </div>
        </div>
        {/* Col 3 */}
        <div className="col-span-12 md:col-span-2">
          <div className="flex flex-row md:flex-col items-center md:items-start justify-start gap-4 md:gap-0 pl-auto md:pl-6">
            <p className="text-white font-normal text-sm ">Rewards/session</p>
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
        </div>
        {/* Col 4 */}
        <div className="col-span-12 md:col-span-2">
          <div className="flex items-center justify-between mb-1">
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-white-400 font-normal text-sm ">Session Interval</p>
            <p className="text-white-400 font-normal text-sm ">
              {sessiontimeObj[farm.session_interval_sec.toString()]}
            </p>
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-white-400 font-normal text-sm ">
              Locking Period
            </p>
            <p className="text-white-400 font-normal text-sm ">
              {lockuptimeObj[farm.lockup_period_sec.toString()]}
            </p>
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-white-400 font-normal text-sm ">
              Start At
            </p>
            <p className="text-white-400 font-normal text-sm ">
              {convertSecondsToDate(farm?.start_at_sec)}
            </p>
          </div>
        </div>
        {/* Col 5 */}
        <div className="col-span-12 md:col-span-3">
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStakeOpen(true);
              }}
              className="bg-[#CD7FF0] text-white font-bold text-sm min-w-[150px] rounded-sm"
            // disabled={farm?.total_reward_raw <= 0}
            >
              Stake
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setRewardOpen(true);
              }}
              className="bg-[#CD7FF0] text-white font-bold text-sm min-w-[150px] rounded-sm mt-3"
              disabled={farm?.total_reward_raw <= 0}
            >
              Add Reward
            </button>
            {myPower && parseFloat(myPower?.amount) > 0 && accountId ? (
              <button
                onClick={handleUnstakeModal}
                className="bg-[#7B1FA2]  text-white font-bold text-sm min-w-[150px] rounded-sm mt-3"
                style={{ boxShadow: "1px 4px 4px 0px rgba(0, 0, 0, 0.25)" }}
                disabled={parseFloat(myPower?.amount) <= 0 || isChecking}
              >
                {isChecking ? "Loading..." : "Unstake"}
              </button>
            ) : ""}

          </div>
        </div>
      </div>
      {myPower && (
        <UnstakeModal
          staked={lpReadableValue(stakeToken?.decimals, new BigNumber(myPower.amount))}
          farm={farm}
          open={unstakeOpen}
          setOpen={setUnstakeOpen}
        />
      )}
      <StakeModal
        staked={'0'}
        farm={farm}
        open={stakeOpen}
        setOpen={setStakeOpen}
      />
      <AddReward farm={farm} open={rewardOpen} setOpen={setRewardOpen} />
    </div>
  );
};

export default Farm;
