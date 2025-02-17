import Big from "big.js";
import { useMemo } from "react";
import { useWalletSelector } from "@/context/wallet-selector";
import isBefore from "date-fns/isBefore";
import { useLaunchpadStore } from "@/stores/launchpad-store";
import { LaunchpadListing } from "@near/apollo";
import { investorAllocation } from "@/interfaces";

const CONNECT_WALLET_MESSAGE = "Connect Wallet";

const formatConfig = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};

export const ProjectInvestments = ({
  investorAllocation,
  investorAllowance,
  vestedAllocations,
  launchpadProject: {
    final_sale_2_timestamp,
    project_token_info,
    listing_id,
    price_token,
    project_token,
    total_amount_sale_project_tokens,
    project_allocations_sold,
    token_allocation_size,
  },
}: {
  vestedAllocations: any;
  investorAllowance: any;
  investorAllocation: investorAllocation;
  launchpadProject: Partial<LaunchpadListing>;
}) => {
  const { accountId, selector } = useWalletSelector();
  const { withdrawAllocations } = useLaunchpadStore();

  const formatNumber = (value, decimals, config: any = formatConfig) => {
    const decimalsBig = new Big(10).pow(Number(decimals) || 1);

    const formattedBig = new Big(value ?? 0).div(decimalsBig).toFixed(2);

    return new Intl.NumberFormat("en-US", config).format(Number(formattedBig));
  };

  const decimals = useMemo(() => {
    return new Big(Number(project_token_info?.decimals) ?? 0);
  }, [project_token_info]);

  const claimedAmount = useMemo(() => {
    return new Big(investorAllocation.totalTokensBought || 0);
  }, [investorAllocation]);

  const availableToClaim = useMemo(() => {
    return new Big(vestedAllocations || 0);
  }, [vestedAllocations]);

  const allocationSize = useMemo(() => {
    return new Big(token_allocation_size || 0);
  }, [token_allocation_size]);

  const allocationsBought = useMemo(() => {
    return new Big(investorAllocation?.allocationsBought || 0);
  }, [investorAllocation]);

  const totalAmount = useMemo(() => {
    const total = allocationsBought.mul(allocationSize);

    return (
      formatNumber(total.toString(), decimals) +
      " " +
      project_token_info?.symbol!
    );
  }, [claimedAmount, availableToClaim, decimals]);

  const allocationsAvailable = useMemo(() => {
    return new Big(investorAllowance || 0);
  }, [investorAllowance]);

  const enabledSale = useMemo(() => {
    const total = formatNumber(
      total_amount_sale_project_tokens,
      decimals
    ).replace(/,/g, "");
    const size = formatNumber(token_allocation_size, decimals).replace(
      /,/g,
      ""
    );
    const allocations_available = parseFloat(total) / parseFloat(size);

    const now = new Date();

    const endAt = new Date(Number(final_sale_2_timestamp!));
    const soldOut =
      allocations_available >= parseFloat(project_allocations_sold!);
    return isBefore(now, endAt) && !soldOut;
  }, [final_sale_2_timestamp]);

  const retrieveTokens = async () => {
    if (listing_id && price_token) {
      withdrawAllocations(listing_id!, project_token!, accountId!, selector);
    }
  };

  return (
    <div>
      <div className="flex space-x-[67px] mb-[32px]">
        <div>
          <div>
            <span className="text-[14px] font-[600] tracking-[-0.03em]">
              Total token amount
            </span>
          </div>

          <div>
            <span
              children={accountId ? totalAmount : CONNECT_WALLET_MESSAGE}
              className="font-[800] text-[24px] tracking-[-0.03em] text-[#E2E8F0]"
            />
          </div>
        </div>

        <div>
          <div>
            <span className="text-[14px] font-[600] tracking-[-0.03em]">
              Allocations bought
            </span>
          </div>

          <div>
            <span
              className="font-[800] text-[24px] tracking-[-0.03em] text-[#E2E8F0]"
              children={
                accountId
                  ? investorAllocation.allocationsBought ?? "0"
                  : CONNECT_WALLET_MESSAGE
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-[rgba(252,252,252,0.2)] rounded-[20px] pl-[25px] pr-[33px] py-[16px] flex space-between items-center">
        <div className="flex flex-1 space-x-[32px]">
          <div>
            <div>
              <span className="font-[600] text-[14px] tracking-[-0.03em]">
                Unlocked amount
              </span>
            </div>

            <div>
              <span
                className="font-[800] text-[24px] tracking-[-0.03em]"
                children={
                  accountId
                    ? formatNumber(availableToClaim, decimals) +
                      " " +
                      project_token_info?.symbol!
                    : CONNECT_WALLET_MESSAGE
                }
              />
            </div>

            <div>
              <span className="font-[600] text-[14px] tracking-[-0.03em] text-[rgba(255,255,255,0.75)]">
                Available to claim
              </span>
            </div>
          </div>

          <div>
            <div>
              <span className="font-[600] text-[14px] tracking-[-0.03em]">
                Claimed Amount
              </span>
            </div>

            <div>
              <span
                children={
                  accountId
                    ? formatNumber(claimedAmount, decimals) +
                      " " +
                      project_token_info?.symbol!
                    : CONNECT_WALLET_MESSAGE
                }
                className="font-[800] text-[24px] tracking-[-0.03em]"
              />
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => retrieveTokens()}
            disabled={enabledSale || vestedAllocations === "0" || !accountId}
            className="py-[16px] px-[32px] rounded-[10px] bg-white disabled:opacity-[0.5] disabled:cursor-not-allowed"
          >
            <span className="font-[600] text-[14px] tracking-[-0.04em] text-[#431E5A]">
              Withdraw
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectInvestments;
