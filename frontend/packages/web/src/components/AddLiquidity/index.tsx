import { useEffect, useState } from "react";
import { utils } from "near-api-js";
import { BigNumber } from "bignumber.js";
import {
  Transaction,
  Action,
  FunctionCallAction,
} from "@near-wallet-selector/core";
import Tokens from "@/components/modules/pools/Tokens";
import toast from "react-hot-toast";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Image,
  Button,
  Text,
  Collapse,
} from "@chakra-ui/react";
import { useWalletSelector } from "@/context/wallet-selector";
import { RoundCross, Open, BigChevron } from "@/assets/svg";
import { IconButton } from "@/components";
import {
  TokenLogos,
  TableBody,
  Td,
  Checkbox,
  InfoTooltip,
} from "@/components/shared";
import TokenWithInput from "@/components/TokenWithInput";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import {
  toNonDivisibleNumber,
  toReadableNumber,
  toLowestDenomination,
  calculateFairShare,
  formatValueInDecimals,
  formatNumberWithSuffix,
  percent,
  scientificNotationToString,
  toPrecision,
  convertTokenAmountWithDecimal
} from "@/utils/conversion";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";

const gradientStyle = {
  background:
    "radial-gradient(circle, rgba(174,108,198,1) 65%, rgba(112,112,238,1) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
  display: "inline",
};

