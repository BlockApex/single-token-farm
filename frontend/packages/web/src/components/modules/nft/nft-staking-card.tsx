import { StakingToken, Transaction } from "@near/ts";
import Skeleton from "react-loading-skeleton";
import { HTMLAttributes } from "react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { twMerge } from "tailwind-merge";
import Reward from "@/components/Reward";
import Image from "@/components/Image";
import { useState, useEffect } from "react";
import { useWalletSelector } from "@/context/wallet-selector";
import { viewMethod } from "@/helper/near";
import toast from "react-hot-toast";

import {
  executeMultipleTransactions,
  getTransaction,
} from "@/tools/modules/near";

type NFTStakingCardProps = HTMLAttributes<HTMLButtonElement> & {
  name?: string | undefined;
  logo?: string | undefined;
  link?: string | undefined;
  rewards?: StakingToken[];
  logoless?: boolean;
  wallet?: string;
  collection?: string | undefined;
  shouldDivide?: boolean;
  includeInnerBalance?: boolean;
  collectionId: string;
};

export function NFTStakingCard(props: NFTStakingCardProps) {
  const { accountId, selector } = useWalletSelector();
  const [nftQuantity, setNftQuantity] = useState<any>(1);
  const [innerBalance, setInnerBalance] = useState<any[] | undefined>([]);

  useEffect(() => {
    if (!props) return;
    if (!accountId) return;
    if (!props.rewards) return;
    if (!props.collection) return;
    if (!props.includeInnerBalance) return;
    viewMethod("nftstaking.jumpfinance.near", "view_inner_balance", {
      account_id: accountId,
      collection: {
        type: "NFTContract",
        account_id: props.collection,
      },
    })
      .then((res) => {
        console.log(res);
        const balanceOfEachToken = props.rewards?.map((reward) => {
          if (Object.keys(res).find((key) => key.includes(reward.account_id))) {
            return {
              ...reward,
              perMonth: res[reward.account_id],
            };
          } else {
            return {
              ...reward,
              perMonth: 0,
            };
          }
        });
        setInnerBalance(balanceOfEachToken);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [accountId, props]);
  useEffect(() => {
    if (!props.collection) return;
    viewMethod(
      import.meta.env.VITE_NFT_STAKING_CONTRACT,
      "view_total_staked_amount_for_collection",
      {
        collection: {
          type: "NFTContract",
          account_id: props.collection,
        },
      }
    ).then((res) => {
      if (res == 0) setNftQuantity(1);
      else setNftQuantity(res);
    });
  }, [props.collection]);

  const renderLink = () => {
    if (props.link)
      return (
        <a
          href={props.link}
          className="rounded-sm border-white-500 border-[1px] flex items-center font-normal gap-x-2 text-3.5 tracking leading-3.5 ml-6 mt-[-4px] py-2 px-4 hover:border-transparent hover:font-semibold hover:bg-white-300 hover:text-purple"
        >
          Website <ArrowTopRightOnSquareIcon className="h-3" />
        </a>
      );
  };

  const renderLogo = () => {
    if (props.logo)
      return (
        <Image
          src={props.logo}
          alt={props.name}
          className="h-[64px] w-[64px] rounded-full md:h-[134px] md:w-[134px]"
        />
      );
    else if (!props.logoless)
      return <Skeleton circle height="135px" width="135px" />;
  };

  const renderTitle = () => {
    if (props.logoless)
      return (
        <h3 className="text-left font-extrabold text-4 tracking-tight leading-4">
          {props.name}
        </h3>
      );
    else if (props.name)
      return (
        <h2 className="font-extrabold text-6 leading-6 text-left tracking-tighter flex items-center">
          {props.name}
          {renderLink()}
        </h2>
      );
    else
      return (
        <h2 className="text-6">
          <Skeleton width="230px" />
        </h2>
      );
  };

  const renderRewards = ({ name, icon, decimals, perMonth }, index) => {
    return (
      <Reward
        key={index}
        name={name}
        icon={icon}
        balance={perMonth}
        decimals={decimals}
        stakedQuantity={nftQuantity}
        badge={props.wallet}
        hideText={props.logoless}
        shouldDivide={props.shouldDivide}
      />
    );
  };

  async function handleClaimInnerBalance() {
    if (!accountId) return;

    /**pub fn withdraw_reward(
    &mut self,
    collection: NFTCollection,
    token_id: FungibleTokenID,
    amount: Option<U128>,
  ) */
    const methodName = "withdraw_reward";
    const tokenId = "lockedjumptoken.jumpfinance.near";
    const collection = {
      type: "NFTContract",
      account_id: props.collectionId,
    };

    if (!selector) {
      toast.error("Please connect your wallet first");
      return;
    }

    const wallet = await selector.wallet();
    const transactions: Transaction[] = [];
    const depositedStorage = await viewMethod(tokenId, "storage_balance_of", {
      account_id: accountId,
    });
    if (!depositedStorage) {
      transactions.push(
        getTransaction(
          accountId!,
          tokenId,
          "storage_deposit",
          {
            account_id: accountId,
            registration_only: false,
          },
          "0.55"
        )
      );
    }

    transactions.push(
      getTransaction(
        accountId!,
        import.meta.env.VITE_NFT_STAKING_CONTRACT,
        methodName,
        {
          collection,
          token_id: tokenId,
        }
      )
    );

    await executeMultipleTransactions(transactions, wallet);
  }

  return (
    <button
      onClick={props.onClick}
      type="button"
      className={twMerge(
        "relative bg-white-600 cursor-default rounded-lg flex w-full gap-10",
        props.onClick ? "cursor-pointer hover:bg-white-550" : "",
        props.logoless ? "px-6 pt-6 pb-8" : "px-8 pt-9 pb-8"
      )}
      tabIndex={props.onClick ? 0 : -1}
    >
      {renderLogo()}
      <div className="flex flex-wrap justify-start gap-9 w-full">
        <div
          className={`${props.logoless ? "gap-y-7" : "gap-y-8"
            } flex flex-col items-start`}
        >
          {renderTitle()}
          <div className="flex gap-9 flex-wrap">
            {props.rewards?.map(renderRewards) ||
              [0, 1, 2].map((i) => (
                <Skeleton key={i} width="192px" height="82px" />
              ))}
          </div>
        </div>
        {props.includeInnerBalance &&
          innerBalance &&
          innerBalance.length > 0 &&
          innerBalance.filter((reward) => reward.perMonth > 0).length > 0 && (
            <div
              className={`${props.logoless ? "gap-y-7" : "gap-y-8"
                } flex flex-col items-start`}
            >
              <h3 className="text-left font-extrabold text-4 tracking-tight leading-4">
                Unclaimed Balance
              </h3>
              <div className="flex gap-9">
                {innerBalance
                  .filter((reward) => reward.perMonth > 0)
                  .map(renderRewards) ||
                  [0, 1, 2].map((i) => (
                    <Skeleton key={i} width="192px" height="82px" />
                  ))}
              </div>
              <button
                onClick={handleClaimInnerBalance}
                className="rounded-sm border-white-500 border-[1px] flex items-center font-normal gap-x-2 text-3.5 tracking leading-3.5 ml-6 mt-[-4px] py-2 px-4 hover:border-transparent hover:font-semibold hover:bg-white-300 hover:text-purple"
              >
                Claim <ArrowTopRightOnSquareIcon className="h-3" />
              </button>
            </div>
          )}
      </div>
    </button>
  );
}