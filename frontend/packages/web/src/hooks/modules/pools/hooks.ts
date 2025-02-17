import { useState, useEffect, useCallback } from "react";
import { useWalletSelector } from "@/context/wallet-selector";
import { accounts } from "@/utils/account-ids";
import { findTokenMetadata } from "@/helper/near";
import axios from "axios";
import { BigNumber } from "bignumber.js";

const BASE_URL = import.meta.env.VITE_AMM_URL;

export const updateIndexer = async ()=>{
  try{
    await axios.get(`${BASE_URL}/update-farms`);
    await axios.get(`${BASE_URL}/update-pools`);
  }catch(error){
    console.log(error)
  }
}


export const useGetPools = (
  index: number,
  farmsAvailable: boolean,
  sort: { key: string; order_by: string },
  search: string,
  showFav: boolean,
  createdBy: string,
) => {
  const [pools, setPools] = useState<null | any[]>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data }: any = await axios.get(
        `${BASE_URL}/pools?page=${index + 1
        }&limit=10&farms=${farmsAvailable}&sort=${sort.key}&order_by=${sort.order_by
        }&search=${search?.toLowerCase()}&created_by=${createdBy}`
      );
      const { total_pools, pools } = data;
      setCount(total_pools);
      setPools(pools);
    } catch (err: any) {
      if(err?.response?.data?.error){
       setError(err?.response?.data?.error)
      }else{
        setError('Some Server Error');
      }
    } finally {
      setLoading(false);
    }
  }, [index, farmsAvailable, sort.key, sort.order_by, search, createdBy]);


    // Map sort keys to actual pool keys
    const sortKeyMapping = {
      TVL: 'tvl',
      total_fee: 'fee',  // Mapping 'total_fee' to 'fee'
      APR: 'apr',
      volume_24h: 'volume_24h'
    };

  const fetchFav = ()=>{
    let favoritePools: any[] = JSON.parse(localStorage.getItem("favoritePools") || "[]");
    if (farmsAvailable) {
      favoritePools = favoritePools.filter(pool => Array.isArray(pool.farms) && pool.farms.length > 0);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      favoritePools = favoritePools.filter(pool => {
        const token0Match = pool.token0?.name?.toLowerCase().includes(searchLower) || pool.token0?.symbol?.toLowerCase().includes(searchLower);
        const token1Match = pool.token1?.name?.toLowerCase().includes(searchLower) || pool.token1?.symbol?.toLowerCase().includes(searchLower);
        return token0Match || token1Match;
      });
    }
    const sortKey = sortKeyMapping[sort?.key];
    if (sortKey) {
      favoritePools = favoritePools.sort((a, b) => {
        const valueA = a[sortKey];
        const valueB = b[sortKey];
  
        if (sort.order_by === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    }

    const pageSize = 10;
    const startIndex = (index) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPools = favoritePools.slice(startIndex, endIndex);
    setCount(favoritePools.length);
    setPools(paginatedPools);
  }

  useEffect(() => {
    if(showFav){
      fetchFav()
    }else{
      fetchPools();
    }
    updateIndexer()
  }, [fetchPools, index, farmsAvailable, sort.key, sort.order_by, search , showFav, createdBy]);

  return {
    pools,
    loading,
    error,
    count,
  };
};


export const useGetStats = (poolTab:number) => {
  const [stats, setStats] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data }: any = await axios.get(`${BASE_URL}/tvl-volume`);
      if(data){
        let stats:any = {
          tvl:data?.total_tvl,
          volume:data?.total_volume_24h
        }
        setStats(stats);
      }else{
        let stats:any = {
          tvl:0,
          volume:0
        }
        setStats(stats);
      }
    } catch (err: any) {
      setError(err);
      let stats:any = {
        tvl:0,
        volume:0
      }
      setStats(stats);
    } finally {
      setLoading(false);
    }
  }, [poolTab]);


  useEffect(()=>{
    fetchStats();
  },[poolTab])



  return {
    stats,
    loading,
    error
  };
};



export const useGetPortfolio = (userId:string , poolTab:number) => {
  const [stats, setStats] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data:portfolio }: any = await axios.get(`${BASE_URL}/portfolio?user_id=${userId}`);
      let stats:any = {
      }
      if(portfolio && portfolio?.total_value_usd){
        stats.portfolio = portfolio?.total_value_usd
      }else{
        stats.portfolio = 0
      }
      setStats(stats);
    } catch (err: any) {
      let stats:any = {

      }
      stats.portfolio = 0
      setStats(stats);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId , poolTab]);


  useEffect(()=>{
    if(userId){
      fetchStats();
    }
  },[userId, poolTab])



  return {
    stats,
    loading,
    error
  };
};




