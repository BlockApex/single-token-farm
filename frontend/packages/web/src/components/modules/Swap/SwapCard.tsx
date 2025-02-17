import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import debounce from 'lodash-es/debounce';

import { Account, Contract, utils } from "near-api-js";
import {
  Box,
  Button,
  Flex,
  Text,
  Icon,
  Divider,
  Menu,
  MenuButton,
  Spinner
} from "@chakra-ui/react";
import { FaRegQuestionCircle } from "react-icons/fa";
import { GiSettingsKnobs } from "react-icons/gi";
import { RxTriangleDown, RxTriangleUp } from "react-icons/rx";
import { MdOutlineSwapVerticalCircle } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { HiOutlineChatBubbleBottomCenterText } from "react-icons/hi2";
import { FaArrowsRotate } from "react-icons/fa6";
import toast from "react-hot-toast";
import { ErrorToast, InfoTooltip, SuccessToast } from "@/components/shared";
import { useWalletSelector } from "@/context/wallet-selector";
import {
  getPathFromAggregator,
  getContinuousPathFromAggregator,
} from "@/api/aggregator";
import { TokenSelector } from "./TokenSelector";
import { AutoRouter } from "./AutoRouterModal";
import { RPCSelector, calculateRPCPing } from "./RPCSelector";
import { Settings } from "./Settings";
import { connectDefaultNear, nearConfigs } from "../../../utils/config";
import { getDefaultTokens } from "../../../utils/defaultTokens";
import CircleGradientIcon from "./StyledIcons/CircleIcon";
import ArrowsMergeGradientIcon from "./StyledIcons/ArrowsMergedIcon";
import { QuoteResponse, TokenMetadataType } from "@/utils/types";
import {
  calculateValueAfterSlippage,
  exponentialToDecimal,
  formatValueInDecimals,
  removeDecimals,
} from "@/utils/conversion";
import { oneYoctoNear } from "@/api/contract";
import { Transaction } from "@near-wallet-selector/core";
import styled from "styled-components";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import { formatNumberWithSuffix, convertToFlatNumber } from "@/utils/conversion";
import { getTransactionState, getTransactionsAction, getTxRec } from "@/tools";
import { accounts, NEAR_BLOCK_URL } from "@/utils/account-ids";
import RegisterAccountModal from "@/components/RegisterAccountModal";
import { TESTNET_WHITELIST, MAINNET_WHITELIST } from "@/utils/whitelist";
import LostWithdraw from "@/components/LostWithdraw";

export const nearNetwork = import.meta.env.VITE_NEAR_NETWORK;



const whitelistTokens =
  nearNetwork === "mainnet" ? MAINNET_WHITELIST : TESTNET_WHITELIST;


const TooltipContent = () => {
  return (
    <div className="p-2">
      <p className="text-white-400">
        Select your trading pair and desired amounts below to start swapping!
      </p>
    </div>
  );
};

const ContinuousRoutingContent = () => {
  return (
    <div className="p-2">
    <p className="text-white-400">
    Using Ref and JUMP pools to give the aggregated price in a single path.
    </p>
  </div>
  )
}

const NonContinuousRoutingContent = () => {
  return (
    <div className="p-2">
    <p className="text-white-400">
    Using Ref and JUMP pools to give the aggregated price with more than one path.
    </p>
  </div>
  )
}

const PoolFeeContent = () => {
  return (
    <div className="p-2">
      <p className="text-white-400">
        This pool fee is accumulated fees of all the pools used in swapping
      </p>
    </div>
  );
};

const SwapCardContainer = styled.div`
  width: 576px;
  height: auto;
  padding: 32px 0 0 0;
  gap: 24px;
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    padding: 16px 0;
    position: static;
    transform: none;
  }
`;

const gradientStyle = {
  // background:
  //   "radial-gradient(circle, rgba(174,108,198,1) 65%, rgba(112,112,238,1) 100%)",
  background:"white",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
  display: "inline",
};

const officialRPC = {
  name: "Official NEAR RPC",
  url: nearConfigs.nodeUrl,
};

const receiverId = accounts.SOR;