const AddLiquidity = ({
  open,
  setOpen,
  pool,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  pool: any;
}) => {
  const { accountId, selector } = useWalletSelector();
  const { account } = useRPCStore();

  const [primaryTokenBalance, setPrimaryTokenBalance] = useState<number | null>(
    null
  );
  const [secondaryTokenBalance, setSecondaryTokenBalance] = useState<
    number | null
  >(null);

  const [show, setShow] = useState(false);
  const [poolsShow, setPoolsShow] = useState(false);
  const [selectedPools, setSelectedPools] = useState<string[]>([]);
  const [token0Amount, setToken0Amount] = useState("");
  const [token1Amount, setToken1Amount] = useState("");
  const [preShare, setPreShare] = useState<string | null>(null);

  const { amounts, token0, token1, shares_total_supply, tvl } = pool;

  const TooltipContent = () => {
    return (
      <div className="p-2">
        <p className="text-white-400">
          <b>Tutorial Tips:</b> Add tokens to liquidity pool below. Reminder
          that initial liquidity deposit determine token price ratio.
        </p>
        <p className="text-white-400 mt-4">
          <b>Warning: </b>Impermanent loss may result from change in token
          ratio.
        </p>
      </div>
    );
  };

  const handlePoolSelect = (pool: string) => {
    let poolCopy = [...selectedPools];
    let exist = poolCopy.find((p) => p === pool);
    if (!exist) {
      poolCopy = [...poolCopy, pool];
      setSelectedPools(poolCopy);
    } else {
      let filteredPools = poolCopy.filter((p) => p !== pool);
      setSelectedPools(filteredPools);
    }
  };

  const isChecked = (pool: string) => {
    let exist = selectedPools.find((p) => p === pool);
    return exist ? true : false;
  };

  const checkZeroLiquidity = () => {
    if(amounts[0] <= 0 || amounts[1] <= 0){
      return true;
    }else{
      return false;
    }
  }

  const handleToken0Amount = (amount: number) => {
    if(checkZeroLiquidity()){
      setToken0Amount(amount.toString())
      return
    }
    const fairShares = calculateFairShare({
      shareOf: shares_total_supply,
      contribution: toNonDivisibleNumber(token0?.decimals || token0?.decimal, amount?.toString()),
      totalContribution: amounts[0],
    });
    let secondAmount = "";
    if (amount) {
      secondAmount = toReadableNumber(
        token1.decimals ||token1.decimal,
        calculateFairShare({
          shareOf: amounts[1],
          contribution: fairShares,
          totalContribution: shares_total_supply,
        })
      );
    }
    setToken0Amount(amount.toString());
    setToken1Amount(secondAmount);
    setPreShare(toReadableNumber(24, fairShares));
  };
  const handleToken1Amount = (amount: number) => {
    if(checkZeroLiquidity()){
      setToken1Amount(amount.toString())
      return
    }
    const fairShares = calculateFairShare({
      shareOf: shares_total_supply,
      contribution: toNonDivisibleNumber(token1?.decimals || token1.decimal, amount?.toString()),
      totalContribution: amounts[1],
    });
    let secondAmount = "";
    if (amount) {
      secondAmount = toReadableNumber(
        token0.decimals || token0.decimal,
        calculateFairShare({
          shareOf: amounts[0],
          contribution: fairShares,
          totalContribution: shares_total_supply,
        })
      );
    }
    setToken0Amount(secondAmount);
    setToken1Amount(amount.toString());
    setPreShare(toReadableNumber(24, fairShares));
  };

  const getBalance = async (token: any): Promise<string | undefined> => {
   
    if (account && accountId) {
      let isNear = token.isNear;
      let balance;
      if (isNear === true) {
        balance = (await account.getAccountBalance()).available;
      } else {
        try {
          balance = await account.viewFunction(token?.address || token?.id , "ft_balance_of", {
            account_id: accountId,
          });
        } catch (e) {
          console.log(e);
        }
      }
      const formattedBalance = formatValueInDecimals(
        balance,
        isNear ? 24 : token?.decimals || token.decimal
      );
      return formattedBalance;
    }
    return undefined;
  };

  const fetchTokenBalances = async () => {
    if (pool && token0 && token1) {
      const balance0 = await getBalance(token0);
      const balance1 = await getBalance(token1);

      if (balance0 !== undefined) {
        setPrimaryTokenBalance(parseFloat(balance0));
      } else {
        setPrimaryTokenBalance(null); // or handle this case as needed
      }

      if (balance1 !== undefined) {
        setSecondaryTokenBalance(parseFloat(balance1));
      } else {
        setSecondaryTokenBalance(null); // or handle this case as needed
      }
    }
  };

  useEffect(() => {
    fetchTokenBalances();
  }, [pool, token0, token1, account]);

  const shareDisplay = () => {
    let result = "";
    let percentShare = "";
    let displayPercentShare = "";
    if (preShare && new BigNumber("0").isLessThan(preShare)) {
      const myShareBig = new BigNumber(preShare);
      if (myShareBig.isLessThan("0.001")) {
        result = "<0.001";
      } else {
        result = `${myShareBig.toFixed(3)}`;
      }
    } else {
      result = "-";
    }

    if (result !== "-") {
      percentShare = `${percent(
        preShare!,
        scientificNotationToString(
          new BigNumber(toReadableNumber(24, shares_total_supply))
            .plus(new BigNumber(preShare!))
            .toString()
        )
      )}`;

      if (Number(percentShare) > 0 && Number(percentShare) < 0.01) {
        displayPercentShare = "< 0.01%";
      } else {
        displayPercentShare = `${toPrecision(percentShare, 2)}%`;
      }
    }

    return {
      lpTokens: result,
      shareDisplay: displayPercentShare,
    };
  };

  const registerTokens = (tokens: string[]): Transaction => {
    const contract = accounts.AMM;
    const gas = "300000000000000";

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall", // TypeScript should now understand this is a FunctionCallAction
        params: {
          methodName: "register_tokens",
          args: {
            token_ids: tokens, // tokens is a string array
          },
          gas,
          deposit: "1",
        },
      },
    ];

    const transaction: Transaction = {
      signerId: accountId,
      receiverId: contract,
      actions: actions,
    };

    return transaction;
  };

  const checkStorage = async (tokens: any[]) => {
    let transactions: Transaction[] = [];
    const gas = "300000000000000";
    for (const token of tokens) {
      const storageOfToken = await account!.viewFunction(
        token,
        "storage_balance_of",
        {
          account_id: accountId,
        }
      );
      console.log(storageOfToken, "storageOfToken");
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
  };

  const registerAccount = (): Transaction => {
    const gas = "300000000000000";
    const contract = accounts.AMM;
    let actions: FunctionCallAction[] = [
      {
        type: "FunctionCall",
        params: {
          methodName: "storage_deposit",
          args: {
            registration_only: false,
            account_id: accountId,
          },
          gas,
          deposit: utils.format.parseNearAmount("0.05") as string,
        },
      },
    ];
    let tx = {
      signerId: accountId!,
      receiverId: contract,
      actions: actions,
    };

    return tx;
  };

  const transferTokensToExchange = (
    token: string,
    amount: string
  ): Transaction => {
    const contract = accounts.AMM;
    const gas = "300000000000000";

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall", // Ensure TypeScript understands this as a FunctionCallAction
        params: {
          methodName: "ft_transfer_call",
          args: {
            receiver_id: contract,
            amount: amount,
            msg: "", // Optional message
          },
          gas,
          deposit: "1",
        },
      },
    ];

    const transaction: Transaction = {
      signerId: accountId as string, // Ensure accountId is not null
      receiverId: token,
      actions: actions,
    };

    return transaction;
  };
  const addLiquidity = (poolId: string, amounts: string[]): Transaction => {
    const contract = accounts.AMM;
    const gas = "300000000000000";

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall", // This should be recognized as a FunctionCallAction
        params: {
          methodName: "add_liquidity",
          args: {
            pool_id: Number(poolId),
            amounts: amounts,
          },
          gas,
          deposit: utils.format.parseNearAmount("0.05") as string,
        },
      },
    ];

    const transaction: Transaction = {
      signerId: accountId as string, // Ensure accountId is not null
      receiverId: contract,
      actions: actions,
    };

    return transaction;
  };

  const handleAddLiquidity = async () => {
    let transactions: Transaction[] = [];
    const gas = "300000000000000";
    let amount0 = toLowestDenomination(token0?.decimals || token0.decimal, token0Amount);
    let amount1 = toLowestDenomination(token1?.decimals || token1.decimal, token1Amount);

    // Validation Checkes
    if (!token0Amount || !token1Amount) {
      toast.error("Please enter amount");
      return;
    }
    
    if(parseFloat(token0Amount) <= 0 || parseFloat(token1Amount) <= 0) {
      toast.error("Amount should be greater than zero");
      return
    }

    if (
      !primaryTokenBalance ||
      parseFloat(token0Amount) > primaryTokenBalance
    ) {
      toast.error(`${token0.symbol} balance is insufficient`);
      return;
    }
    if (
      !secondaryTokenBalance ||
      parseFloat(token1Amount) > secondaryTokenBalance
    ) {
      toast.error(`${token1.symbol} balance is insufficient`);
      return;
    }
    let registerAccountTx = registerAccount();
    transactions.push(registerAccountTx);
    let tokenRegisterTx = await checkStorage([
      token0?.address || token0?.id,
      token1?.address || token1?.id,
    ]);
    transactions = [...transactions, ...tokenRegisterTx];
    let registerTx = registerTokens([token0?.address || token0?.id, token1?.address || token1?.id]);
    transactions.push(registerTx);
    let transferToken0Tx = transferTokensToExchange(token0?.address || token0?.id, amount0);
    transactions.push(transferToken0Tx);
    let transferToken1Tx = transferTokensToExchange(token1?.address || token1?.id, amount1);
    transactions.push(transferToken1Tx);
    let addLiquidityTx = addLiquidity(pool?.id, [amount0, amount1]);
    transactions.push(addLiquidityTx);

    await (
      await selector.wallet()
    ).signAndSendTransactions({
      transactions,
    });
  };

  const handleClose = () => {
    setToken0Amount("")
    setToken1Amount("")
    setPreShare(null)
    setOpen(false)
  }

  return (
    <Modal isCentered isOpen={open} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent
        backgroundColor="#5F456A"
        maxW="600px"
        minW="400px"
        width="90%"
        // maxH="800"
        // overflowY="scroll"
        marginTop={10}
      >
        <ModalHeader>
          <div className="flex items-center justify-between mt-4">
            <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
              Add Liquidity
              <InfoTooltip label={<TooltipContent />}>
                <span className="ml-2 mt-1">
                  <QuestionMarkOutlinedIcon className="w-4 h-4" />
                </span>
              </InfoTooltip>
            </h2>
            <button onClick={() => setOpen(false)}>
              <RoundCross />
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="w-full h-auto relative">
            <p className="text-[#9CA3AF] font-semibold text-sm">
              Add tokens to a liquidity pool to earn swap fees
            </p>
            <section className="w-full mt-4 md:mt-6">
              <p className="text-white-400 text-sm font-bold text-right pr-3 mb-2">
                {primaryTokenBalance
                  ? `Balance: ${
                      primaryTokenBalance < 1
                        ? formatNumberWithSuffix(primaryTokenBalance)
                        : formatNumberWithSuffix(primaryTokenBalance)
                    }`
                  : "Balance: 0"}
              </p>
              <TokenWithInput
                handleChange={handleToken0Amount}
                value={token0Amount}
                token={token0}
              />
            </section>
            <section className="w-full mt-4 md:mt-6">
              <p className="text-white-400 text-sm font-bold text-right pr-3 mb-2">
                {secondaryTokenBalance
                  ? `Balance: ${
                      secondaryTokenBalance < 1
                        ? formatNumberWithSuffix(secondaryTokenBalance)
                        : formatNumberWithSuffix(secondaryTokenBalance)
                    }`
                  : "Balance: 0"}
              </p>
              <TokenWithInput
                handleChange={handleToken1Amount}
                value={token1Amount}
                token={token1}
              />
            </section>
            <section className="w-full flex items-center justify-between p-2 mt-4 md:mt-4">
              <p className="text-white-400 text-sm font-bold">LP Tokens</p>
              <p className="text-white text-sm font-bold">
                {shareDisplay().lpTokens || "-"}
              </p>
            </section>
            <section className="w-full flex items-center justify-between p-2">
              <p className="text-white-400 text-sm font-bold">Details</p>
              <p className="text-white text-sm font-bold">
                {shareDisplay().shareDisplay || "-"}
              </p>
            </section>

            {/* Token Info */}
            <div className="flex items-center p-2">
              <Tokens token0={token0} token1={token1} />
              <button onClick={()=>setOpen(false)} className="pl-2">
                <Open />
              </button>
              {/* <TokenLogos size={40} />
              <p className="text-white font-bold text-sm pl-2">
                {token0?.symbol}-{token1.symbol}
                <button className="pl-2">
                  <Open />
                </button>
              </p> */}
            </div>

            {/* POOL DETAILS */}
            <div className="w-full h-auto">
              <div
                className="flex items-center justify-end cursor-pointer"
                onClick={() => setShow(!show)}
              >
                <p className="text-white-400 text-sm font-bold mr-2">
                  Pool Details
                </p>
                <BigChevron
                  className={show ? "w-3 h-3" : "w-3 h-3 rotate-180"}
                />
              </div>

              <Collapse in={show}>
                <div className="w-full h-auto rounded-sm border border-white/20 p-3 mt-2">
                  <section className="w-full flex items-center justify-between mb-2">
                    <p className="text-white-400 text-sm font-bold">TVL</p>
                    <p className="text-white-400 text-sm font-bold">${formatNumberWithSuffix(tvl)}</p>
                  </section>
                  <section className="w-full flex items-center justify-between mb-2">
                    <p className="text-white-400 text-sm font-bold">
                      {token0?.symbol}
                    </p>
                    <p className="text-white-400 text-sm font-bold">
                    {formatNumberWithSuffix(
                  convertTokenAmountWithDecimal(
                    amounts[0],
                    token0?.decimals || token0?.decimal
                  )
                )}
                    </p>
                  </section>
                  <section className="w-full flex items-center justify-between mb-2">
                    <p className="text-white-400 text-sm font-bold">
                      {token1?.symbol}
                    </p>
                    <p className="text-white-400 text-sm font-bold">
                    {formatNumberWithSuffix(
                  convertTokenAmountWithDecimal(
                    amounts[1],
                    token1?.decimals || token1?.decimal
                  )
                )}
                    </p>
                  </section>
                  <section className="w-full flex items-center justify-between mb-2">
                    <p className="text-white-400 text-sm font-bold">
                      24h Volume
                    </p>
                    <p className="text-white-400 text-sm font-bold">
                      $ {formatNumberWithSuffix(pool?.volume_24h)}
                    </p>
                  </section>

                  <section className="w-full flex items-center justify-between mb-2">
                    <p className="text-white-400 text-sm font-bold">Fee</p>
                    <p className="text-white-400 text-sm font-bold">
                      {pool?.fee ?  pool?.fee / 100 : 0}%
                    </p>
                  </section>
                </div>
              </Collapse>
            </div>

            {/* Button section */}
            <Button
              bg="#2b011a"
              size="lg"
              width="full"
              height="54px"
              my={6}
              rounded="lg"
              fontWeight="bold"
              variant="outline"
              onClick={handleAddLiquidity}
            >
              <Text sx={{ ...gradientStyle, fontSize: "24px" }}>
                Add Liquidity
              </Text>
            </Button>

            {/* POOLS SECTION */}
            {/* <div
              className="flex items-center justify-end cursor-pointer"
              onClick={() => setPoolsShow(!poolsShow)}
            >
              <p className="text-white-400 text-sm font-bold mr-2">Pool List</p>
              <BigChevron className={poolsShow ? "w-3 h-3" : "w-3 h-3 rotate-180"} />
            </div>
            <Collapse in={poolsShow}>
              <div className="w-full h-auto">
                <div className=" py-1 px-3 grid lg:grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] grid-cols-[2fr_1fr] gap-4">
                  <Td className="">
                    <div className="text-white font-semibold text-sm">Pool</div>
                  </Td>
                  <Td className="">
                    <div className="text-white font-semibold text-sm">TVL</div>
                  </Td>

                  <Td className="hidden md:flex">
                    <div className="text-white font-semibold text-sm">Fee</div>
                  </Td>
                </div>
                <TableBody>
                  {["1", "2", "3", "4"]
                    .map((item, i) => {
                      return (
                        <div key={i} className="bg-white-600 transition-all cursor-pointer rounded-md py-1 px-3 grid lg:grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] grid-cols-[2fr_1fr] gap-4 mt-4">
                          <Td className="">
                            <div className="flex items-center flex-start gap-6">
                              <Checkbox
                                label=""
                                checked={isChecked(item)}
                                onChange={(e) => handlePoolSelect(item)}
                              />
                              <p className="text-white font-bold text-sm">#1</p>
                            </div>
                          </Td>
                          <Td className="">
                            <div className="text-white font-bold text-sm">
                              1.1M
                            </div>
                          </Td>

                          <Td className="hidden md:flex">
                            <div className="text-white font-bold text-sm">
                              0.4%
                            </div>
                          </Td>
                        </div>
                      );
                    })}
                </TableBody>
              </div>
            </Collapse> */}

            {/* FOOTER TEXT */}
            <p className="text-[#9CA3AF] text-sm font-bold text-center mt-4">
              * Fees are automatically added to your position
            </p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddLiquidity;
