import React from "react";
import { TableBody, Td } from "@/components/shared";
import { Token } from "@/assets/svg/token";
import {convertTokenAmountWithDecimal , formatNumberWithSuffix } from "@/utils/conversion";

const PoolComposition = ({ pool }) => {
  const { token0, token1, amounts , dollar_values} = pool;
  return (
    <div className="w-full h-auto rounded-lg bg-white-600 p-6 md:p-8 mb-6">
      <section className="w-full flex items-center justify-between">
        <h1 className="text-3xl tracking-tighter font-bold leading-6">
          Pool Composition
        </h1>
      </section>
      <section className="mt-4 md:mt-6">
        <div className="bg-white-600 rounded-md py-1 px-3 grid lg:grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] grid-cols-[2fr_1fr] gap-4">
          <Td className="">
            <div className="text-white font-semibold text-sm">Token</div>
          </Td>
          <Td className="">
            <div className="text-white font-semibold text-sm">Amount</div>
          </Td>

          <Td className="hidden md:flex">
            <div className="text-white font-semibold text-sm">Value</div>
          </Td>
        </div>
        <TableBody>
          <div className="bg-white-600 rounded-md py-1 px-3 grid lg:grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] grid-cols-[2fr_1fr] gap-4 mt-4">
            <Td className="">
              <div className="text-white font-semibold text-sm">
                <div className="flex items-center justify-start">
                  {token0?.icon ? (
                    <img src={token0?.icon} className="w-9 h-9 rounded-full" />
                  ) : (
                    <Token width={40} height={40} />
                  )}
                  <p className="text-md text-white font-bold pl-2">
                    {token0?.symbol}
                  </p>
                </div>
              </div>
            </Td>
            <Td className="">
              <div className="text-white font-bold text-md">
                {formatNumberWithSuffix(
                  convertTokenAmountWithDecimal(
                    pool?.amounts[0],
                    pool?.token0?.decimals
                  )
                )}
              </div>
            </Td>

            <Td className="hidden md:flex">
              <div className="text-white font-bold text-md">
               ${formatNumberWithSuffix(dollar_values?.token0_value)}
              </div>
            </Td>
          </div>
          <div className="bg-white-600 rounded-md py-1 px-3 grid lg:grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] grid-cols-[2fr_1fr] gap-4 mt-4">
            <Td className="">
              <div className="text-white font-semibold text-sm">
                <div className="flex items-center justify-start">
                  {token1?.icon ? (
                    <img src={token1?.icon} className="w-9 h-9 rounded-full" />
                  ) : (
                    <Token width={40} height={40} />
                  )}
                  <p className="text-md text-white font-bold pl-2">
                    {token1?.symbol}
                  </p>
                </div>
              </div>
            </Td>
            <Td className="">
              <div className="text-white font-bold text-md">
              {formatNumberWithSuffix(
                  convertTokenAmountWithDecimal(
                    pool?.amounts[1],
                    pool?.token1?.decimals
                  )
                )}
              </div>
            </Td>

            <Td className="hidden md:flex">
              <div className="text-white font-bold text-md">
                ${formatNumberWithSuffix(dollar_values?.token1_value)}
              </div>
            </Td>
          </div>

        </TableBody>
      </section>
    </div>
  );
};

export default PoolComposition;