const ROUTING = {
  NORMAL: "0",
  CONTINOUS: "1",
  JUMP: "2",
};
export const SwapCard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorCode = searchParams.get("errorCode");

  const defaultTokens = getDefaultTokens();
  let rpcPingRetries = 0;
  const allowedRPCPingRetries = 3;
  const { toggleModal, accountId, selector } = useWalletSelector();
  const [isDetailsEnabled, setIsDetailsEnabled] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(1);
  const [isRPCSelectorOpen, setIsRPCSelectorOpen] = useState<boolean>(false);
  const [isAutoRouterOpen, setIsAutoRouterOpen] = useState<boolean>(false);
  const [primaryToken, setPrimaryToken] = useState<TokenMetadataType>(
    defaultTokens[0]
  );
  const [secondaryToken, setSecondaryToken] = useState<TokenMetadataType>(
    defaultTokens[1]
  );
  const [inputTokenAmount, setInputTokenAmount] = useState<string | undefined>(
    undefined
  );
  const [outputTokenAmount, setOutputTokenAmount] = useState<
    string | undefined
  >(undefined);
  const [connectedAccount, setConnectedAccount] = useState<Account>();
  const [primaryTokenBalance, setPrimaryTokenBalance] = useState<string | null>(
    null
  );
  const [secondaryTokenBalance, setSecondaryTokenBalance] = useState<
    number | null
  >(null);

  const [swapButtonMessage, setSwapButtonMessage] = useState<string>("");
  const [swapPath, setSwapPath] = useState<QuoteResponse>();
  const [isQuotationLoading, setIsQuotationLoading] = useState<boolean>(false);

  const [routing, setRouting] = useState(ROUTING.CONTINOUS);

  const [open, setOpen] = useState(false);

  const [isRegistered, setRegistered] = useState<boolean>();



  const checkIsRegistered = async () => {
    console.log(accounts.SOR, connectedAccount)
    try {
      const isRegistered = await connectedAccount!.viewFunction(
        accounts.SOR,
        "is_whitelisted_registered",
        {
          account_id: accountId,
        }
      );
      // console.log(isRegistered, "REGISTERED.......")
      setRegistered(isRegistered)
      if (!isRegistered) setOpen(true)
    } catch (error) {
      console.log(error, "REGISTERED ERROR.......")
    }
  }


  const registerAccount = async () => {
    let transactions: Transaction[] = [];
    const gas = "300000000000000";


    let tx: Transaction = {
      signerId: accountId!,
      receiverId: accounts.SOR,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "storage_deposit_whitelist",
            args: {},
            gas,
            deposit: utils.format.parseNearAmount("0.2") as string,
          },
        },
      ],
    }
    transactions.push(tx);


    (await selector.wallet())
      .signAndSendTransactions({
        transactions
      }).then((res) => {
        if (!res) return;

        const transactionHashes = (Array.isArray(res) ? res : [res])?.map(
          (r) => r.transaction.hash
        );
        const parsedTransactionHashes = transactionHashes?.join(',');
        const newHref = window.location.origin + window.location.pathname + `?transactionHashes=${parsedTransactionHashes}`;
        window.location.href = newHref;
      }).catch((error) => {
        console.log(error, "Transaction error");
      })


  }


  useEffect(() => {
    if (connectedAccount && accounts.SOR) {
      checkIsRegistered()
    }
  }, [connectedAccount])

  // Switch tokens a->b to b->a
  const switchTokens = () => {
    const tempToken = primaryToken;
    setPrimaryToken(secondaryToken);
    setSecondaryToken(tempToken);
    if (inputTokenAmount) {
      const tempInputAmount = inputTokenAmount;
      setInputTokenAmount(outputTokenAmount?.toString());
      setOutputTokenAmount(tempInputAmount);
    }
  };

  // refresh or fetch new quotation for input
  const refreshQuotation = async () => {
    if (primaryToken.address === secondaryToken.address) {
      setOutputTokenAmount(inputTokenAmount);
      // @ts-ignore
      setSwapPath({});
      return
    }
    if (inputTokenAmount && parseFloat(inputTokenAmount) > 0) {
      setIsQuotationLoading(true);
      let response;

      if (routing === ROUTING.CONTINOUS) {
        response = await getContinuousPathFromAggregator(
          primaryToken.address,
          inputTokenAmount,
          secondaryToken.address,
          slippage,
          [
            "RefFinance",
            // "Jump"
          ]
        );
      } else if (routing === ROUTING.JUMP) {
        response = await getContinuousPathFromAggregator(
          primaryToken.address,
          inputTokenAmount,
          secondaryToken.address,
          slippage,
          ["Jump"]
        );
      } else {
        response = await getPathFromAggregator(
          primaryToken.address,
          inputTokenAmount,
          secondaryToken.address,
          slippage,
          ["RefFinance", "Jump"]
        );
      }
      // console.log(JSON.stringify(response), "RESPONSE");
      setSwapPath(response);
      setOutputTokenAmount(response.quote);
      setIsQuotationLoading(false);
    } else {
      // @ts-ignore
      setSwapPath({});
      setOutputTokenAmount("0");
      setSwapButtonMessage("");
    }
  };

  // set insufficient balance in swap button
  useEffect(() => {
    const debouncedRefresh = debounce(() => {
      if (!accountId) {
        setSwapButtonMessage("Connect Wallet");
        return;
      }
      if (inputTokenAmount) {
        if (parseFloat(inputTokenAmount) > parseFloat(primaryTokenBalance!)) {
          setSwapButtonMessage("Insufficient Balance");
        } else {
          setSwapButtonMessage("");
        }
        refreshQuotation();
      } else {
        // @ts-ignore
        setSwapPath({});
        setOutputTokenAmount("0.0");
        setSwapButtonMessage("");
      }
    }, 500); // 500ms debounce

    debouncedRefresh();

    // Cleanup to cancel debounce on unmount or when the inputs change
    return () => {
      debouncedRefresh.cancel();
    };
  }, [inputTokenAmount, routing, secondaryToken, primaryTokenBalance]);




  // connect wallet if not connected already via wallet selector
  useEffect(() => {

    const connectWallet = async () => {
      if (accountId) {
        if (!connectedAccount || !connectedAccount.accountId) {
          const near = await connectDefaultNear(nearConfigs);
          const response = await near.account(accountId as string);
          setConnectedAccount(response);
        } else {
          const getAccountDetails = async () => {
            let isNear = primaryToken.isNear
            let balance;
            if (isNear === true) {
              // console.log(primaryToken.address, secondaryToken.address, await connectedAccount.getAccountBalance())
              balance = (await connectedAccount.getAccountBalance()).available
            } else {
              balance = await connectedAccount.viewFunction(
                primaryToken.address,
                "ft_balance_of",
                { account_id: accountId }
              );
            }


            console.log({ balance })


            const formattedBalance = formatValueInDecimals(
              balance,
              (isNear ? 24 : primaryToken.decimals)
            );
            console.log({ formattedBalance })
            // console.log({ formattedBalanceBig:BigInt(formattedBalance).toString() })
            setPrimaryTokenBalance(formattedBalance);
          };
          getAccountDetails();
        }
      }
    };

    connectWallet();
  }, [connectedAccount, accountId, primaryToken]);

  // set secondary token balance
  useEffect(() => {
    if (accountId) {
      if (connectedAccount && connectedAccount.accountId) {
        const getSecondaryTokenDetails = async () => {
          let isNear = secondaryToken.isNear
          let balance;
          if (isNear) {
            balance = (await connectedAccount.getAccountBalance()).available
          } else {
            balance = await connectedAccount.viewFunction(
              secondaryToken.address,
              "ft_balance_of",
              { account_id: accountId }
            );
          }
          const formattedBalance = formatValueInDecimals(
            balance,
            isNear ? 24 : secondaryToken.decimals
          );
          setSecondaryTokenBalance(parseFloat(formattedBalance || "0"));
        };
        getSecondaryTokenDetails();
      }
    }
  }, [connectedAccount, accountId, secondaryToken]);

  // reset details card when quotation is empty or updated
  useEffect(() => {
    if (!swapPath?.quote) {
      setIsDetailsEnabled(false);
    }
  }, [isDetailsEnabled, swapPath]);

  useEffect(() => {
    const errorCode = searchParams.get("errorCode");

    if (errorCode) {
      let token0 = localStorage.getItem("token0");
      let token1 = localStorage.getItem("token1");

      // Parse only if token exists
      setPrimaryToken(token0 ? JSON.parse(token0) : defaultTokens[0]);
      setSecondaryToken(token1 ? JSON.parse(token1) : defaultTokens[1]);

      toast.dismiss(); // Dismiss any existing toasts

      if (errorCode === "userRejected") {
        setTimeout(() => {
          toast.error("Transaction was canceled by the user.");
        }, 1000);
      } else {
        setTimeout(() => {
          toast.error("An error occurred. Please try again.");
        });
      }

      // Clear the URL after displaying the toast
      navigate(window.location.pathname, { replace: true });
    }
  }, []);

  const handleTransaction = async () => {
    const tx = searchParams.get("transactionHashes");
    if (tx && accountId) {
      let txs = tx?.split(",");

      let token0 = localStorage.getItem("token0");
      let token1 = localStorage.getItem("token1");

      // Parse only if token exists
      setPrimaryToken(token0 ? JSON.parse(token0) : defaultTokens[0]);
      setSecondaryToken(token1 ? JSON.parse(token1) : defaultTokens[1]);

      if (tx && txs && txs.length) {
        let link = `${NEAR_BLOCK_URL}/${txs[0]}`
        let isError = await getTxRec(txs[0], accountId!);
        toast.dismiss();
        if (isError) {
          setTimeout(() => {
            toast.custom(<ErrorToast link={link} />);
          }, 1000);
        } else {
          setTimeout(() => {
            toast.custom(<SuccessToast link={link} />)
          }, 1000);
        }
      }


    }
  };
  useEffect(() => {
    handleTransaction();
  }, [accountId]);

  // actual swap implementation
  // const startSwapAction = async () => {
  //   if (!swapPath?.quote || !accountId || !connectedAccount?.accountId) return;

  //   const { amount_after_fee, quote } = swapPath;

  //   const inputAmount = exponentialToDecimal(
  //     calculateValueAfterSlippage(
  //       amount_after_fee.toString(),
  //       0,
  //       primaryToken.decimals
  //     )
  //   );

  //   const outputAmount = exponentialToDecimal(
  //     calculateValueAfterSlippage(
  //       quote.toString(),
  //       slippage,
  //       secondaryToken.decimals
  //     )
  //   );

  //   const transactionsByLP = {};
  //   const swapAction = [] as any[];

  //   for (const route of swapPath.routes) {
  //     for (const pool of route.route.pools) {
  //       if (!transactionsByLP[pool.liquidity_provider]) {
  //         transactionsByLP[pool.liquidity_provider] = [];
  //       }
  //       const { amount_in, amount_out } = pool.swap_path;

  //       transactionsByLP[pool.liquidity_provider].push({
  //         pool_id: pool.pool_id,
  //         tokens: [pool.swap_path.token_in, pool.swap_path.token_out],
  //         amounts: [amount_in, amount_out],
  //       });
  //     }
  //   }

  //   for (const provider of Object.keys(transactionsByLP)) {
  //     swapAction.push({
  //       liquidity_provider: provider,
  //       swap_action: transactionsByLP[provider],
  //     });
  //   }

  //   const message = {
  //     swap_actions: swapAction,
  //     withdraw: {
  //       token_id: secondaryToken.address,
  //       amount: outputAmount,
  //     },
  //   };

  //   const stringifiedMessage = JSON.stringify(message);

  //   const swapArgs = {
  //     receiver_id: receiverId,
  //     amount: inputAmount.toString(),
  //     msg: stringifiedMessage,
  //   };

  //   const transactions: Transaction[] = [];
  //   const gas = "300000000000000";

  //   console.log(accountId , "accountId")
  //   console.log(connectedAccount , "connectedAccount")
  //   const storageOfToken = await connectedAccount.viewFunction(
  //     secondaryToken.address,
  //     "storage_balance_of",
  //     {
  //       account_id: accountId,
  //     }
  //   );

  //   if (!storageOfToken) {
  //     transactions.push({
  //       signerId: accountId,
  //       receiverId: secondaryToken.address,
  //       actions: [
  //         {
  //           type: "FunctionCall",
  //           params: {
  //             methodName: "storage_deposit",
  //             args: {
  //               registration_only: true,
  //               account_id: accountId,
  //             },
  //             gas,
  //             deposit: utils.format.parseNearAmount("0.05") as string,
  //           },
  //         },
  //       ],
  //     });
  //   }

  //   transactions.push({
  //     signerId: accountId,
  //     receiverId: primaryToken.address,
  //     actions: [
  //       {
  //         type: "FunctionCall",
  //         params: {
  //           methodName: "ft_transfer_call",
  //           args: swapArgs,
  //           gas,
  //           deposit: oneYoctoNear,
  //         },
  //       },
  //     ],
  //   });

  //   console.log(storageOfToken , "storageOfToken")
  //   console.log(transactions , "transactions")
  //   console.log(swapAction, "swapAction")
  //   console.log(transactionsByLP, "transactionsByLP")
  //   await (
  //     await selector.wallet()
  //   ).signAndSendTransactions({
  //     transactions,
  //   });
  // };

  async function processRoute(route: any) {

    // return swapAction;
    const transactions: Transaction[] = [];
    const gas = "300000000000000";
    let lastLp: any = {};
    const lps: any = [];
    const withdrawTokens: string[] = [];
    const slippageToDeduct = slippage / route.route.pools.length;
    console.log(slippageToDeduct, "SLIPPAGE TO DEDUCT")
    for (const pool of route.route.pools) {
      const { amount_in, amount_out, token_in, token_out } = pool.swap_path;
      let amount_out_slippage = BigInt(Math.floor(amount_out - (amount_out * (slippageToDeduct / 100))));
      console.log(amount_out_slippage, "AMOUNT OUT SLIPPAGE.....")
      if (lastLp?.liquidity_provider !== pool?.liquidity_provider) {
        lps.push({
          liquidity_provider: pool.liquidity_provider,
          swap_action: [
            {
              pool_id: pool.pool_id.toString(),
              tokens: [token_in, token_out],
              amounts: [amount_in, amount_out_slippage.toString()],
            },
          ],
        });
        lastLp = pool;
      } else {
        let lp = lps[lps.length - 1];
        lp.swap_action = [
          ...lp.swap_action,
          {
            pool_id: pool.pool_id.toString(),
            tokens: [token_in, token_out],
            amounts: [amount_in, amount_out_slippage.toString()],
          },
        ];
        lps[lps.length - 1] = lp;
        lastLp = pool;
      }
    }


    for (const [index, lp] of lps.entries()) {
      let { swap_action } = lp;
      let firstSwap = swap_action[0];
      let lastSwap = swap_action[swap_action?.length - 1];

      const message = {
        swap_actions: [lp],
        withdraw: {
          token_id: lastSwap?.tokens[1],
          amount: lastSwap?.amounts[1],
        },
      };
      const stringifiedMessage = JSON.stringify(message);
      const args = {
        receiver_id: receiverId,
        amount: firstSwap?.amounts[0],
        msg: stringifiedMessage,
      };



      let tx: Transaction = {
        signerId: accountId!,
        receiverId: firstSwap?.tokens[0],
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: args,
              gas,
              deposit: oneYoctoNear,
            },
          },
        ],
      };
      withdrawTokens.push(lastSwap?.tokens[1])

      transactions.push(tx);

    }
    return { transactions, tokens: withdrawTokens };
  }



  // let isRegistered = await checkRegistered(firstSwap?.tokens[0])
  // if (!isRegistered) {
  //   transactions.push(txStorageInput);
  // }
  // if (index === lps.length - 1) {
  //   let isRegistered = await checkRegistered(lastSwap?.tokens[1])
  //   if (!isRegistered) {
  //     transactions.push(txStorageOutput);
  //   }
  // }

  // let txStorageInput: Transaction = {
  //   signerId: accountId!,
  //   receiverId: accounts.SOR, // The target contract
  //   actions: [
  //     {
  //       type: "FunctionCall",
  //       params: {
  //         methodName: "storage_deposit",
  //         args: {
  //           token_id: firstSwap?.tokens[0],
  //         },
  //         gas: "100000000000000",
  //         deposit: utils.format.parseNearAmount("0.00125") as string,
  //       },
  //     },
  //   ],
  // };

  // let txStorageOutput: Transaction = {
  //   signerId: accountId!,
  //   receiverId: accounts.SOR, // The target contract
  //   actions: [
  //     {
  //       type: "FunctionCall",
  //       params: {
  //         methodName: "storage_deposit",
  //         args: {
  //           token_id: lastSwap?.tokens[1],
  //         },
  //         gas: "100000000000000",
  //         deposit: utils.format.parseNearAmount("0.00125") as string,
  //       },
  //     },
  //   ],
  // };

  const checkRegistered = async (token: any[]) => {

    const storageOfToken = await connectedAccount!.viewFunction(
      accounts.SOR,
      "is_registered",
      {
        account_id: accountId,
        token_id: token
      }
    );
    return storageOfToken
  }

  const checkStorage = async (tokens: any[]) => {
    let transactions: Transaction[] = [];
    const gas = "300000000000000";
    for (const token of tokens) {
      const storageOfToken = await connectedAccount!.viewFunction(
        token,
        "storage_balance_of",
        {
          account_id: accountId,
        }
      );

      if (!storageOfToken) {
        transactions.push({
          signerId: accountId!,
          receiverId: token,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "storage_deposit",
                args: {
                  registration_only: true,
                  account_id: accountId,
                },
                gas,
                deposit: utils.format.parseNearAmount("0.05") as string,
              },
            },
          ],
        });
      }
    }

    return transactions;
  }





  const handleSameToken = async () => {
    let transactions: Transaction[] = [];
    const gas = "300000000000000";

    if (primaryToken.isNear) {
      let tx: Transaction = {
        signerId: accountId!,
        receiverId: primaryToken.address,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "near_deposit",
              args: {},
              gas,
              deposit: utils.format.parseNearAmount(inputTokenAmount?.toString()) as string,
            },
          },
        ],
      }
      transactions.push(tx)
    } else {
      let tx: Transaction = {
        signerId: accountId!,
        receiverId: secondaryToken.address,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "near_withdraw",
              args: {
                amount: utils.format.parseNearAmount(outputTokenAmount?.toString())
              },
              gas,
              deposit: "1" as string,
            },
          },
        ],
      }
      transactions.push(tx)
    }
    await (
      await selector.wallet()
    ).signAndSendTransactions({
      transactions,
    });
  }

  const startSwapAction = async () => {
    if (primaryToken.address === secondaryToken.address) {
      handleSameToken()
      return
    }

    if (!swapPath?.quote || !accountId || !connectedAccount?.accountId) return;


    localStorage.setItem('token0', JSON.stringify(primaryToken));
    localStorage.setItem('token1', JSON.stringify(secondaryToken));

    let transactions: Transaction[] = [];
    const gas = "300000000000000";
    let tokens: string[] = []

    let { routes } = swapPath;
    for (const route of routes) {
      // const { quote, amount, route: poolRoute } = route;
      let txs = await processRoute(route);
      transactions = [...transactions, ...txs.transactions]
      tokens = [...tokens, ...txs?.tokens]
    }

    if (primaryToken.isNear) {
      let tx: Transaction = {
        signerId: accountId!,
        receiverId: primaryToken.address,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "near_deposit",
              args: {},
              gas,
              // deposit: utils.format.parseNearAmount(inputTokenAmount?.toString()) as string,
              deposit: (
                BigInt(utils.format.parseNearAmount(inputTokenAmount?.toString()) as string || "0") +
                BigInt(utils.format.parseNearAmount("0.00125") || "0")
              ).toString()
            },
          },
        ],
      }
      transactions = [tx, ...transactions]
    }
    let storageTxs = await checkStorage(tokens);
    transactions = [...storageTxs, ...transactions]
    if (secondaryToken.isNear) {
      let tx: Transaction = {
        signerId: accountId!,
        receiverId: secondaryToken.address,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "near_withdraw",
              args: {
                amount: utils.format.parseNearAmount(outputTokenAmount?.toString())
              },
              gas,
              deposit: "1" as string,
            },
          },
        ],
      }
      transactions = [...transactions, tx]
    }
    (await selector.wallet())
      .signAndSendTransactions({
        transactions
      }).then((res) => {
        console.log(res , "FINAL RESPONSE........")
        if (!res) return;

        const transactionHashes = (Array.isArray(res) ? res : [res])?.map(
          (r) => r.transaction.hash
        );
        const parsedTransactionHashes = transactionHashes?.join(',');
        const newHref = window.location.origin + window.location.pathname + `?transactionHashes=${parsedTransactionHashes}`;
        window.location.href = newHref;
      }).catch((error) => {
        console.log(error, "Transaction error");
      })

    //  await (
    //      await selector.wallet()
    //   ).signAndSendTransactions({
    //     transactions,
    //   }).then((result)=>{
    //     console.log(result, "Transaction successful");
    //   })

  };



  // connect and swap button action.
  const connectSwapButton = () => {
    if (!isRegistered) {
      setOpen(true);
      return
    }
    if (!accountId) {
      toggleModal();
    } else {
      if (inputTokenAmount) {
        if (parseFloat(inputTokenAmount) > parseFloat(primaryTokenBalance!)) {
          setSwapButtonMessage("Insufficient Balance");
        } else {
          setSwapButtonMessage("");
          if (connectedAccount?.accountId) {
            if (!whitelistTokens.includes(primaryToken.address)) {
              toast.error(`${primaryToken.name} is not whitelisted please contact support.`);
              return
            }
            if (!whitelistTokens.includes(secondaryToken.address)) {
              toast.error(`${secondaryToken.name} is not whitelisted please contact support.`);
              return
            }
            startSwapAction();
          }
        }
      } else {
        toast.error("Set the input amount first.");
      }
    }
  };

  const isInputAndOutputValid = (): boolean =>
    !(
      Boolean(inputTokenAmount) &&
      Boolean(parseFloat(outputTokenAmount?.toString()!))
    );

  // check if swap functionality is disabled, validations
  const isSwapDisabled = () => {
    if (!inputTokenAmount) return
    if (primaryToken.address !== secondaryToken.address) {
      if (!accountId) {
        return false;
      }
      if (!!swapButtonMessage) {
        return true;
      }

      if (!primaryTokenBalance) {
        return true;
      }

      if (!connectedAccount?.accountId) {
        return true;
      }
      if (isQuotationLoading) {
        return true
      }
      return isInputAndOutputValid();
    }
  };

  // details card component
  const detailsComponent = () => {
    if (!swapPath?.quote) {
      return <>Loading</>;
    }
    const slippageImpactInTokenAmount = exponentialToDecimal(
      (slippage / 100) * parseFloat(swapPath.quote)
    );

    // console.log(slippageImpactInTokenAmount, "slippageImpactInTokenAmount");
    let poolsCount = 0;
    let poolsFee = 0;
    swapPath.routes.map((route) => {
      route.route.pools.map((pool) => {
        if (pool.fees.length) {
          poolsCount = poolsCount + 1;
          poolsFee = poolsFee + pool.fees[0];
        }
      });
    });

    const totalPoolFee = poolsFee / poolsCount;
    const totalPoolFeeInPercent = (totalPoolFee / 10000) * 100;
    const poolFeeInTokenAmount =
      (totalPoolFeeInPercent / 100) * parseFloat(swapPath.amount_after_fee);

    const minimumReceived =
      parseFloat(swapPath.quote) - parseFloat(slippageImpactInTokenAmount);


    return (
      <div className="w-full h-auto overflow-hidden">
        <Flex
          align="center"
          justify="space-between"
          wrap="nowrap"
          w="full"
          mb="8px"
        >
          <Text fontSize="14px">Price Impact</Text>
          <Text fontSize="14px">
            -{slippage.toString()}% / -
            {parseFloat(slippageImpactInTokenAmount).toFixed(9)}{" "}
            {primaryToken.symbol}
          </Text>
        </Flex>
        <Flex
          align="center"
          justify="space-between"
          wrap="nowrap"
          w="full"
          mb="8px"
        >
          <Text>Platform Fee</Text>
          <Text>0.00% / 0 {primaryToken.symbol}</Text>
        </Flex>
        <Flex
          align="center"
          justify="space-between"
          wrap="nowrap"
          w="full"
          mb="32px"
        >
          <Text className="flex items-center justify-center" fontSize="14px">Pool Fee

            <InfoTooltip label={<PoolFeeContent />}>
              <span className="ml-2 ">
                <QuestionMarkOutlinedIcon className="w-4 h-4" />
              </span>
            </InfoTooltip>
          </Text>
          <Text fontSize="14px">
            {totalPoolFeeInPercent
              ? parseFloat(totalPoolFeeInPercent.toFixed(2)) // Rounding to 2 decimal places
              : 0}
            % /{" "}
            {poolFeeInTokenAmount
              ? parseFloat(poolFeeInTokenAmount.toFixed(2)) // Rounding to 2 decimal places
              : 0}{" "}
            {primaryToken.symbol}
          </Text>
        </Flex>
        <Flex align="center" justify="space-between" wrap="nowrap" w="full">
          <Text fontSize="14px">Minimum Received</Text>
          <Text fontSize="14px">
            {/* {parseFloat(minimumReceived.toString()).toFixed(9)} */}
            {formatNumberWithSuffix(minimumReceived)}
          </Text>
        </Flex>
      </div>
    );
  };

  if (!primaryToken || !secondaryToken) {
    return <></>;
  }
  return (
    <div
      style={{ marginTop: isDetailsEnabled === true ? 100 : 0 }}
      className="w-full h-screen md:h-[90vh] transform translate-y-20 relative flex items-start md:items-center justify-center">
      <div className="w-full md:w-[50%]">
        <Flex
          alignContent="center"
          justifyContent="flex-end"
          mb="24px"
          color="#9da3af"
        >
          <div className="relative">
            <div
              onClick={() => {
                setIsSettingsModalOpen(true);
              }}
              role="button"
            >
              <IoSettingsOutline style={{ height: "24px", width: "24px" }} />
            </div>
            <Settings
              selectedSlippage={slippage}
              setSelectedSlippage={setSlippage}
              isOpen={isSettingsModalOpen}
              onClose={() => {
                setIsSettingsModalOpen(false);
              }}
            />
          </div>
          <Box
            pl="8px"
            as="button"
            onClick={() => {
              toast("Coming Soon");
            }}
          >
            <HiOutlineChatBubbleBottomCenterText
              style={{ height: "24px", width: "24px" }}
            />
          </Box>
          <Box pl="8px" as="button" onClick={refreshQuotation}>
            <FaArrowsRotate
              className={`h-6 w-6 ${isQuotationLoading ? "slow-spin" : ""}`}
            />
          </Box>
        </Flex>

        <Box
          // background="linear-gradient(0deg, rgba(66,26,41,1) 0%, rgba(71,26,29,1) 31%, rgba(62,26,49,1) 100%)"
          p={6}
          borderRadius="md"
          boxShadow="lg"
          color="white"
          className="bg-white-600"
        >
          <h1 className="text-xl tracking-tighter font-bold leading-6 flex items-center mb-2">
            Swap
            <InfoTooltip label={<TooltipContent />}>
              <span className="ml-2 ">
                <QuestionMarkOutlinedIcon className="w-4 h-4" />
              </span>
            </InfoTooltip>
          </h1>
          <Text
            style={{ fontSize: "14px", color: "#A6ACB7", fontWeight: "bold" }}
          >
            Swap tokens across every exchange on NEAR
          </Text>
          <div className="w-full flex items-center justify-between md:justify-start mt-6 gap-2 md:gap-4">
            <section
              onClick={() => setRouting(ROUTING.CONTINOUS)}
              className={`cursor-pointer py-2 pr-1 md:pr-4 flex items-center`}
            >
              <p
                className={`${routing === ROUTING.CONTINOUS
                  ? "text-white"
                  : "text-[#A6ACB7]"
                  } font-bold text-sm md:text-md transition-all delay-200 hover:text-white-600 flex items-center`}
              >

                Continuous
                <InfoTooltip label={<ContinuousRoutingContent />}>
                  <span className="ml-2 ">
                    <QuestionMarkOutlinedIcon className="w-3 h-3" />
                  </span>
                </InfoTooltip>
              </p>
            </section>
            <div className="border-r-2 border-white-600 h-4" />
            <section
              onClick={() => setRouting(ROUTING.NORMAL)}
              className={`cursor-pointer py-2 pl-2 md:pl-0 pr-1 md:pr-4`}
            >
              <p
                className={`${routing === ROUTING.NORMAL
                  ? "text-white"
                  : "text-[#A6ACB7]"
                  } font-bold text-sm md:text-md transition-all delay-200 hover:text-white-600 flex items-center`}
              >
                Non-continuous
                <InfoTooltip label={<NonContinuousRoutingContent />}>
                  <span className="ml-2 ">
                    <QuestionMarkOutlinedIcon className="w-3 h-3" />
                  </span>
                </InfoTooltip>
              </p>
            </section>
            <div className="border-r-2 border-white-600 h-4" />
            <section
              onClick={() => setRouting(ROUTING.JUMP)}
              className={`cursor-pointer py-2 pl-2 md:pl-0 pr-1 md:pr-4`}
            >
              <p
                className={`${routing === ROUTING.JUMP
                  ? "text-white"
                  : "text-[#A6ACB7]"
                  } font-bold text-sm md:text-md transition-all delay-200 hover:text-white-600`}
              >
                Jump AMM
              </p>
            </section>
          </div>
          {/* {routing === ROUTING.NORMAL ? (
            <small className="text-red">
              This transaction might lead to a Sandwich Attack. <a className="underline" href="https://www.notion.so/Understanding-Sandwich-Attacks-in-Batch-Transactions-10cd12b57ab7800cb46cf3d6d10af2fd?pvs=4" target="_blank" >Read more</a>
            </small>
          ) : (
            ""
          )} */}
          {routing === ROUTING.JUMP ? (
            <small className="text-green">
              Earn platform incentives by using Jump AMM
            </small>
          ) : (
            ""
          )}
          <br />
          <Text
            fontSize="14px"
            height="20px"
            color="#A6ACB7"
            fontWeight="bold"
            mt="0px"
            pr="12px"
            textAlign="right"
          >
            {primaryTokenBalance
              ? `Balance: ${parseFloat(primaryTokenBalance!) < 1
                ? formatNumberWithSuffix(parseFloat(primaryTokenBalance!))
                : formatNumberWithSuffix(parseFloat(primaryTokenBalance!))
              }`
              : "Balance: 0"}
          </Text>
          <TokenSelector
            label="primary"
            balance={primaryTokenBalance}
            setSelectedToken={setPrimaryToken}
            token={primaryToken || defaultTokens[0]}
            tokenAmount={inputTokenAmount}
            setTokenAmount={setInputTokenAmount}
            tokenToFilter={secondaryToken}
            key="primary"
            connectedAccount={connectedAccount}
          />
          <Flex align="center" width="100%" px={4} pt="12px">
            <Divider
              orientation="horizontal"
              borderBottomWidth="2px"
              borderColor="#b5a3a5"
            />
            <Box
              as="button"
              onClick={() => {
                switchTokens();
              }}
            >
              <Icon
                as={MdOutlineSwapVerticalCircle}
                mx={2}
                color="#b5a3a5"
                w="32px"
                h="30px"
              />
            </Box>
            <Divider
              orientation="horizontal"
              borderBottomWidth="2px"
              borderColor="#b5a3a5"
            />
          </Flex>
          <Text
            fontSize="14px"
            height="20px"
            color="#A6ACB7"
            fontWeight="bold"
            pr="12px"
            textAlign="right"
          >
            {secondaryTokenBalance
              ? `Balance: ${secondaryTokenBalance < 1
                ? formatNumberWithSuffix(secondaryTokenBalance)
                : formatNumberWithSuffix(secondaryTokenBalance)
              }`
              : "Balance: 0"}
          </Text>
          <TokenSelector
            label="secondary"
            balance={secondaryTokenBalance?.toString()!}
            setSelectedToken={setSecondaryToken}
            token={secondaryToken || defaultTokens[1]}
            tokenAmount={outputTokenAmount}
            setTokenAmount={setOutputTokenAmount}
            tokenToFilter={primaryToken}
            key="secondary"
            connectedAccount={connectedAccount}
          />
          <Flex
            pt="18px"
            align="center"
            justify="space-between"
            wrap="nowrap"
            w="full"
          >
            <Flex align="center">
              <Flex
                align="center"
                as="button"
                onClick={() => {
                  if (isQuotationLoading) {
                    return;
                  }
                  if (primaryToken.address === secondaryToken.address) return

                  if (!inputTokenAmount || parseFloat(inputTokenAmount) <= 0) {
                    toast.error("Input amount is required");
                    return
                  }

                  if (!swapPath?.routes?.length) {
                    toast.error(
                      "Quotation not available"
                    );
                    return
                  }

                  setIsAutoRouterOpen(true);
                }}
              >
                <ArrowsMergeGradientIcon />
                <Box
                  pl="8px"
                  sx={gradientStyle}
                  fontWeight="bold"
                  fontSize="14px"
                  my={2}
                >
                  Auto Router
                </Box>
                {isQuotationLoading ? (<Spinner className="ml-2" size='sm' />) : ""}
              </Flex>
              {/* <Flex
                align="center"
                onClick={() => {
                  setIsRPCSelectorOpen(true);
                }}
                fontWeight="bold"
                fontSize="14px"
                my={2}
                pl="20px"
                color="#B4A3A9"
                as="button"
              >
                <Text ml="4px" mr="4px">
                  {selectedRPC.name}
                </Text>
                <CircleGradientIcon />
                <Text ml="4px">{selectedRPC.ping}(ms)</Text>
                <Box ml="4px">
                  <GiSettingsKnobs
                    style={{ transform: "rotate(-90deg)", color: "white" }}
                  />
                </Box>
              </Flex> */}
            </Flex>
            <Flex
              align="center"
              onClick={() => {
                if (isQuotationLoading) {
                  return;
                }
                if (primaryToken.address === secondaryToken.address) return

                if (!inputTokenAmount || parseFloat(inputTokenAmount) <= 0) {
                  toast.error("Input amount is required.");
                  return
                }

                if (!swapPath?.routes?.length) {
                  toast.error(
                    "Quotation not available"
                  );
                  return
                }

                setIsDetailsEnabled(!isDetailsEnabled);
              }}
              as="button"
            >
              <Text
                fontWeight="bold"
                fontSize="14px"
                my={2}
                color={isInputAndOutputValid() ? "#87787d" : "#B4A3A9"}
              >
                Details
              </Text>
              <Box
                pl="8px"
                color={isInputAndOutputValid() ? "#87787d" : "#B4A3A9"}
              >
                {!isDetailsEnabled ? <RxTriangleDown /> : <RxTriangleUp />}
              </Box>
            </Flex>
          </Flex>
          {isDetailsEnabled ? detailsComponent() : <></>}
          <AutoRouter
            isOpen={isAutoRouterOpen}
            onClose={() => {
              setIsAutoRouterOpen(false);
            }}
            routes={swapPath?.routes}
            tokenIn={primaryToken}
            tokenOut={secondaryToken}
            inputTokenAmount={inputTokenAmount?.toString()}
            outputTokenAmount={outputTokenAmount?.toString()}
          />

          <Button
            bg="#894da0"
            size="lg"
            width="full"
            height="54px"
            my={2}
            disabled={isQuotationLoading || isSwapDisabled()}
            fontWeight="bold"
            variant="outline"
            onClick={() => {
              if (isQuotationLoading) {
                return
              }
              if (!inputTokenAmount || parseFloat(inputTokenAmount) <= 0) {
                toast.error("Input amount is required.");
                return
              }

              if (!swapPath?.routes?.length && primaryToken.address !== secondaryToken.address) {
                toast.error(
                  "Quotation not available"
                );
                return
              }

              connectSwapButton()
            }}
          >
            <Text sx={{ ...gradientStyle, fontSize: "24px" }}>
              {swapButtonMessage
                ? swapButtonMessage
                : !accountId
                  ? "Connect Wallet"
                  : "Swap"}
            </Text>
          </Button>
        </Box>
      </div>
      <RegisterAccountModal open={open} handleSubmit={registerAccount} handleClose={() => setOpen(false)} />
    </div>
  );
};
