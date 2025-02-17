import React, { useEffect, useState } from "react";
import { findTokenMetadata } from "@/helper/near";
import { formatNumberWithSuffix } from "@/utils/conversion";

const TokenNode = ({ address, tokenIn, amount }) => {
  const [token, setToken] = useState<null | any>(null);
  const [_amount, setAmount] = useState<any>("");

  const getMetadata = async (a: string) => {
    try {
      let token = await findTokenMetadata(a);
      setToken(token);
      if (amount) {
        let readableAmount = amount / 10 ** token.decimals;
        setAmount(readableAmount)
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (address) {
      getMetadata(address);
    }
  }, [address]);

  let isNear = tokenIn?.isNear



  return (
    <div className="bg-[#47272D] text-white rounded-lg px-3 py-2 text-sm font-bold  min-w-[160px]">
      {isNear ? (
        <div className="flex items-center justify-start">
          {tokenIn?.icon ? (
            <img src={tokenIn?.icon!} width={25} height={25} className="mr-2" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
          )}
          <p className="font-bold text-white text-sm">
            {formatNumberWithSuffix(_amount)}
            {" "}
            {tokenIn?.symbol}</p>
        </div>
      ) : (
        <div className="flex items-center justify-start">
          {token?.icon ? (
            <img src={token?.icon!} width={25} height={25} className="mr-2" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
          )}
          <p className="font-bold text-white text-sm">
            {formatNumberWithSuffix(_amount)}
            {" "}
            {token?.symbol}</p>
        </div>
      )}
    </div>
  );
};

export default TokenNode;
