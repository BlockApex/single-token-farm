import React, { useState, useEffect } from "react";
import { formatValueInDecimals , formatNumberWithSuffix} from "@/utils/conversion";
import { useWalletSelector } from "@/context/wallet-selector";
import { TokenMetadataType } from "@/utils/types";

const Balance = ({ connectedAccount, token }) => {
  const { accountId } = useWalletSelector();
  const [balance, setBalance] = useState("");

  const getBalance = async (token: TokenMetadataType) => {
    console.log(accountId , "accountidddddd")
    if (connectedAccount && token) {
      let isNear = token.isNear;
      let balance;
      if (isNear === true) {
        balance = (await connectedAccount.getAccountBalance()).available;
      } else {
        balance = await connectedAccount.viewFunction(
          token.address,
          "ft_balance_of",
          { account_id: accountId }
        );
      }
      const formattedBalance = formatValueInDecimals(
        balance,
        isNear ? 24 : token.decimals
      );
      setBalance(formattedBalance);
    } else {
      setBalance("0");
    }
  };

  useEffect(() => {
    if(accountId && connectedAccount){
      getBalance(token);
    }
  }, [connectedAccount, accountId]);

  return <div>{formatNumberWithSuffix(parseFloat(balance))}</div>;
};

export default Balance;
