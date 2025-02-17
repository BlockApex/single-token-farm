import { useState, useEffect } from "react";
import PageContainer from "@/components/PageContainer";
import { Button, TopCard } from "@/components";
import { useWalletSelector } from "@/context/wallet-selector";
import { Search, SimpleSelect, ErrorToast, SuccessToast, Checkbox } from "@/components/shared";
import { useSearchParams, useNavigate } from "react-router-dom";
import MyRewards from "@/components/modules/farms/MyRewards";
import FarmTabs from "@/components/modules/farms/FarmTabs";
import AllFarms from "@/components/modules/farms/AllFarms";
import MyFarms from "@/components/modules/farms/MyFarms";
import CreateFarm from "@/components/modules/farms/CreateFarm";
import { getTxRec } from "@/tools";
import toast from "react-hot-toast";
import { NEAR_BLOCK_URL } from "@/utils/account-ids";

const TooltipContent = () => {
  return (
    <div className="p-2">
      <p className="text-white-400">
        <b>Tutorial Tips:</b>
        Liquidity pool positions with yield farms allow you to deposit lp tokens
        into the related farm to earn additional rewards on top of swap fees.
      </p>
      <p className="text-white-400 mt-4">
        Choose desired farms and stake/ unstake lp tokens below to earn a share
        of weekly rewards.
      </p>
    </div>
  );
};

const Farms = () => {
  const { accountId } = useWalletSelector();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [farmTab, setFarmTab] = useState(0);
  const [search, setSearch] = useState("");
  const [createdBy, setCreatedBy] = useState(false);
  const [whitelist, setWhitelist] = useState(false);
  const [open, setOpen] = useState(false);

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
      // Split the transaction hashes into an array
      const txArray = tx.split(",");

      // Get the second transaction hash (index 1)
      const secondTx = txArray[1];

      // Check if the second transaction exists
      if (secondTx) {
        const link = `${NEAR_BLOCK_URL}/${secondTx}`;
        const isError = await getTxRec(secondTx, accountId!);
        toast.dismiss();
        setTimeout(() => {
          if (isError) {
            toast.custom(<ErrorToast link={link} />);
          } else {
            toast.custom(<SuccessToast link={link} />);
          }
        }, 1000);
      } else {
        console.error("No second transaction hash found.");
      }
    } else {
      console.error("No transaction hashes found in the URL.");
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
      <TopCard
        bigText="Deposit LP Tokens to Earn Token Rewards"
        bottomDescription="Use LP tokens received from providing liquidity for token pairs. Stake LP tokens to earn protocol rewards."
        gradientText="Jump Farms"
        jumpLogo
        tooltip={true}
        tooltipContent={<TooltipContent />}
      />
      {/* <MyRewards /> */}
      <div className="w-full h-auto relative">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <FarmTabs tab={farmTab} setTab={(s: number) => setFarmTab(s)} />

          <div className="w-full md:w-auto mt-4 md:mt-0 flex items-center justify-start gap-4">
            {/* {farmTab === 0 && accountId ? (
              <div className="min-w-[140px]" >
                <Checkbox
                  label="Created by me"
                  checked={createdBy!}
                  onChange={(e) => setCreatedBy(e.target.checked)}
                />
              </div>
            ) : ""}
            {farmTab === 0 && accountId ? (
              <div className="min-w-[160px]" >
                <Checkbox
                  label="Whitelisted Farms"
                  checked={whitelist!}
                  onChange={(e) => setWhitelist(e.target.checked)}
                />
              </div>
            ) : ""} */}

            <Button onClick={() => {
              if (!accountId) {
                toast.error("Please connect wallet");
                return
              }
              setOpen(true)
            }} big>
              + Create Farm
            </Button>



            <Search
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Farms"
            />
          </div>
        </div>

        {farmTab === 0 ? <AllFarms whitelist={whitelist} search={search} createdBy={createdBy} accountId={accountId} /> : <MyFarms search={search} />}
        {/* <div className="bg-[#ffa50014] rounded-md flex items-center justify-center p-2 mt-4">
          <p className="text-[#FFA500] font-bold text-sm">
            You need LP tokens to stake into the corresponding farm. Add
            liquidity to the pool to get LP tokens.
          </p>
        </div> */}
      </div>
      <div className="pb-16" />
      <CreateFarm open={open} setOpen={setOpen} />
    </PageContainer>
  );
};

export default Farms;
