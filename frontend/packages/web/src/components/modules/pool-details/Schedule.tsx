import React, { useState } from "react";
import { format } from 'date-fns';
import { Token } from "@/assets/svg/token";
import { Collapse } from "@chakra-ui/react";
import { IconButton } from "@/components";
import { BigChevron } from "@/assets/svg";
import { TokenLogo, InfoTooltip } from "@/components/shared";
import { Button } from "@/components";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import Lock from "./Lock";
import UnLock from "./UnLock";
import { useGetAllLocks, useGetUserLocks } from "@/hooks/modules/pools";
import { useWalletSelector } from "@/context/wallet-selector";
import {
  formatNumberWithSuffix,
  convertTokenAmountWithDecimal,
} from "@/utils/conversion";
import BigNumber from "bignumber.js";
import Big from 'big.js';
import { formatPercentage } from "@/utils/conversion";


const Schedule = ({ lps, pool }) => {
  const { accountId, selector } = useWalletSelector();
  const [show, setShow] = useState(true);
  const [lockOpen, setLockOpen] = useState(false);
  const [unlockOpen, setunLockOpen] = useState(false);
  const { locks, error, loading } = useGetAllLocks(pool?.id);
  const {
    lock,
    loading: lockLoading,
    error: lockError,
  } = useGetUserLocks(accountId!, pool?.id);


  const calculateTotalPercent = (value: string) => {
    let { shares_total_supply } = pool;
    let percent = '0';
    let displayPercent = '0%';

    if (value === "0") {
      return {
        percent,
        displayPercent,
      };
    }
    if (Big(shares_total_supply || '0').gt(0)) {
      percent = Big(value).div(shares_total_supply).mul(100).toFixed();
      displayPercent = formatPercentage(percent);
    }
    return {
      percent,
      displayPercent,
    };
  }


  const calculateUserPercentage = () => {
    let percent = '0';
    let displayPercent = '0%';

    // Check if locked_balance or locks are zero
    if (lock?.locked_balance === "0" || locks.toString() === "0") {
      return {
        percent,
        displayPercent,
      };
    }

    // Ensure both values are treated as Big numbers and strings
    const lockedBalance = Big(lock?.locked_balance || '0');
    const totalLocks = Big(locks?.toString() || '0');

    // Perform calculations using big.js methods
    if (totalLocks.gt(0)) {
      percent = lockedBalance.div(totalLocks).times(100).toFixed(2); // Perform division and multiplication
      displayPercent = `${percent}%`; // Format as percentage
    }

    return {
      percent,
      displayPercent,
    };
  };

  const calculateTime = () => {
    if (lock && lock?.unlock_time_sec && lock?.unlock_time_sec > 0) {
      const timestampInMilliseconds = lock?.unlock_time_sec * 1000;
      const date = new Date(timestampInMilliseconds);
      const formattedDate = format(date, 'yyyy/MM/dd HH:mm');
      return formattedDate;
    } else {
      return "-"
    }
  }

  const checkExpiry = () => {
    if (lock && lock?.unlock_time_sec && lock?.unlock_time_sec > 0) {
      const timestampInMilliseconds = lock?.unlock_time_sec * 1000;
      const current = new Date().getTime();
      if (current >= timestampInMilliseconds) {
        return false;
      } else {
        return true;
      }
    }
  }

  const TooltipContent = () => {
    return (
      <div className="p-2">
        <ul className="list-disc list-inside">
          <li>
            LP locking is not investment advice and doesn't ensure total fund
            safety. Significant risks remain if the project team holds many
            tokens.
          </li>
          <li className="mt-4">
            Locking LP yields no returns; ordinary users need not participate.
          </li>
        </ul>
      </div>
    );
  };
  return (
    <div className="w-full h-auto rounded-lg bg-white-600 p-6 md:p-8 mb-6">
      <section className="w-full flex items-center justify-between">
        <h1 className="text-3xl tracking-tighter font-bold leading-6 flex items-center">
          Locking Schedule
          <InfoTooltip label={<TooltipContent />}>
            <span className="ml-2 ">
              <QuestionMarkOutlinedIcon className="w-4 h-4" />
            </span>
          </InfoTooltip>
        </h1>
        <button onClick={() => setShow(!show)}>
          <BigChevron className={show ? "" : "rotate-180"} />
        </button>
      </section>
      <Collapse in={show}>
        <div className="w-full h-auto mt-6">
          <section className="w-full grid grid-cols-2  md:grid-cols-4 gap-8 bg-white-600 rounded-lg py-6 px-6 md:px-10">
            <div className="flex flex-col items-start justify-start">
              <p className="text-white font-bold text-md">Overall Locking</p>
              <p className="text-white font-bold text-md mt-4">{calculateTotalPercent(locks.toString())?.displayPercent}</p>
            </div>
            <div className="flex flex-col items-start justify-start">
              <p className="text-white font-bold text-md">My Locking</p>
              <p className="text-[#CD7FF0] font-bold text-md mt-4">
                {calculateUserPercentage()?.displayPercent}
              </p>
            </div>
            <div className="flex items-center justify-start">
              {pool?.token0?.icon ? (
                <img
                  src={pool?.token0?.icon}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <Token width={30} height={30} />
              )}
              <p className="text-md text-white font-bold pl-2">
                {formatNumberWithSuffix(
                  convertTokenAmountWithDecimal(
                    pool?.amounts[0],
                    pool?.token0?.decimals
                  )
                )}
              </p>
            </div>
            <div className="flex items-center justify-start">
              {pool?.token1?.icon ? (
                <img
                  src={pool?.token1?.icon}
                  className="w-8 h-8 rounded-full -mt-1"
                />
              ) : (
                <Token width={30} height={30} className="" />
              )}
              <p className="text-md text-white font-bold pl-2">
                {formatNumberWithSuffix(
                  convertTokenAmountWithDecimal(
                    pool?.amounts[1],
                    pool?.token1?.decimals
                  )
                )}
              </p>
            </div>
          </section>
          <section className="flex flex-row items-start md:items-center justify-between bg-white-600 rounded-lg py-6 px-6 md:px-10 mt-4">
            <div className="flex flex-col items-start justify-start">
              <p className="text-white-400 font-bold text-md">My Locking</p>
              <p className="text-white font-bold text-md  mt-2 md:mt-4">
                {calculateUserPercentage()?.displayPercent}
              </p>
            </div>
            <div className="flex flex-col items-start justify-start">
              <p className="text-white-400 font-bold text-md">
                Expiration time
              </p>
              <p className="text-white font-bold text-md mt-2 md:mt-4">
                {calculateTime()}
              </p>
            </div>
            <div className="hidden  md:flex p-4  flex-col items-start md:items-center justify-center">
              <Button
                onClick={() => setLockOpen(true)}
                className="min-w-[150px]"
                disabled={lps <= 0}
              >
                Lock
              </Button>
              <Button
                onClick={() => setunLockOpen(true)}
                disabled={(lps <= 0 || lock?.locked_balance === "0" || checkExpiry())}
                outline
                className="min-w-[150px] mt-2 md:mt-6"
              >
                Unlock
              </Button>
            </div>
          </section>
          <div className="flex md:hidden items-center  justify-between gap-2 mt-4">
            <Button
              onClick={() => setLockOpen(true)}
              className="min-w-[130px]"
              disabled={lps <= 0}
            >
              Lock
            </Button>
            <Button
              onClick={() => setunLockOpen(true)}
              disabled={(lps <= 0 || lock?.locked_balance === "0" || checkExpiry())}
              outline
              className="min-w-[130px]"
            >
              Unlock
            </Button>
          </div>
        </div>
      </Collapse>
      <Lock open={lockOpen} setOpen={setLockOpen} lps={lps} pool={pool} />
      <UnLock open={unlockOpen} setOpen={setunLockOpen} lps={lock?.locked_balance} pool={pool} />
    </div>
  );
};

export default Schedule;
