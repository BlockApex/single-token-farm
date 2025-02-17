import { useState } from "react";
import { Text } from "@chakra-ui/react";
import { TableBody, Td } from "@/components/shared";
import LiquidityTableHead from "./LiquityTableHead";
import LiquidityRow from "./LiquidityRow";
import { TokenLogos } from "@/components/shared";
import AddLiquidity from "@/components/AddLiquidity";
import RemoveLiquidity from "@/components/RemoveLiquidity";
import FarmsCount from "./FarmsCount";
import Tokens from "./Tokens";

import { useNavigate } from "react-router";
import {
  toReadableNumber,
  formatNumberWithSuffix,
  convertTokenAmountWithDecimal,
} from "@/utils/conversion";

import {
  calculateLPPercentage,
  lpReadableValue,
  LP_TOKEN_DECIMALS,
} from "@/utils/pool-utils";
import BigNumber from "bignumber.js";

const MyLiquidityTable = ({ pools }) => {

  const navigate = useNavigate();

  const [addModal, setAddModal] = useState(false);
  const [removeModal, setRemoveModal] = useState(false);
  const [pool , setPool] = useState<null | any>(null);
  const [lps , setLps] = useState("")


  return (
    <div className="w-full pb-4">
      <LiquidityTableHead>
        <Td className="">
          <div className="text-white font-semibold text-sm">Pair</div>
        </Td>
        <Td className="hidden lg:flex">
          <></>
        </Td>
        <Td className="">
          <div className="text-white font-semibold text-sm">LP Tokens</div>
        </Td>
        <Td className="hidden lg:flex">
          <></>
        </Td>
        <Td className="hidden md:flex">
          <div className="text-white font-semibold text-sm">USD Value</div>
        </Td>
        <Td className="hidden md:flex">
          <></>
        </Td>
      </LiquidityTableHead>
      <TableBody>
        {pools.length ? (
          pools.map((pool, i) => {
            let lpBig = new BigNumber(pool?.user_shares);
            return (
              <LiquidityRow 
              onClick={() => navigate(`/pools/${pool?.id}`)}
              key={i}>
                <Td className="">
                  <div
                    className="flex items-center pl-0 md:pl-2 cursor-pointer"
                  >
                    <Tokens token0={pool?.token0} token1={pool.token1} />
                  </div>
                </Td>
                <Td className="hidden lg:flex">
                  <div className="flex flex-col cursor-pointer">
                    <p className="text-white font-bold text-sm">
                      {formatNumberWithSuffix(
                        convertTokenAmountWithDecimal(
                          pool?.amounts[0],
                          pool?.token0?.decimal
                        )
                      )}
                    </p>
                    <small className="text-white font-bold text-sm">
                      {formatNumberWithSuffix(
                        convertTokenAmountWithDecimal(
                          pool?.amounts[1],
                          pool?.token1?.decimal
                        )
                      )}
                    </small>
                  </div>
                </Td>
                <Td className="">
                  <div className="flex flex-col cursor-pointer">
                    <p className="text-white font-bold text-sm">
                      {lpReadableValue(LP_TOKEN_DECIMALS, lpBig)}
                    </p>
                    <small className="text-white font-bold text-sm">
                      (
                      {calculateLPPercentage(
                        pool?.user_shares,
                        pool?.shares_total_supply
                      )}
                      %)
                    </small>
                  </div>
                </Td>
                <Td className="hidden lg:flex">
                  <FarmsCount pool={pool} />
                </Td>
                <Td className="hidden md:flex">
                  <p className="text-white font-bold text-sm">
                    $
                    {formatNumberWithSuffix(
                      pool?.dollar_values?.total_dollar_value
                    )}
                  </p>
                </Td>
                <Td className="hidden md:flex">
                  <div className="flex flex-col items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLps(pool?.user_shares)
                        setPool(pool)
                        setAddModal(true)
                      }}
                      className="bg-[#CD7FF0] text-white font-bold text-sm min-w-[150px] rounded-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLps(pool?.user_shares)
                        setPool(pool)
                        setRemoveModal(true)
                      }}
                      className="bg-[transparent] border-[#CD7FF0] border-2 text-white font-bold text-sm min-w-[150px] rounded-sm mt-3"
                    >
                      Remove
                    </button>
                  </div>
                </Td>
              </LiquidityRow>
            );
          })
        ) : (
          <div className="flex items-center justify-center mt-8">
            <Text fontWeight="extrabold">No Data Found</Text>
          </div>
        )} 
      </TableBody>
       {pool  && <AddLiquidity open={addModal} setOpen={setAddModal} pool={pool} />}
       {pool && parseFloat(lps) ? <RemoveLiquidity open={removeModal} setOpen={()=>{
        setPool(null)
        setRemoveModal(false)
       }} pool={pool} lps={lps} /> :""}
    </div>
  );
};

export default MyLiquidityTable;