export const useGetPoolPortfolio = (userId:string , poolId:string) => {
  const [stats, setStats] = useState<null | number>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data }: any = await axios.get(`${BASE_URL}/portfolio?user_id=${userId}`);
      let pool = data?.pools?.filter((p:any) => p.pool_id === poolId);
      if(pool.length > 0) {
        setStats(pool[0]?.total_value_usd)
      }else{
        setStats(0)
      }
    } catch (err: any) {
      setStats(0)
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId , poolId]);


  useEffect(()=>{
    if(userId){
      fetchStats();
    }
  },[userId, poolId])



  return {
    stats,
    loading,
    error
  };
};


export const useGetPoolsByTokens = (token0:string| undefined , token1:string|undefined) => {
  const [pools, setPools] = useState<null | any[]>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flag , setFlag] = useState(false);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data }: any = await axios.get(
        `${BASE_URL}/list-pools-by-tokens?token0=${token0}&token1=${token1}`
      );
      setPools(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token0, token1]);

  useEffect(() => {
    if(token0 && token1){
      fetchPools();
    }else{
      setPools(null)
    }
    updateIndexer()
  }, [fetchPools, token0, token1, flag]);


  const refetch = ()=>{
    setFlag(!flag)
  }
  return {
    pools,
    loading,
    error,
    refetch
  };
};


export const useGetUserPools = (
  index: number,
  farmsAvailable: boolean,
  sort: { key: string; order_by: string },
  search: string,
  userId: string
) => {
  const [pools, setPools] = useState<null | any[]>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data }: any = await axios.get(
        `${BASE_URL}/user-pools?user_id=${userId}&page=${index + 1
        }&limit=10&farms=${farmsAvailable}&sort=${sort.key}&order_by=${sort.order_by
        }&search=${search?.toLowerCase()}`
      );
      const { total_pools, pools } = data;
      setCount(total_pools);
      setPools(pools);
    } catch (err: any) {
      if(err?.response?.data?.error){
       setError(err?.response?.data?.error) 
      }else{
        setError('Some Server Error');
      }
    } finally {
      setLoading(false);
    }
  }, [index, farmsAvailable, sort.key, sort.order_by, search, userId]);

  useEffect(() => {
    if(userId){
      fetchPools();
    }
  }, [fetchPools, index, farmsAvailable, sort.key, sort.order_by, search, userId]);

  return {
    pools,
    loading,
    error,
    count,
  };
};

export const useGetPoolCount = () => {
  const { viewMethod } = useWalletSelector();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.AMM;
  const method = "metadata";
  const args = {};

  const getCount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await viewMethod(contract, method, args);
      setCount(result?.pool_count);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [viewMethod, contract, method]);

  useEffect(() => {
    getCount();
  }, [getCount]);

  return {
    count,
    loading,
    error,
  };
};

export const useCreatePool = () => {
  const { callMethod, viewMethod } = useWalletSelector();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.AMM;
  const method = "add_simple_pool";

  const createPool = useCallback(
    async (tokens: string[], fee: number) => {
      setLoading(true);
      setError(null);

      const args = {
        tokens,
        fee,
      };

      const gas = "100000000000000"; // 100 Tgas in yoctoNEAR
      const amount = BigInt(1.02 * 10 ** 24);

      try {
        const result = await callMethod(
          contract,
          method,
          args,
          gas,
          amount.toString()
        );

        return result;
      } catch (err: any) {
        console.log(err, "CREATEERROR");
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [callMethod, contract, method]
  );

  return {
    createPool,
    loading,
    error,
  };
};

export const useGetPoolById = (id: string) => {
  const { viewMethod } = useWalletSelector();
  const [pool, setPool] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  const contract = accounts.AMM;
  const method = "get_pool";
  const args = {
    pool_id: Number(id)
  };

  const fetchPool = useCallback(async () => {
    setLoading(true);
    setError(null);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    try {
      const { data }: any = await axios.get(`${BASE_URL}/pools?ids=${id}`);
      let response = await getPoolByContract();
      const { pools } = data;
      let newPool = {};

      if (pools?.length) {
        const poolCopy = { ...pools[0] };
        newPool = {...poolCopy};
      }
      newPool = {
        ...newPool , 
        token0:response.token0 , 
        token1:response.token1,
        amounts:response.amounts,
        shares_total_supply:response.shares_total_supply
      };
      setPool(newPool);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);



  const getPoolByContract = async ()=>{
    try{
      let result = await viewMethod(contract, method, args);
      let token0 = await findTokenMetadata(result?.token_account_ids[0]);
      let token1 = await findTokenMetadata(result?.token_account_ids[1]);
      token0 = {...token0, address:result?.token_account_ids[0]}
      token1 = {...token1, address:result?.token_account_ids[1]}
      result = {...result, token0, token1}
      return result
    }catch (err: any) {
      console.log(err , "ERROR CHECK..........")
    } finally {
      console.log("finally")
    }
  
  }

  useEffect(() => {
    updateIndexer()
    if (id) {
      fetchPool();
    }
  }, [fetchPool, id]);

  return {
    pool,
    loading,
    error,
  };
};

export const useGetPoolTransactions = (id: string) => {
  const [transactions, setTransactions] = useState<null | any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data }: any = await axios.get(
        `${BASE_URL}/transactions?pool_id=${id}`
      );
      let txs = data["transactions"]
      setTransactions(txs);
    } catch (err: any) {
      setError(err);
      setTransactions([])
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTransactions();
    }
  }, [fetchTransactions, id]);

  return {
    transactions,
    loading,
    error,
  };
};


 

