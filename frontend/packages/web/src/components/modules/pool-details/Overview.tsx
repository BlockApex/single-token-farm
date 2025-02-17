import React, { useState, useEffect, MouseEvent } from "react";
import { Token } from "@/assets/svg/token";
import { Button } from "@/components";
import { Spinner } from "@chakra-ui/react";
import AddLiquidity from "@/components/AddLiquidity";
import RemoveLiquidity from "@/components/RemoveLiquidity";
import { Star } from "@/assets/svg/Star";
import { Text } from "@chakra-ui/react";
import {
  toReadableNumber,
  formatNumberWithSuffix,
  convertTokenAmountWithDecimal,
} from "@/utils/conversion";
import { calculateLPPercentage, lpReadableValue, LP_TOKEN_DECIMALS } from "@/utils/pool-utils";
import BigNumber from "bignumber.js";

const Overview = ({ pool, lps, accountId, statsLoading, stats }) => {

  const [addModal, setAddModal] = useState(false);
  const [removeModal, setRemoveModal] = useState(false);
  const [fav, setFav] = useState(false);
  const { token0, token1, amounts, shares_total_supply } = pool;
  let token0Amount = toReadableNumber(token0.decimals, amounts[0]);
  let token1Amount = toReadableNumber(token1.decimals, amounts[1]);

  let lpBig = new BigNumber(lps);


  useEffect(() => {
    const favoritePools: any[] = JSON.parse(localStorage.getItem("favoritePools") || "[]");
    if (favoritePools?.some(favPool => favPool.id === pool.id)) {
      setFav(true);
    }
  }, [pool.id]);

  const handleFavoriteClick = (e: MouseEvent<SVGElement>) => {
    e.stopPropagation();
    const favoritePools: any[] = JSON.parse(localStorage.getItem("favoritePools") || "[]");

    if (fav) {
      // Remove from favorites
      const updatedFavorites = favoritePools.filter(p => p?.id !== pool?.id);
      localStorage.setItem("favoritePools", JSON.stringify(updatedFavorites));
      setFav(false);
    } else {
      // Add to favorites
      favoritePools.push(pool);
      localStorage.setItem("favoritePools", JSON.stringify(favoritePools));
      setFav(true);
    }
  };



  return (
    <div className="w-full h-auto rounded-lg bg-white-600 mb-6">
      <div className="grid md:grid-cols-12 gap-4 p-4">
        <section className="w-full p-2 md:p-4 flex items-center justify-start col-span-12 lg:col-span-5">
          <div className="flex items-start justify-start">
            <div className="flex items-center justify-start">
              {pool?.token0?.icon ? (
                <img
                  src={pool?.token0?.icon}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <Token width={50} height={50} />
              )}
              {pool?.token1?.icon ? (
                <img
                  src={pool?.token1?.icon}
                  className="w-12 h-12 rounded-full -ml-2"
                />
              ) : (
                <Token width={50} height={50} className="-ml-2" />
              )}
            </div>
            <div className="flex flex-col items-start justify-start pl-4">
              <h2 className="text-2xl tracking-tighter font-bold leading-6 flex items-center">
                {pool?.token0?.symbol}-{pool?.token1?.symbol}
                <Star
                  filled={fav}
                  onClick={handleFavoriteClick}
                  width={25}
                  height={25}
                  className="cursor-pointer ml-2"
                />
              </h2>
              <p className="text-white font-normal text-sm mt-2">
                1 {pool?.token0?.symbol} ={" "}
                {formatNumberWithSuffix(parseFloat(token1Amount) / parseFloat(token0Amount))}{" "}
                {pool?.token1?.symbol}
              </p>
            </div>
          </div>
        </section>
        <section className="w-full col-span-12 lg:col-span-4">
          {/* 1st SEC */}
          <div className="w-full flex items-start justify-between md:justify-start gap-10">
            <div>
              <p className="text-white font-bold text-sm mt-2">
                Your Liquidity
              </p>
              <p className="text-[rgba(255, 255, 255, 0.70)] font-bold text-sm mt-2">
                {lps > 0 ? lpReadableValue(LP_TOKEN_DECIMALS, lpBig) : "0.00"}
                <p className="text-[rgba(255, 255, 255, 0.70)] font-bold text-sm">
                  ({calculateLPPercentage(lps, shares_total_supply)}%)
                </p>
              </p>
            </div>
            <div className="">
              <p className="text-white font-bold text-sm mt-2">
                Estimated Value
              </p>
              <p className="text-[rgba(255, 255, 255, 0.70)] font-bold text-sm mt-2">
                {stats  ? `$${formatNumberWithSuffix(stats)}` : ''}
                {stats === 0 ? "$0":""}
                {statsLoading ? <Spinner /> : ""}
              </p>
            </div>
          </div>
          {/* 2nd SEC */}
          <div className="w-full flex items-center justify-between md:justify-start gap-10  mt-6">
            <div className="flex items-center justify-start">
              <div>
                {pool?.token0?.icon ? (
                  <img
                    src={pool?.token0?.icon}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <Token width={30} height={30} />
                )}
                {pool?.token1?.icon ? (
                  <img
                    src={pool?.token1?.icon}
                    className="w-8 h-8 rounded-full -mt-1"
                  />
                ) : (
                  <Token width={30} height={30} className="-mt-1" />
                )}
              </div>
              <div className="flex flex-col items-center justify-start gap-3">
                <p className="text-md text-white font-bold pl-2">
                  {pool?.token0?.symbol}
                </p>
                <p className="text-md text-white font-bold pl-2">
                  {pool?.token1?.symbol}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-start gap-3">
              <p className="text-md text-[rgba(255, 255, 255, 0.70)] font-bold  pl-2">
                {formatNumberWithSuffix(
                  convertTokenAmountWithDecimal(
                    pool?.amounts[0],
                    pool?.token0?.decimals
                  )
                )}
              </p>
              <p className="text-md text-[rgba(255, 255, 255, 0.70)] font-bold  pl-2">
                {formatNumberWithSuffix(
                  convertTokenAmountWithDecimal(
                    pool?.amounts[1],
                    pool?.token1?.decimals
                  )
                )}
              </p>
            </div>
          </div>
          {/* 3rd section */}
          {/* <div className="w-full flex items-center justify-between md:justify-start gap-10 mt-3">
            <div className="flex items-center justify-start">
              <TokenLogo size={35} />
              <p className="text-md text-white font-bold pl-2">USDC</p>
            </div>
            <div className="flex items-center justify-start">
              <p className="text-md text-white-400 font-bold  pl-2">23.000K</p>
            </div>
          </div> */}
        </section>
        <section className="w-full h-full pr-4 flex flex-col items-start md:items-center justify-center col-span-12 lg:col-span-3">
          {accountId ? (
            <Button big full onClick={() => setAddModal(true)}>
              Add Liquidity
            </Button>
          ) : (
            <div className="flex items-center justify-center mt-8" >
              <Text fontWeight="extrabold">Connect your wallet</Text>
            </div>
          )}

          {lps > 0 ? (
            <Button
              outline
              full
              big
              className="mt-2 md:mt-6"
              onClick={() => setRemoveModal(true)}
            >
              Remove Liquidity
            </Button>
          ) : (
            ""
          )}
        </section>
      </div>
      <AddLiquidity pool={pool} open={addModal} setOpen={setAddModal} />
      <RemoveLiquidity
        lps={lps}
        pool={pool}
        open={removeModal}
        setOpen={() => {
          setRemoveModal(false)
        }}
      />
    </div>
  );
};

export default Overview;
