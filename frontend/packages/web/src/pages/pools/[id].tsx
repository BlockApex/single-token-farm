import { useEffect } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import toast from "react-hot-toast";
import { Skeleton } from "@chakra-ui/react";
import { SuccessToast, ErrorToast } from "@/components/shared";
import PageContainer from "@/components/PageContainer";
import Overview from "@/components/modules/pool-details/Overview";
import Stats from "@/components/modules/pool-details/Stats";
import Schedule from "@/components/modules/pool-details/Schedule";
import FarmList from "@/components/modules/pool-details/FarmList";
import PoolComposition from "@/components/modules/pool-details/PoolComposition";
import RecentTransactions from "@/components/modules/pool-details/RecentTransactions";
import FarmBox from "@/components/modules/pool-details/FarmBox";
import { useGetPoolById, useGetUserShare , useGetPoolPortfolio } from "@/hooks/modules/pools";
import { useWalletSelector } from "@/context/wallet-selector";
import { getTxRec } from "@/tools";
import { NEAR_BLOCK_URL } from "@/utils/account-ids";

const PoolDetail = () => {
  const [searchParams] = useSearchParams();
  let { id } = useParams();
  const navigate = useNavigate();
  const { accountId } = useWalletSelector();
  const {
    shares,
    error: sharesError,
    loading: sharesLoading,
  } = useGetUserShare(id!, accountId!);
  const { pool, error, loading } = useGetPoolById(id!);
  const {stats , loading:statsLoading} = useGetPoolPortfolio(accountId!, id!)
  let newPool = { ...pool, id: id }
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
    let txs = tx?.split(",");
    if (tx && txs && txs.length) {
      let link = `${NEAR_BLOCK_URL}/${txs[0]}`
      let isError = await getTxRec(txs[0], accountId!);
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

  return (
    <PageContainer>
      <div className="mt-12" />
      <div className="flex items-center justify-center">
        <div className="w-full md:w-[70%]">
          <div className="mb-4">
            <Link to="/pools">
              <span className="cursor-pointer">{"<"}- Pools</span>
            </Link>{" "}
            / Pool Details
          </div>
          {!loading && pool ? <Overview lps={shares} pool={newPool} accountId={accountId} stats={stats}  statsLoading={statsLoading} /> : ""}
          {loading ? (
            <Skeleton
              startColor="#4b2354"
              endColor="#9a476f"
              className="mb-4"
              height="200px"
            />
          ) : (
            ""
          )}
          <FarmList id={id} />

          {!loading && pool ? <Stats pool={pool} /> : ""}
          {!loading && pool ? <Schedule lps={shares} pool={newPool} /> : ""}
          {!loading && pool ? <PoolComposition pool={pool} /> : ""}
          {id && pool && !loading ? <RecentTransactions id={id} /> : ""}
        </div>
      </div>
      <div className="pb-32" />
    </PageContainer>
  );
};

export default PoolDetail;