export const useGetUserShare = (id: string, account: string) => {
  const { viewMethod } = useWalletSelector();
  const [shares, setShares] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.AMM;
  const method = "get_pool_shares";
  const args = {
    pool_id: Number(id),
    account_id: account,
  };

  const getShares = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await viewMethod(contract, method, args);
      setShares(result)
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [viewMethod, contract, method, id, account]);

  useEffect(() => {
    if(id && account){
      getShares();
    }
  }, [getShares, id, account]);

  return {
    shares,
    loading,
    error,
  };
};



export const useGetUserStaked = (account: string) => {
  const { viewMethod } = useWalletSelector();
  const [shares, setShares] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.FARM;
  const method = "list_user_seeds";
  const args = {
    account_id: account,
  };

  const getShares = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await viewMethod(contract, method, args);
      setShares(result)
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [viewMethod, contract, method,  account]);

  useEffect(() => {
    if( account){
      getShares();
    }
  }, [getShares, account]);

  return {
    shares,
    loading,
    error,
  };
};

export const useRemoveLiquidity = () => {
  const { callMethod } = useWalletSelector();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.AMM;
  const method = "remove_liquidity";


  const removeLiquidity = useCallback(
    async (id: number, shares: string, amounts: string[]) => {
      setLoading(true);
      setError(null);

      const args = {
        pool_id: id,
        shares,
        min_amounts: amounts
      };

      const gas = "100000000000000"; // 100 Tgas in yoctoNEAR

      try {
        const result = await callMethod(
          contract,
          method,
          args,
          gas,
        );

        return result;
      } catch (err: any) {
        console.log(err, "REMOVEERROR");
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [callMethod, contract, method]
  );

  return {
    removeLiquidity,
    loading,
    error,
  };
};




export const useGetAllLocks = (poolId:number) => {
  const { viewMethod } = useWalletSelector();
  const [locks, setLocks] = useState<any>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.TOKEN_LOCKING;
  const method = "get_accounts_paged";
  const args = {
    from_index:0,
    limit:300,
  };

  const getAllLocks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await viewMethod(contract, method, args);
      let filteredData:any[] = [];
      for(let item of result){
        if(item?.locked_tokens[`${accounts.AMM}@:${poolId}`]){
          filteredData.push(item?.locked_tokens[`${accounts.AMM}@:${poolId}`])
        }
      }
      if(filteredData.length){
        const totalLockedBalance = filteredData?.reduce((sum, item) => {
          return sum.plus(new BigNumber(item.locked_balance));
        }, new BigNumber(0));
        setLocks(totalLockedBalance)
      }else{
        setLocks(0);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [viewMethod, contract, method]);

  useEffect(() => {
    getAllLocks();
  }, [getAllLocks]);

  return {
    locks,
    loading,
    error,
  };
};



export const useGetUserLocks = (accountId:string, poolId:number) => {
  const { viewMethod } = useWalletSelector();
  const [lock, setLock] = useState<any>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = accounts.TOKEN_LOCKING;
  const method = "get_account";
  const args = {
    account_id:accountId,
  };

  const getLock = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await viewMethod(contract, method, args);
      if(result?.locked_tokens[`${accounts.AMM}@:${poolId}`]){
        setLock(result?.locked_tokens[`${accounts.AMM}@:${poolId}`])
      }else{
        setLock({locked_balance:"0", unlock_time_sec:0})
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [viewMethod, contract, method, accountId]);

  useEffect(() => {
    if(accountId){
      getLock();
    }
  }, [getLock, accountId]);

  return {
    lock,
    loading,
    error,
  };
};

