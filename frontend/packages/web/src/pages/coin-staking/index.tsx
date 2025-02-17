import { useCallback, useEffect, useMemo, useState } from "react";
import { useWalletSelector } from "@/context/wallet-selector";
import { X_JUMP_TOKEN, JUMP_TOKEN } from "@/env/contract";
import {
  useTokenBalance,
  useTokenMetadata,
  useTokenRatio,
} from "@/hooks/modules/token";
import {
  JUMP_YEARLY_DISTRIBUTION_COMPROMISE,
  XJUMP_BASE_TOKEN_RATIO,
  XJUMP_BASE_USDT_TOKEN_RATIO,
  XJUMP_BASE_XTOKEN_RATIO,
  XJUMP_TETHER_TOKEN,
  TODAY_DATE_TIMESTAMP,
  WEEK_BEFORE_TIMESTAMP,
  MONTH_BEFORE_TIMESTAMP,
} from "./Staking.config";
import { useStaking } from "@/stores/staking-store";
import { getDecimals } from "@/tools";
import StakingComponent from "@/pages/coin-staking/Staking.component";
import Big from "big.js";
import toast from "react-hot-toast/headless";
import { useQuery } from "@apollo/client";
import { viewFunction } from "../../tools/modules/near";
import { XJumpProjectDocument, XJumpProjectQueryVariables } from "@near/apollo";
import { format } from "date-fns";

