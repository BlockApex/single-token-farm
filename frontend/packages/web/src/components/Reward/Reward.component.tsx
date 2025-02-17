import Big from "big.js";
import Skeleton from "react-loading-skeleton";
import Badge from "@/components/Badge";

type RewardProps = {
  name: string;
  icon: string;
  balance: string;
  decimals: number;
  stakedQuantity: number;
  badge?: string;
  hideText?: boolean;
  shouldDivide?: boolean;
};

function Reward({
  name,
  icon,
  balance,
  decimals,
  stakedQuantity,
  badge,
  hideText,
  shouldDivide,
}: RewardProps) {
  function formattedBalance(balance: string, decimals: number) {
    const decimalsBig = new Big(10).pow(decimals ?? 0);
    const balanceBig = new Big(balance ?? 0);
    const stakedBig = new Big(stakedQuantity === 0 ? 1 : stakedQuantity);
    if (shouldDivide)
      return balanceBig.div(decimalsBig).div(stakedBig).toFixed(2);
    else return balanceBig.div(decimalsBig).toFixed(2);
  }

  function renderImage() {
    if (!name) return <Skeleton className="rounded-full w-6 h-6" />;
    return <img src={icon} alt={name} className="rounded-full w-6 h-6" />;
  }

  function renderName() {
    const content = name ? (
      <>
        <strong className="uppercase">{name}</strong>
        {hideText ? "" : " / Month per NFT"}
      </>
    ) : (
      <Skeleton className="w-16" />
    );

    return (
      <p className="text-3.5 leading-3.5 tracking-tight text-left">{content}</p>
    );
  }

  function renderBadge() {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Badge className="relative inset-0">{badge}</Badge>
      </div>
    );
  }

  function renderContent() {
    return (
      <>
        <div className="flex gap-2 items-center justify-start ">
          {renderImage()}
          <h3 className="font-extrabold text-5 leading-5">
            {name ? (
              formattedBalance(balance, decimals)
            ) : (
              <Skeleton className="w-16" />
            )}
          </h3>
        </div>
        {renderName()}
      </>
    );
  }

  if (name === "string" || (name === "JUMP" && balance === "0")) {
    return <></>;
  } else {
    return (
      <div className="rounded-lg bg-white-600 p-4 min-w-[192px] h-[82px] space-y-3">
        {badge ? renderBadge() : renderContent()}
      </div>
    );
  }
}

export default Reward;
