import { useState, useEffect, useCallback } from "react";
import { useWalletSelector } from "@/context/wallet-selector";
import { accounts } from "@/utils/account-ids";
import { findTokenMetadata } from "@/helper/near";
import axios from "axios";
import { useRPCStore } from "@/stores/rpc-store";

const BASE_URL = import.meta.env.VITE_AMM_URL;

export const updateIndexer = async () => {
  try {
    await axios.get(`${BASE_URL}/update-farms`);
    await axios.get(`${BASE_URL}/update-pools`);
  } catch (error) {
    console.log(error);
  }
};

export const useGetFarms = (search?: string, id?: string, createdBy?: boolean, myFarms?: boolean, whitelist?: boolean) => {
  const { account } = useRPCStore();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // Start from 0, NEAR uses index-based pagination
  const [limit] = useState(10); // Number of items per page
  const [hasMore, setHasMore] = useState(true); // Whether more farms exist to load

  const fetchFarms = useCallback(async (pageNum = 0) => {
    if (!account) return;
    
    setLoading(true);
    setError(null);

    try {
      const result: any = await account.viewFunction(
        accounts.SINGLE_FARM,
        "list_farms",
        {
          from_index: pageNum * limit,
          limit,
        }
      );

      if (result.length < limit) {
        setHasMore(false);
      }
      setFarms((prevFarms) => [...prevFarms, ...result]);
    } catch (err: any) {
      setError(err.message || "Failed to fetch farms");
    } finally {
      setLoading(false);
    }
  }, [account, limit]);

  
  useEffect(() => {
    if (account) {
      setFarms([]);
      setPage(0);
      setHasMore(true);
      fetchFarms(0);
    }
  }, [account, search, createdBy, whitelist, myFarms, id, fetchFarms]);

  useEffect(() => {
    if (account && page > 0) {
      fetchFarms(page);
    }
  }, [account, page, fetchFarms]);

  return {
    farms,
    loading,
    error,
    hasMore,
    loadMore: () => {
      if (hasMore) {
        setPage((prevPage) => prevPage + 1); // Load next batch of farms
      }
    },
  };
};


export const useGetFarmDetails = (id: string) => {
  console.log(id , "id...........")
  const [farm, setFarm] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | any>(null);
  const { account } = useRPCStore();

  const fetchFarm = useCallback(async () => {
    if (!account || id === undefined) return;

    setLoading(true);
    setError(null);

    try {
      const data = await account.viewFunction(
        accounts.SINGLE_FARM,
        "get_farm",
        { farm_id: parseInt(id)}
      );
      console.log(data , "DATA.........")
      setFarm(data);
    } catch (err: any) {
      console.log(err)
      setFarm(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, account]);

  useEffect(() => {
    if (id !== undefined) {
      fetchFarm();
    }
  }, [id, fetchFarm]);

  return { farm, loading, error };
};

export const useGetStakedBalance = (accountId: string, seedId: string) => {
  const { viewMethod } = useWalletSelector();
  const [balance, setBalance] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.FARM;
  const method = "list_user_seeds";
  const args = {
    account_id: accountId,
  };

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await viewMethod(contract, method, args);
      if (result[seedId]) {
        setBalance(result[seedId]);
      } else {
        setBalance(0);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [accountId, seedId]);

  useEffect(() => {
    if (accountId && seedId) {
      fetchBalance();
    }
  }, [accountId, seedId]);

  return {
    balance,
    loading,
    error,
  };
};

export const useGetFarmStakedBalance = (seedId: string) => {
  const { viewMethod } = useWalletSelector();
  const [balance, setBalance] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.FARM;
  const method = "get_seed_info";
  const args = {
    seed_id: seedId,
  };

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await viewMethod(contract, method, args);
      setBalance(result?.amount);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [seedId]);

  useEffect(() => {
    if (seedId) {
      fetchBalance();
    }
  }, [seedId]);

  return {
    farm_staked: balance,
    loading,
    error,
  };
};

export const useGetUserRewards = (accountId: string) => {
  const [rewards, setRewards] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${BASE_URL}/get-rewards?account_id=${accountId}`;
      const { data }: any = await axios.get(url);
      let rewardsWithId;
      if (data?.withdrawable_rewards?.length) {
        rewardsWithId = data?.withdrawable_rewards?.map(
          (item: any, i: number) => ({
            ...item,
            _id: i,
          })
        );
        rewardsWithId = rewardsWithId.filter((r: any) => r?.withdraw_amount > 0).filter(
          (reward: any, index: number, self: any[]) =>
            index === self.findIndex((r) => r.token_id === reward.token_id)
        );
      } else {
        rewardsWithId = [];
      }
      setRewards(rewardsWithId);
    } catch (err: any) {
      if(err?.response?.data?.error){
        setError(err?.response?.data?.error)
       }else{
         setError('Some Server Error');
       }
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchRewards();
    }
  }, [accountId]);

  return {
    rewards,
    loading,
    error,
  };
};


export const useGetUserUnclaimedRewards = (accountId: string) => {
  const [rewards, setRewards] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${BASE_URL}/user-unclaimed-rewards?user_id=${accountId}`;
      const { data }: any = await axios.get(url);
      const { unclaimed_rewards } = data;
      const groupedRewards =unclaimed_rewards.reduce((acc, reward) => {
        // Check if seed_id already exists in the accumulator
        if (!acc[reward.seed_id]) {
          acc[reward.seed_id] = [];
        }
        // Push the current reward object to the corresponding seed_id array
        acc[reward.seed_id].push(reward);
        
        return acc;
      }, {});
      setRewards(groupedRewards);

    } catch (err: any) {
      if(err?.response?.data?.error){
        setError(err?.response?.data?.error)
       }else{
         setError('Some Server Error');
       }
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchRewards();
    }
  }, [accountId]);

  return {
    rewards,
    loading,
    error,
  };
};

export const useGetUserRewardsByFarm = (accountId: string, seedId?: string) => {
  const [rewards, setRewards] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${BASE_URL}/get-rewards?account_id=${accountId}&seed_id=${seedId}`;
      const { data }: any = await axios.get(url);
      let rewardsWithId;
      if (data?.rewards.length) {
        rewardsWithId = data?.rewards.map((item: any, i: number) => ({
          ...item,
          _id: i,
        }));
      } else {
        rewardsWithId = [];
      }
      setRewards(rewardsWithId);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [accountId, seedId]);

  useEffect(() => {
    if (accountId && seedId) {
      fetchRewards();
    }
  }, [accountId, seedId]);

  return {
    rewards,
    loading,
    error,
  };
};
