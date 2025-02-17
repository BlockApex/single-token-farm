import Big from "big.js";
import { StatusEnum } from "@near/apollo";
import { useMemo } from "react";
import Badge from "./badge";
import format from "date-fns/format";
import isBefore from "date-fns/isBefore";
import { getUTCDate } from "@near/ts";
import { RocketIcon } from "@/assets/svg/rocket";
import { useNavigate } from "react-router";
import { JumpGradient } from "@/assets/svg";
import { useTokenMetadata } from "@/hooks/modules/token";
import { LaunchpadListing } from "@near/apollo";

const closedArray = [
  "sale_finalized",
  "pool_created",
  "pool_project_token_sent",
  "pool_price_token_sent",
  "liquidity_pool_finalized",
];

/* const formatConfig = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}; */

export const ProjectCard = ({
  status,
  listing_id,
  project_name,
  price_token,
  project_token_info,
  public: publicProject,
  open_sale_1_timestamp,
  final_sale_2_timestamp,
  project_allocations_sold,
  token_allocation_price = "0",
  token_allocation_size = "1",
  project_total_amount_sale_project_tokens = "0",
}: Partial<LaunchpadListing> & {
  public: boolean;
  project_allocations_sold: string;
  project_total_amount_sale_project_tokens: string;
}) => {
  const navigate = useNavigate();

  const { data: metadataPriceToken, loading: laodingPriceTokenMetadata } =
    useTokenMetadata(price_token!);

  const openSale = useMemo(() => {
    return getUTCDate(Number(open_sale_1_timestamp));
  }, [open_sale_1_timestamp]);

  const finalSale = useMemo(() => {
    return getUTCDate(Number(final_sale_2_timestamp));
  }, [final_sale_2_timestamp]);
  //TODO: fix this
  const projectStatus = useMemo(() => {
    if (status !== "funded" && closedArray.includes(status!)) {
      return StatusEnum.Closed;
    }

    const now = getUTCDate();

    if (status === "funded" && isBefore(now, openSale)) {
      return StatusEnum.Waiting;
    }

    if (status === "funded" && isBefore(finalSale, now)) {
      return StatusEnum.Closed;
    }

    if (
      status === "funded" &&
      isBefore(openSale, now) &&
      isBefore(now, finalSale)
    ) {
      return StatusEnum.Open;
    }

    return StatusEnum.Open;
  }, [status, openSale, finalSale]);

  const totalAmount = useMemo(() => {
    return new Big(project_total_amount_sale_project_tokens || 0).div(
      token_allocation_size || 1
    );
  }, [project_total_amount_sale_project_tokens, token_allocation_size]);

  const formatNumber = (value, decimals, config?) => {
    const decimalsBig = new Big(10).pow(Number(decimals) || 1);

    const formattedBig = new Big(value || 0).div(decimalsBig).toFixed(12);

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 12,
      ...config,
    }).format(Number(formattedBig));
  };

  const allocationsSold = useMemo(() => {
    return new Big(project_allocations_sold ?? 0);
  }, [project_allocations_sold]);

  const progress = useMemo(() => {
    return allocationsSold.mul(100).div(totalAmount).toFixed(2);
  }, [
    project_allocations_sold,
    project_total_amount_sale_project_tokens,
    project_token_info,
  ]);

  const allocationPrice = useMemo(() => {
    return new Big(token_allocation_price || 0);
  }, [token_allocation_price]);

  const totalRaise = useMemo(() => {
    return allocationsSold.mul(allocationPrice);
  }, [allocationsSold, allocationPrice]);

  const tokensForSale = useMemo(() => {
    return `${formatNumber(
      project_total_amount_sale_project_tokens,
      project_token_info?.decimals,
      {
        notation: "compact",
        compactDisplay: "long",
      }
    )} ${project_token_info?.symbol}`;
  }, [project_total_amount_sale_project_tokens, project_token_info]);

  const tokenPrice = useMemo(() => {
    const parsed_token_allocation_price = parseFloat(
      formatNumber(
        token_allocation_price,
        metadataPriceToken?.decimals
      ).replace(/,/g, "")
    );
    const parsed_token_allocation_size = parseFloat(
      formatNumber(token_allocation_size, project_token_info?.decimals).replace(
        /,/g,
        ""
      )
    );

    const price = parsed_token_allocation_price / parsed_token_allocation_size;

    return price;
  }, [token_allocation_price, token_allocation_size, metadataPriceToken]);

  return (
    <div
      className="
        relative
        bg-[#FFFFFF]/[.10] 
        border-box
        min-w-[313px] w-[313px]
        rounded-[9.37553px]
        px-[18.75px] pt-[35px] pb-[23px]
        font-sans
      "
    >
      <div className="absolute right-[19px] top-[20px] flex space-x-[8px]">
        <Badge type={projectStatus} />

        {!publicProject && <Badge type="whitelist" />}
      </div>

      <div className="flex space-x-[6.25px] mb-[24px]">
        <div>
          <img
            src={project_token_info?.image ?? ""}
            alt={project_token_info?.name ?? "Token"}
            className="w-[45px] h-[45px] rounded-full"
          />
        </div>

        <div>
          <div className="mb-[-4px]">
            <span className="text-white text-[16px] font-[700] tracking-[-0.04em]">
              {project_name}
            </span>
          </div>

          <div>
            <span className="text-[13px] font-[600] text-white opacity-[0.5] leading-[6px] tracking-[-0.04em]">
              {project_token_info?.name}
            </span>
          </div>
        </div>
      </div>

      {[StatusEnum.Open, StatusEnum.Closed].includes(projectStatus) && (
        <>
          <div className="mb-[24px]">
            <div>
              <span className="text-white text-[12px] tracking-[-0.04em] font-[700]">
                Total raised amount
              </span>
            </div>

            <div className="mb-[16px]">
              <span className="text-[20px] font-[700] tracking-[-0.04em]">
                {`$ ${formatNumber(totalRaise, metadataPriceToken?.decimals)} ${
                  metadataPriceToken?.symbol
                }`}
              </span>
            </div>

            <div>
              <div className="mb-[6px] text-end">
                <span className="text-white font-[700] text-[16px] tracking-[-0.04em]">
                  {progress + "%"}
                </span>
              </div>

              <div
                className="
                flex-grow
                rounded-[40px]
                bg-white/[.38]
              "
              >
                <div
                  style={{
                    width: progress + "%",
                  }}
                  className="
                  h-[6.25px]
                  rounded-[40px]
                  bg-[linear-gradient(90deg,_#AE00FF_0%,_#FF1100_100%)]
                "
                />
              </div>
            </div>
          </div>

          <div className="mb-[4px] flex space-x-[29px] items-center">
            <div className="w-[99px]">
              <span className="font-[700] text-[14px] tracking-[-0.04em]">
                Tokens for sale:
              </span>
            </div>

            <div
              className="truncate max-w-[145px] overflow-hidden"
              title={tokensForSale}
            >
              <span className="text-white font-[700] text-[15.6259px] tracking-[-0.04em]">
                {tokensForSale}
              </span>
            </div>
          </div>

          <div className="flex space-x-[29px] items-center mb-[16px]">
            <div className="w-[99px]">
              <span className="font-[700] text-[14px] tracking-[-0.04em]">
                Token Price:
              </span>
            </div>

            <div>
              <span className="text-white font-[700] text-[15.6259px] tracking-[-0.04em]">
                {/*
								TODO: The Calculation shouldn't be done here, just temporary fix

								*/}
                {tokenPrice} ${metadataPriceToken?.symbol}
              </span>
            </div>
          </div>
        </>
      )}

      {projectStatus === StatusEnum.Waiting && (
        <>
          <div
            className="
              relative
              px-[22px]
              mb-[44px]
              w-full h-[85px] 
              rounded-[9.17099px] 
              space-x-[5px]
              flex items-center justify-start
              bg-[linear-gradient(90deg,_#510B72_0%,_#740B0B_100%)]
            "
          >
            <div>
              <RocketIcon />
            </div>

            <div>
              <span className="font-[700] text-[16px] tracking-[-0.04em] text-[#E2E8F0]">
                Coming soon
              </span>
            </div>

            <div className="absolute right-0 bottom-0">
              <JumpGradient />
            </div>
          </div>

          <div
            className="
              w-full 
              flex justify-center items-center 
              bg-[#20002E] 
              py-[4px] 
              rounded-[10px] mb-[8px] space-x-[29px]
            "
          >
            <div>
              <span className="font-[700] text-[14px] tracking-[-0.04em]">
                Sales start:
              </span>
            </div>

            <div>
              <span className="text-[#E2E8F0] font-[700] text-[14px] tracking-[-0.04em]">
                {format(openSale, "MM/dd/yy HH:mm")} GMT
              </span>
            </div>
          </div>
        </>
      )}

      <div className="bg-[#20002E] rounded-[10px] px-[16px] py-[24px] mb-[20px] h-[100px]">
        {projectStatus === StatusEnum.Closed ? (
          <div className="h-full w-full flex items-center justify-center">
            <span className="font-[700] text-[14px] tracking-[-0.04em]">
              Sales closed
            </span>
          </div>
        ) : (
          <>
            <div className="mb-[4px] flex space-x-[29px] items-center">
              <div className="w-[80px]">
                <span className="font-[700] text-[14px] tracking-[-0.04em]">
                  Sales start:
                </span>
              </div>

              <div>
                <span className="text-[#E2E8F0] font-[700] text-[14px] tracking-[-0.04em]">
                  {format(openSale, "MM/dd/yy HH:mm")} GMT
                </span>
              </div>
            </div>

            <div className="flex space-x-[29px] items-center">
              <div className="w-[80px]">
                <span className="font-[700] text-[14pxx] tracking-[-0.04em]">
                  Sales end:
                </span>
              </div>

              <div>
                <span className="text-[#E2E8F0] font-[700] text-[14px] tracking-[-0.04em]">
                  {format(finalSale, "MM/dd/yy HH:mm")} GMT
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => navigate("/projects/" + listing_id)}
          className="rounded-[8.5px] bg-[#6E3A85] py-[9px] px-[33px] hover:opacity-[.8]"
        >
          <span className="font-[700] text-[12px] relative top-[-2px]">
            Join project
          </span>
        </button>
      </div>
    </div>
  );
};
