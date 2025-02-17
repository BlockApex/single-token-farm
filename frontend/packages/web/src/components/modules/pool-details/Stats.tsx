import React from "react";
import { formatNumberWithSuffix , convertTokenAmountWithDecimal, toReadableNumber} from "@/utils/conversion";


const Stats = ({pool}) => {
  return (
    <div className="w-full h-auto rounded-lg bg-white-600 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-center flex-wrap gap-6 py-6 px-4">
        <section className="w-full md:w-auto md:min-w-[220px] flex flex-col items-center justify-center rounded-md bg-white-600 px-10 py-8">
          <p className="text-white-400 font-bold text-md">TVL</p>
          <h1 className="text-2xl tracking-tighter font-bold leading-6 mt-2">
            ${formatNumberWithSuffix(pool?.tvl)}
          </h1>
        </section>
        <section className="w-full md:w-auto md:min-w-[220px] flex flex-col items-center justify-center rounded-md bg-white-600 px-10 py-8">
          <p className="text-white-400 font-bold text-md">Volume(24h)</p>
          <h1 className="text-2xl tracking-tighter font-bold leading-6 mt-2">
          ${formatNumberWithSuffix(pool?.volume_24h)}
          </h1>
        </section>
        <section className="w-full md:w-auto md:min-w-[220px] flex flex-col items-center justify-center rounded-md bg-white-600 px-10 py-8">
          <p className="text-white-400 font-bold text-md">Fee(24h)</p>
          <h1 className="text-2xl tracking-tighter font-bold leading-6 mt-2">
          $ {formatNumberWithSuffix(pool?.fee_24h)}
          </h1>
        </section>
        <section className="w-full md:w-auto md:min-w-[220px] flex flex-col items-center justify-center rounded-md bg-white-600 px-10 py-8">
          <p className="text-white-400 font-bold text-md">APR</p>
          <h1 className="text-2xl tracking-tighter font-bold leading-6 mt-2">
          {pool?.apr ? pool?.apr:"0"}%
          </h1>
        </section>
      </div>
    </div>
  );
};

export default Stats;