function Staking() {
  const { accountId, selector, token } = useWalletSelector();
  const [xJumpRatioRaw, setXJumpRatioRaw] = useState("0");
  const [baseTokenRatioRaw, setBaseTokenRatioRaw] = useState("0");
  const [chartObj, setChartObj] = useState({});

  const [tutorialModal, setTutorialModal] = useState<boolean>(false);
  const [tutorialGuide, setTutorialGuide] = useState<boolean>(false);
  const [dashboardTab, setDashboardTab] = useState<number>(0);
  const { stakeXToken: stakeXJumpToken, burnXToken: unstakeXJumpToken } =
    useStaking();

  const queryVariables: XJumpProjectQueryVariables = useMemo(() => {
    return {
      timestamp: TODAY_DATE_TIMESTAMP,
    };
  }, [TODAY_DATE_TIMESTAMP]);

  const { data: XTokenRatio } = useQuery(XJumpProjectDocument, {
    variables: queryVariables,
  });

  useEffect(() => {
    function createChartObj() {
      const monthValues: any = [];
      const monthDates: any = [];
      const weekValues: any = [];
      const weekDates: any = [];
      const yearValues: any = [];
      const yearDates: any = [];
      const data = XTokenRatio?.get_historical_ratio;

      if (data?.length > 0) {
        data?.map((item) => {
          yearValues.push(
            Number(
              new Big(item.x_token_amount)
                .div(item.base_token_amount)
                .toFixed(2)
            )
          );
          yearDates.push(
            format(new Date(Number(item.time_event)), "MM/dd/yyyy")
          );
          if (new Big(item.time_event).gte(new Big(WEEK_BEFORE_TIMESTAMP))) {
            weekValues.push(
              Number(
                new Big(item.x_token_amount)
                  .div(item.base_token_amount)
                  .toFixed(2)
              )
            );
            weekDates.push(
              format(new Date(Number(item.time_event)), "MM/dd/yyyy")
            );
          }
          if (new Big(item.time_event).gte(new Big(MONTH_BEFORE_TIMESTAMP))) {
            monthValues.push(
              Number(
                new Big(item.x_token_amount)
                  .div(item.base_token_amount)
                  .toFixed(2)
              )
            );
            monthDates.push(
              format(new Date(Number(item.time_event)), "MM/dd/yyyy")
            );
          }
        });

        setChartObj({
          day: {
            value: [
              Number(
                new Big(XTokenRatio?.get_historical_ratio[0]?.x_token_amount)
                  .div(XTokenRatio?.get_historical_ratio[0]?.base_token_amount)
                  .toFixed(2)
              ) || 0,
            ],
            date: [
              format(
                new Date(
                  Number(XTokenRatio?.get_historical_ratio[0]?.time_event)
                ),
                "MM/dd/yyyy"
              ) || "",
            ],
          },
          week: {
            value: weekValues.reverse(),
            date: weekDates.reverse(),
          },
          month: {
            value: monthValues.reverse(),
            date: monthDates.reverse(),
          },
          year: {
            value: monthValues.reverse(),
            date: monthDates.reverse(),
          },
        });
      }
    }

    createChartObj();
  }, []);

  useEffect(() => {
    const fetchXJumpRatio = async () => {
      const data = await viewFunction(
        selector,
        X_JUMP_TOKEN,
        "view_token_ratio"
      );
      setXJumpRatioRaw(data?.x_token);
      setBaseTokenRatioRaw(data?.base_token);
    };

    fetchXJumpRatio();
  }, []);

  // Blockchain Data
  // const {
  //   data: { x_token: rawRatioTetherToken = XJUMP_BASE_USDT_TOKEN_RATIO } = {},
  //   loading: loadingTetherRatio,
  // } = useTokenRatio(XJUMP_TETHER_TOKEN);

  const {
    data: rawBalanceXJumpToken = "0",
    loading: loadingBalanceXJumpToken,
  } = useTokenBalance(X_JUMP_TOKEN, accountId);

  // Calculating balances
  const rawRawBalanceXJumpToken = useMemo(
    () => rawBalanceXJumpToken || "0",
    [rawBalanceXJumpToken]
  );

  const jumpTokenBalance = useMemo(
    () => token?.balance || "0",
    [token?.balance]
  );

  const jumpToken = useMemo(() => {
    return baseTokenRatioRaw === "0" ? "1" : baseTokenRatioRaw;
  }, [baseTokenRatioRaw]);

  const xJumpToken = useMemo(() => {
    return xJumpRatioRaw === "0" ? "1" : xJumpRatioRaw;
  }, [xJumpRatioRaw]);

  // const tetherToken = useMemo(() => {
  //   return rawRatioTetherToken === "0" ? "1" : rawRatioTetherToken;
  // }, [rawRatioTetherToken]);

  const submitStaking = useCallback(
    async (amount: string) => {
      const deposit = calcAmountRaw(amount, token?.metadata?.decimals);

      try {
        await stakeXJumpToken(deposit, accountId!, selector);
      } catch (error) {
        console.warn(error);
      }
    },
    [accountId, token?.metadata]
  );

  const submitWithdraw = useCallback(
    async (amount: string) => {
      const withdraw = calcAmountRaw(amount, token?.metadata?.decimals);

      try {
        await unstakeXJumpToken(withdraw, accountId!, selector);
      } catch (error) {
        console.warn(error);
      }
    },
    [accountId, token?.metadata]
  );

  const isLoading = useMemo(() => {
    return loadingBalanceXJumpToken;
  }, [loadingBalanceXJumpToken]);

  // Calculating meaningful ratios
  const decimals = useMemo(() => {
    return getDecimals(token?.metadata?.decimals);
  }, [token?.metadata]);

  const ratioJumpToken = useMemo(() => {
    return parseToBigAndDivByDecimals(jumpToken, decimals);
  }, [jumpToken, decimals]);

  const ratioXJumpToken = useMemo(() => {
    return parseToBigAndDivByDecimals(xJumpToken, decimals);
  }, [xJumpToken, decimals]);

  // const ratioTetherToken = useMemo(() => {
  //   return parseToBigAndDivByDecimals(tetherToken, decimals);
  // }, [tetherToken, decimals]);

  const valueJumpToken = useMemo(() => {
    return divideAndParseToTwoDecimals(ratioXJumpToken, ratioJumpToken);
  }, [ratioJumpToken, ratioXJumpToken]);

  const valueXJumpToken = useMemo(() => {
    return divideAndParseToTwoDecimals(ratioJumpToken, ratioXJumpToken);
  }, [ratioJumpToken, ratioXJumpToken]);

  const balanceXJumpToken = useMemo(() => {
    return parseToBigAndDivByDecimals(
      rawRawBalanceXJumpToken,
      decimals
    ).toFixed(18);
  }, [rawRawBalanceXJumpToken, decimals]);

  const availableXJumpToClaim = useMemo(() => {
    return new Big(balanceXJumpToken).toFixed(18);
  }, [balanceXJumpToken, valueXJumpToken]);

  const balanceJumpToken = useMemo(() => {
    return parseToBigAndDivByDecimals(jumpTokenBalance, decimals).toFixed(18);
  }, [jumpTokenBalance, valueJumpToken]);

  const apr = useMemo(() => {
    const base = new Big(JUMP_YEARLY_DISTRIBUTION_COMPROMISE).mul(100);

    const baseBig = new Big(jumpToken).div(10 ** 18);

    return base.div(baseBig).toFixed(2);
  }, [jumpToken]);

  const valuePerDayJumpToken = useMemo(() => {
    const year = new Date().getFullYear();
    const numberOfDays =
      year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0) ? 366 : 365;
    return divideAndParseToTwoDecimals(
      new Big(valueJumpToken),
      new Big(apr).div(numberOfDays)
    );
  }, [valueJumpToken, apr]);

  // const valuePerDayTetherToken = useMemo(() => {
  //   if (new Big(valuePerDayJumpToken).eq("0")) return new Big("0").toFixed(2);
  //   return divideAndParseToTwoDecimals(ratioTetherToken, valuePerDayJumpToken);
  // }, [valuePerDayJumpToken]);

  function parseToBigAndDivByDecimals(value: string | number, decimals: Big) {
    return new Big(value).div(decimals);
  }

  function divideAndParseToTwoDecimals(num: Big, denom: Big | string) {
    return num.div(denom).toFixed(2);
  }

  function calcAmountRaw(amount: string, decimals: number | undefined) {
    return new Big(amount).mul(new Big("10").pow(decimals!)).toFixed();
    return new Big(amount).mul(new Big("10").pow(decimals!)).toFixed(0);
  }

  async function onSubmit(values, call) {
    try {
      await call(values.value);
    } catch (error) {
      console.warn(error);
      toast("Something went wrong!");
    } finally {
      toast("Done!");
    }
  }

  function onGuideChange(nextIndex: number) {
    if (nextIndex < 2) setDashboardTab(nextIndex);
  }

  const stakingProps = {
    isLoading,
    apr,
    valuePerDayJumpToken,
    // valuePerDayTetherToken,

    onSubmit,
    submitStaking,
    submitWithdraw,

    valueJumpToken,
    valueXJumpToken,
    ratioJumpToken,
    balanceXJumpToken,
    balanceJumpToken,
    availableXJumpToClaim,
    chartObj,

    tutorialModal,
    setTutorialModal,

    tutorialGuide,
    setTutorialGuide,
    onGuideChange,

    dashboardTab,
    setDashboardTab,
  };

  return <StakingComponent {...stakingProps} />;
}

export default Staking;
