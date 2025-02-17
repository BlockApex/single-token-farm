import Big from "big.js";
import UpgradeModal from "./upgrade-modal";
import { useMemo, useState } from "react";
import { useLaunchpadStore } from "@/stores/launchpad-store";
import { useWalletSelector } from "@/context/wallet-selector";
import { format, addMilliseconds, isBefore } from "date-fns";
import { InvestorInfo } from "@/hooks/modules/launchpad";
import { tokenMetadata } from "@/interfaces";
import { twMerge } from "tailwind-merge";
import { Tutorial, TutorialItemInterface } from "@/components";
import isEmpty from "lodash/isEmpty";

const tiers = [
  {
    name: "No Tier",
    class: "no-tier",
  },
  {
    name: "Bronze",
    class: "bronze",
  },
  {
    name: "Silver",
    class: "silver",
  },
  {
    name: "Gold",
    class: "gold",
  },
  {
    name: "Tungsten",
    class: "tungsten",
  },
  {
    name: "Platinum",
    class: "platinum",
  },
  {
    name: "Diamond",
    class: "diamond",
  },
];

export function MemberArea({
  investor,
  totalAllowance,
  launchpadSettings,
  baseToken: { metadata, balance },
  stepItems,
}: {
  isLoaded: boolean;
  investor: InvestorInfo;
  totalAllowance: string;
  launchpadSettings: {
    membership_token: string;
    token_lock_period: string;
    tiers_minimum_tokens: string[];
    tiers_entitled_allocations: string[];
    allowance_phase_2: string;
    partner_dex: string;
  };
  baseToken: {
    metadata: tokenMetadata;
    balance?: string;
  };
  stepItems?: TutorialItemInterface[];
}) {
  const { accountId, selector } = useWalletSelector();
  const { decreaseMembership } = useLaunchpadStore();

  const [showModal, setShowModal] = useState(false);

  const stakedTokens = useMemo(
    () => new Big(investor?.staked_token ?? 0),
    [investor?.staked_token]
  );

  const minimumTokens = useMemo(
    () => launchpadSettings?.tiers_minimum_tokens.map((t) => new Big(t)),
    [launchpadSettings]
  );

  const level = useMemo(() => {
    const metLevels = minimumTokens?.filter((tokenAmount) =>
      tokenAmount.lte(stakedTokens)
    );

    return metLevels?.length;
  }, [minimumTokens, stakedTokens]);

  const downgradeLevel = async () => {
    decreaseMembership(0, accountId!, selector);
  };

  const lastCheck = useMemo(() => {
    return new Date(Number(investor?.last_check!) / 1_000_000);
  }, [investor]);

  const endVesting = useMemo(() => {
    return addMilliseconds(
      lastCheck,
      Number(launchpadSettings?.token_lock_period) / 1_000_000
    );
  }, [launchpadSettings]);

  const isLocked = useMemo(() => {
    const now = new Date();

    return isBefore(now, endVesting);
  }, [investor, launchpadSettings]);

  const decimals = useMemo(() => {
    return new Big(10).pow(metadata?.decimals ?? 0);
  }, [metadata?.decimals]);

  const formattedBalance = useMemo(() => {
    if (!metadata) {
      return "-";
    }

    return stakedTokens.div(decimals).toFixed(2);
  }, [stakedTokens, decimals]);

  return (
    <div
      className="
        rounded-[20px]
        bg-[rgba(255,_255,_255,_0.1)] 
        max-w-[548px] h-max flex-1
        member-area relative px-[24px] pt-[16px] pb-[26px]
      "
    >
      {!accountId && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-white/[.25] backdrop-blur-[3px] z-[20]">
          <span className="text-[18px] font-[800] leading-[17px] tracking-[-0.03em] text-[#431E5A] uppercase">
            Connect Wallet
          </span>
        </div>
      )}
      {!isEmpty(stepItems) && (
        <Tutorial
          items={stepItems || []}
          options={{
            hidePrev: true,
            hideNext: true,
            showStepNumbers: true,
            stepNumbersOfLabel: "/",
          }}
        />
      )}
      <div className="flex flex-col h-full">
        <div className="mb-[15px]">
          <span className="text-[14px] font-[800] leading-[17px] tracking-[-0.03em]">
            Jump Pad Allocation Tier
          </span>
        </div>

        <div className="mb-[22px] flex justify-between space-x-[17px] ">
          <div className="flex-1 bg-[rgba(252,252,252,0.2)] pt-[10px] pb-[22px] px-[18px] rounded-[10px] tier-box">
            <div className="mb-[5px]">
              <span className="font-[600] text-[14px] leading-[17px] tracking-[-0.03em]">
                Current Tier
              </span>
            </div>

            <div>
              <span
                className={twMerge(
                  "font-[800] text-[16px] leading-[19px] tracking-[-0.03em]",
                  [level ? tiers[level].class : "text-white"]
                )}
                children={level ? tiers[level].name : "-"}
              />
            </div>
          </div>

          <div className="flex-1 bg-[rgba(252,252,252,0.2)] pt-[10px] pb-[22px] px-[18px] rounded-[10px]  allocation-tier-box">
            <div className="mb-[5px]">
              <span className="font-[600] text-[14px] leading-[17px] tracking-[-0.03em]">
                Allocation tier
              </span>
            </div>

            <div>
              <span
                children={parseInt(totalAllowance) > 0 ? totalAllowance : "-"}
                className="text-[24px] font-[800] leading-[29px] tracking-[-0.03em] text-white"
              />
            </div>
          </div>

          <div className="flex-1 bg-[rgba(252,252,252,0.2)] pt-[10px] pb-[22px] px-[18px] rounded-[10px] jump-staked-box">
            <div className="mb-[5px]">
              <span className="font-[600] text-[14px] leading-[17px] tracking-[-0.03em]">
                xJUMP staked
              </span>
            </div>

            <div>
              <span
                children={formattedBalance}
                className="text-[24px] font-[800] leading-[29px] tracking-[-0.03em] text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between space-x-[26px]">
          <div className="flex-1">
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#894DA0] rounded-[9.5px] p-[10px] w-full hover:opacity-[0.8]"
            >
              <span className="text-[#FFFFFF] font-[600] text-[14px] leading-[18px]">
                Upgrade tier
              </span>
            </button>
          </div>

          <div className="flex-1">
            <button
              onClick={() => downgradeLevel()}
              // disabled={!level || isLocked || !accountId}
              className="bg-[#FFFFFF] rounded-[9.5px] p-[10px] w-full hover:opacity-[0.8] disabled:cursor-not-allowed disabled:opacity-[.5]"
            >
              {isLocked ? (
                <span
                  children={format(endVesting, "MM/dd/yyyy HH:mm")}
                  className="text-[#431E5A] font-[600] text-[14px] leading-[18px]"
                />
              ) : (
                <span className="text-[#431E5A] font-[600] text-[14px] leading-[18px]">
                  Withdraw tokens
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showModal}
        investor={investor}
        baseToken={{ metadata, balance }}
        launchpadSettings={launchpadSettings}
        onClose={() => setShowModal(!showModal)}
      />
    </div>
  );
}
