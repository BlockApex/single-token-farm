import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Skeleton, Spinner } from "@chakra-ui/react";
import PageContainer from "@/components/PageContainer";
import { Button, TopCard } from "@/components";
import PoolTabs from "@/components/PoolTabs";
import { Search , ErrorToast, SuccessToast} from "@/components/shared";
import PoolList from "@/components/modules/pools/PoolList";
import MyLiquidity from "@/components/modules/pools/MyLiquidity";
import CreatePool from "@/components/CreatePool";
import { useWalletSelector } from "@/context/wallet-selector";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getTransactionState , getTxRec} from "@/tools";
import {useGetStats, useGetPortfolio} from "@/hooks/modules/pools";
import { formatNumberWithSuffix } from "@/utils/conversion";
import { NEAR_BLOCK_URL } from "@/utils/account-ids";


export const Content = ({stats , loading}) => {
  return (
    <div className="flex item-center justify-start md:justify-end">
      <div className="flex item-center justify-start bg-gradient-to-r from-custom-start to-custom-end mr-0  md:mr-32 rounded-[19px] px-2 md:px-6 py-2">
        <section className="mr-2 md:mr-6">
          <h6 className="font-bold text-[20px] leading-[30px]">
            {loading ? (
              <Spinner />
            ):""}
            {!loading && stats?.tvl >= 0 ? `$${formatNumberWithSuffix(stats?.tvl)}`:''}
          </h6>
          <p className="font-fira font-semibold text-[14px] leading-[20px] text-white text-opacity-60">
            TVL (Total Value Locked)
          </p>
        </section>
        <section className="mr-1 md:mr-12">
          <h6 className="font-bold text-[20px] leading-[30px]">
          {loading ? (
              <Spinner />
            ):""}
            {!loading && stats?.volume >= 0 ? `$${formatNumberWithSuffix(stats?.volume)}`:''}
            </h6>
          <p className="font-fira font-semibold text-[14px] leading-[20px] text-white text-opacity-60">
            Volume (24h)
          </p>
        </section>
      </div>
    </div>
  );
};

export const MyContent = ({stats, loading}) => {
  return (
    <div className="flex item-center justify-start md:justify-end">
      <div className="flex item-center justify-start bg-gradient-to-r from-custom-start to-custom-end mr-0  md:mr-32 rounded-[19px] px-2 md:px-6 py-2">
        <section className="mr-2 md:mr-6">
          <h6 className="font-bold text-[20px] leading-[30px]">
          {loading ? ( 
              <Spinner />
            ):""}
            {!loading && stats?.portfolio >= 0 ? `$${formatNumberWithSuffix(stats?.portfolio)}`:''}
          </h6>
          <p className="font-fira font-semibold text-[14px] leading-[20px] text-white text-opacity-60">
            Portfolio Value (USD)
          </p>
        </section>
        <section className="mr-1 md:mr-12">
        </section>
      </div>
    </div>
  );
};

const TooltipContent = () => {
  return (
    <div className="p-2">
      <p className="text-white-400">
        Navigate the various Jump DeFi liquidity pools below to provide
        liquidity and earn swap fees.
      </p>
      <p className="text-white-400 mt-4">
        Your active positions will be shown in the "My Liquidity" tab.
      </p>
    </div>
  );
};

const Pools = () => {
  const { accountId } = useWalletSelector();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [poolTab, setPooolTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const {stats , loading , error} = useGetStats(poolTab)
  const {stats:portfolioStats , loading:portfolioLoading , error:portfolioError} = useGetPortfolio(accountId! , poolTab)

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


  const getPoolId = async (tx:string) => {
    let res: any = await getTransactionState(tx, accountId!);
    
    let methodName = "";

    if (res?.transaction?.actions && res.transaction.actions.length > 0) {
      const action = res.transaction.actions[0];
      if (action.FunctionCall) {
        methodName = action.FunctionCall.method_name;
      }
    }

    if (methodName === "add_simple_pool") {
      if (res?.status && res?.status?.SuccessValue) {
        const decodedValue = Buffer.from(res.status.SuccessValue, 'base64').toString('utf-8');
        return decodedValue;
      }
    } else {
      return null;
    }
  };

  const handleTransaction = async () => {
    const tx = searchParams.get("transactionHashes");
    if (tx) {
      let response = await getPoolId(tx);
      if (response) {
        navigate(`/pools/${response}`)
      }
      let link = `${NEAR_BLOCK_URL}/${tx}`
      let isError = await getTxRec(tx , accountId!);
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
    if(accountId){
      handleTransaction();
    }
  }, [accountId]);



  

  return (
    <PageContainer>
      <div className="mt-12" />
      <TopCard
        bigText="Provide Liquidity and Earn Swap Fees"
        bottomDescription="Create liquidity pools and provide liquidity to token pairs to earn swap fees"
        gradientText="Jump Liquidity Pools"
        jumpLogo
        tooltip={true}
        tooltipContent={<TooltipContent  />}
      >
         {poolTab === 0 ? <Content  stats={stats} loading={loading} /> : accountId ? <MyContent stats={portfolioStats} loading={portfolioLoading}/> :""}
      </TopCard>
      <div className="flex flex-col md:flex-row items-center justify-between">
        <PoolTabs
          poolTab={poolTab}
          setPoolTab={(s: number) => {
            setSearch("")
            setPooolTab(s)
          }}
        />
        <div className="w-full md:w-auto mt-4 md:mt-0 flex items-center justify-start gap-4">
          <Button onClick={() => {
            if (!accountId) {
              toast.error("Please connect wallet");
              return
            }
            setOpen(true)
          }} big>
            + Create Pool
          </Button>
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pools"
          />
        </div>
      </div>

      {poolTab === 0 ? (
        <PoolList search={search} accountId={accountId} />
      ) : (
        <MyLiquidity accountId={accountId} search={search} />
      )}
      <div className="pb-32" />
      <CreatePool open={open} setOpen={setOpen} />
    </PageContainer>
  );
};

export default Pools;
