import { useEffect, useMemo, useRef, useState } from "react";
import { getUTCDate, StakingToken, Token } from "@near/ts";
import Reward from "@/components/Reward";
import Skeleton from "react-loading-skeleton";
import { addMilliseconds } from "date-fns";
import Badge from "@/components/Badge";
import Image from "@/components/Image";
import { viewMethod } from "@/helper/near";

type NFTCardProps = Token & {
  rewards: StakingToken[];
  curfew: string;
  penalty: string;
  minified?: boolean;
  img?: string;
  collection_id?: string;
};

function NFTCard(props: NFTCardProps) {
  const {
    token_id: id,
    balance,
    stakedAt,
    curfew,
    metadata: { title: name, media: image },
    rewards,
    minified,
    img,
  } = props;

  const [width, setWidth] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  // @ts-ignore
  useEffect(() => setWidth(ref.current ? ref.current.clientWidth : 0), []);

  const staked = useMemo(() => {
    return getUTCDate(Number(stakedAt));
  }, [stakedAt, id]);

  const penaltyExpireDate = useMemo(() => {
    return addMilliseconds(staked, Number(curfew));
  }, [curfew, id]);

  // const hasWithdrawPenalty = useMemo(() => {
  //   const today = getUTCDate();
  //
  //   return isBefore(today, penaltyExpireDate);
  // }, [staked, penaltyExpireDate, id]);

  // const withdrawPenalty = useMemo(() => {
  //   const denom = new Big("1000000000000000000000");
  //   const penaltyBN = new Big(penalty);
  //
  //   return penaltyBN.div(denom).toString() + "%";
  // }, [rewards, id, penalty]);

  function renderRewards() {
    const rewardsList = id ? rewards : [{}, {}, {}];
    if (!rewardsList) return null;
    return rewardsList.map((reward, index) => (
      <Reward
        key={index}
        name={reward?.name}
        icon={reward?.icon}
        balance={balance ? balance[reward?.account_id] : "0"}
        decimals={reward?.decimals}
        stakedQuantity={1}
        hideText={true}
      />
    ));
  }

  function renderImage() {
    if (!id) return <Skeleton className={`rounded-sm h-[138px] w-[138px]`} />;

    return (
      <div
        className={`aspect-square ${
          minified && width > 230
            ? "rounded-lg after:rounded-lg after:contents-[' '] after:bottom-0 after:w-full after:absolute after:h-[50%] after:pointer-events-none after:bg-gradient-to-b after:from-transparent after:to-black/70"
            : "rounded-sm"
        }`}
      >
        <Image
          src={img ? img : "https://picsum.photos/200"}
          alt={name}
          className={
            minified && width > 230
              ? "rounded-lg"
              : minified
              ? "rounded-sm "
              : "rounded-sm w-[138px] aspect-square"
          }
          landscapeLoader
        />
      </div>
    );
  }

  function renderMinifiedContainer() {
    return (
      <div
        className={`absolute bg-white-300 rounded-sm ${
          width > 230
            ? "py-4 px-6 bottom-4 left-6 right-6"
            : "pt-2.5 pb-4 px-3 inset-2 top-auto"
        }`}
      >
        <h2
          className={`text-black text-center tracking-tight font-extrabold ${
            width > 230 ? "text-6 leading-6" : "text-3.5 leading-3.5"
          }`}
        >
          {name || <Skeleton className="w-20" />}
        </h2>
      </div>
    );
  }

  function renderBadge(content: string) {
    return <Badge className="right-4">{content}</Badge>;
  }

  function renderBadgeContent() {
    const today = new Date();
    const years = penaltyExpireDate.getFullYear() - today.getFullYear();
    const months = penaltyExpireDate.getMonth() - today.getMonth();
    const days = penaltyExpireDate.getDay() - today.getDay();
    const hours = penaltyExpireDate.getHours() - today.getHours();
    const minutes = penaltyExpireDate.getMinutes() - today.getMinutes();

    if (penaltyExpireDate < today) return renderBadge("Available to claim");
    else if (years > 0)
      return renderBadge(
        `Available to claim in ${years} year${years > 1 ? "s" : ""}.`
      );
    else if (months > 0)
      return renderBadge(
        `Available to claim in ${months} month${months > 1 ? "s" : ""}.`
      );
    else if (days > 0)
      return renderBadge(
        `Available to claim in ${days} day${days > 1 ? "s" : ""}.`
      );
    else if (hours > 0)
      return renderBadge(
        `Available to claim in ${hours} hour${hours > 1 ? "s" : ""}.`
      );
    else
      return renderBadge(
        `Available to claim in ${minutes} minute${minutes > 1 ? "s" : ""}.`
      );
  }

  function renderDetailedContainer() {
    return (
      <div className="flex-grow-0 flex-shrink">
        <h2 className="pl-2 mb-4 text-4 font-extrabold tracking-tight leading-4">
          {name || <Skeleton width="180px" />}
        </h2>
        <p className="pl-2 mb-2.5 text-3.5 font-medium tracking-tight leading-3.5">
          {"NFT rewards" || <Skeleton width="230px" />}
        </p>
        <div className="flex gap-9 flex-wrap">{renderRewards()}</div>
        {id ? renderBadgeContent() : <Skeleton className="w-16" />}
      </div>
    );
  }

  return (
    <div
      key={id}
      ref={ref}
      className={
        `relative outline-none rounded-lg bg-white-600 flex gap-6 ` +
        (minified ? (width < 230 ? "p-0" : "") : "px-6 py-7 w-full")
      }
    >
      {renderImage()}
      {minified ? renderMinifiedContainer() : renderDetailedContainer()}
    </div>
  );
}

export default NFTCard;
