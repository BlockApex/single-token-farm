import { useEffect, useState } from "react";
import TokenSelector from "@/components/TokenSelector";
import { useWalletSelector } from "@/context/wallet-selector";
import { utils } from "near-api-js";
import { format } from 'date-fns';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Text,
} from "@chakra-ui/react";
import { RoundCross } from "@/assets/svg";
import { getDefaultTokens } from "@/utils/defaultTokens";
import { TokenMetadataType } from "@/utils/types";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import {
  DateInput,
  InfoTooltip,
  Radio,
  Checkbox,
  SimpleSelect,
} from "@/components/shared";
import { useGetPoolsByTokens } from "@/hooks/modules/pools";
import {
  Transaction,
  Action,
  FunctionCallAction,
} from "@near-wallet-selector/core";
import { accounts } from "@/utils/account-ids";
import { useRPCStore } from "@/stores/rpc-store";
import toast from "react-hot-toast";
import {
  toNonDivisibleNumber,
  formatNumberWithSuffix,
  convertTokenAmountWithDecimal,
  formatValueInDecimals
} from "@/utils/conversion";

const gradientStyle = {
  background:
    "radial-gradient(circle, rgba(174,108,198,1) 65%, rgba(112,112,238,1) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  color: "transparent",
  display: "inline",
};

const CreateFarm = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { accountId, selector } = useWalletSelector();
  const { account } = useRPCStore();

  const defaultTokens = getDefaultTokens();

  const [farmType, setFarmType] = useState("1");
  const [poolId, setPoolId] = useState("1");

  const [token0, setToken0] = useState<null | TokenMetadataType>(null);
  const [token1, setToken1] = useState<null | TokenMetadataType>(null);
  const [rewardToken, setRewardToken] = useState<null | TokenMetadataType>(
    null
  );
  const [balance, setBalance] = useState("0");
  const [selectedPool, setSelectedPool] = useState("");
  const [interval, setInterval] = useState("");
  const [tokensPerSession, setTokenPerSession] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState('');
  const [isToday, setToday] = useState(false);
  const [endTime, setEndTime] = useState("");
  const [isInvalidEnd, setInvalidEnd] = useState(false);

  const { pools, error, loading, refetch } = useGetPoolsByTokens(
    token0?.address,
    token1?.address
  );

  let farmId = selectedPool ? `${accounts.AMM}@${selectedPool}` : '';



  const getBalance = async (token: any) => {
    if (account && accountId) {
      let isNear = token.isNear;
      let balance;
      if (isNear === true) {
        balance = (await account.getAccountBalance()).available;
      } else {
        try {
          balance = await account.viewFunction(
            token?.address,
            "ft_balance_of",
            {
              account_id: accountId,
            }
          );
        } catch (e) {
          console.log(e);
        }
      }
      const formattedBalance = formatValueInDecimals(
        balance,
        isNear ? 24 : token?.decimals || token.decimal
      );
      setBalance(formattedBalance);
    }
  };


  const checkIfToday = () => {
    const selectedDateObj = new Date(selectedDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      toast.error('Cannot select past date');
      return;
    }

    if (
      selectedDateObj.getFullYear() === today.getFullYear() &&
      selectedDateObj.getMonth() === today.getMonth() &&
      selectedDateObj.getDate() === today.getDate()
    ) {
      setToday(true);
    } else {
      setToday(false);
    }
  }

  const isValidDate = (date: string | Date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()); // Returns true if date is valid, false if invalid
  };


  const calculateEndDate = (total_reward, reward_per_session, session_interval, selectedDate) => {
    let total_sessions = parseFloat(total_reward) / parseFloat(reward_per_session);
    let total_duration = total_sessions * parseFloat(session_interval);
    let start_at = Math.floor(new Date(selectedDate).getTime() / 1000);
    let end_time = start_at + total_duration;
    let date = new Date(end_time * 1000);
    console.log(date , "HELLO DATE.....")
    if(isValidDate(date?.toString())){
      let year = date.getFullYear();
      if(year <= 2038){
        let dateStr = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
        setEndTime(dateStr);
        setInvalidEnd(false)
      }else{
        setInvalidEnd(true);
        setEndTime("");
      }
    }else {
      setInvalidEnd(true);
      setEndTime("");
    }
  }


  useEffect(() => {
    if (rewardAmount && tokensPerSession && interval && selectedDate) {
      calculateEndDate(rewardAmount, tokensPerSession, interval, selectedDate)
    } else {
      setEndTime("");
    }
  }, [rewardAmount, tokensPerSession, interval, selectedDate])

  useEffect(() => {
    checkIfToday()
  }, [selectedDate])

  useEffect(() => {
    if (rewardToken) {
      getBalance(rewardToken);
    }
  }, [rewardToken]);



  const TooltipContent = () => {
    return (
      <div className="p-2">
        <p className="text-white-400">
          <b>Tutorial tips:</b> Select token pair and fees below to create
          custom liquidity pool.
        </p>
      </div>
    );
  };

  const createFarm = (
    poolId: string,
    rewardToken: string,
    rewardPerSession: string,
    sessionInterval: number
  ): Transaction => {
    const contract = accounts.FARM; // Assuming this is your farm contract
    const gas = "300000000000000"; // Same gas limit as addLiquidity
    const deposit = utils.format.parseNearAmount("0.1") as string; // 0.1 NEAR deposit

    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall",
        params: {
          methodName: "create_simple_farm",
          args: {
            terms: {
              seed_id: `${accounts.AMM}@${poolId}`,
              reward_token: rewardToken,
              start_at: 0,
              reward_per_session: rewardPerSession,
              session_interval: sessionInterval,
            },
          },
          gas,
          deposit,
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


  const registerAccount = async (token: string): Promise<Transaction | null> => {
    const gas = "300000000000000";
    const contract = accounts.FARM;
    const deposit = utils.format.parseNearAmount("0.05") as string; // 0.1 NEAR deposit
    try {
      const storageCheck = await account!.viewFunction(
        token,
        "storage_balance_of",
        {
          account_id: contract!,
        }
      );

      if (!storageCheck) {
        let actions: FunctionCallAction[] = [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                registration_only: true,
                account_id: contract,
              },
              gas,
              deposit,
            },
          },
        ];
        let tx = {
          signerId: accountId!,
          receiverId: token,
          actions: actions,
        };

        return tx;
      } else {
        return null
      }
    } catch (err) {
      console.log(err, "REGISTER ERROR")
      return null
    }
  };

  const rewardTx = (
    token: string,
    amount: string,
    farmId: string,
    reward_per_session: string,
    session_interval: number,
    startAt: number
  ): Transaction => {
    const contract = accounts.FARM;
    const gas = "300000000000000";

    if (!accountId) {
      throw new Error("Account ID is required");
    }
    let msg = {
      seed_id: farmId,
      reward_token: token,
      reward_per_session: reward_per_session,
      session_interval: session_interval,
      start_at: startAt
    }

    const actions: FunctionCallAction[] = [
      {
        type: "FunctionCall", // Ensure TypeScript understands this as a FunctionCallAction
        params: {
          methodName: "ft_transfer_call",
          args: {
            receiver_id: contract,
            amount: amount,
            msg: JSON.stringify(msg),
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

  const storageDeposit =  ()=>{


    // const isDeposited = await account!.viewFunction(
    //   accounts.FARM,
    //   "internal_farmer_storage",
    //   {
    //     account_id: accountId,
    //   }
    // );

    let txStorage: Transaction = {
      signerId: accountId!, 
      receiverId: accounts.FARM, // The target contract
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "storage_deposit",
            args: {},
            gas: "100000000000000", 
            deposit: utils.format.parseNearAmount("0.00125") as string,
          },
        },
      ],
    };
    return txStorage;


  }

  const unRegister =  ()=>{

    let txStorage: Transaction = {
      signerId: accountId!, 
      receiverId: accounts.FARM, // The target contract
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "storage_withdraw",
            args: {},
            gas: "100000000000000", 
            deposit: "1",
          },
        },
      ],
    };
    return txStorage;


  }




  const handleCreateFarm = async () => {
    let parsedDate = new Date(selectedDate);
    let year = parsedDate.getFullYear();

    if (!token0 || !token1) {
      toast.error("Please select token");
      return;
    }
    if (!selectedPool) {
      toast.error("Please confirm Pool ID");
      return;
    }
    if (!rewardToken) {
      toast.error("Please select reward token");
      return;
    }
    if (!rewardAmount) {
      toast.error("Please enter deposit amount");
      return;
    }
    if (parseFloat(rewardAmount) <= 0) {
      toast.error("Reward amount must be greater than zero");
      return;
    }

    if (parseFloat(rewardAmount) > parseFloat(balance)) {
      toast.error("You don't have enough balance");
      return;
    }

    if (parseFloat(tokensPerSession) <= 0) {
      toast.error("Rewards per interval must be greater than zero");
      return;
    }

    if (!tokensPerSession) {
      toast.error("Please add reward per session");
      return;
    }

    if (!interval) {
      toast.error("Please select interval");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (year > 2038) {
      toast.error("Year cannot be greater than 2038");
      return;
    }

    if (!isValidDate(selectedDate)) {
      toast.error("Invalid date format");
      return;
    }

    const selectedDateObj = new Date(selectedDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      toast.error('Cannot select past date');
      return;
    }



    let transactions: Transaction[] = [];
    const gas = "300000000000000";
    let poolId = selectedPool;
    let token = rewardToken.address;
    let rewardPerSession = toNonDivisibleNumber(
      rewardToken?.decimals,
      tokensPerSession
    );
    let _amount = toNonDivisibleNumber(rewardToken?.decimals, rewardAmount);
    let sessionInterval = Number(interval);
    const currentDate = new Date();
    const combinedDateTime = new Date(`${selectedDate}T${String(currentDate.getUTCHours()).padStart(2, '0')}:${String(currentDate.getUTCMinutes()).padStart(2, '0')}:${String(currentDate.getUTCSeconds()).padStart(2, '0')}Z`);
    let startAt = Math.floor(combinedDateTime.getTime() / 1000);
    startAt = startAt + (5 * 60)
    console.log(startAt, selectedDate);
    if (isNaN(startAt)) {
      toast.error("Invalid date format");
      return;
    }
    let tx0 = await registerAccount(token);
    if (tx0) {
      transactions.push(tx0);
    }
    let txStorage = await storageDeposit();
    transactions.push(txStorage);
    
    // let tx = createFarm(poolId, token, rewardPerSession, sessionInterval);
    // transactions.push(tx);
    let tx1 = rewardTx(token, _amount, farmId, rewardPerSession, sessionInterval, startAt)
    transactions.push(tx1);
    let unregister =  unRegister();
    transactions.push(unregister);
    await (
      await selector.wallet()
    ).signAndSendTransactions({
      transactions,
    });
  };

  useEffect(() => {
    return () => {
      refetch();
    };
  }, [open]);

  const handleClose = () => {
    setToken0(null);
    setToken1(null);
    setRewardToken(null);
    setSelectedPool("");
    setInterval("");
    setTokenPerSession("");
    setRewardAmount("");
    setSelectedDate("");
    setOpen(false);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "-") {
      e.preventDefault();
    }
  };




  return (
    <>
      <Modal isCentered isOpen={open} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent
          backgroundColor="#5F456A"
          maxW="600px"
          minW="400px"
          width="90%"
        >
          <ModalHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
                Create New Farm
                <InfoTooltip label={<TooltipContent />}>
                  <span className="ml-2 mt-1">
                    <QuestionMarkOutlinedIcon className="w-4 h-4" />
                  </span>
                </InfoTooltip>
              </h2>
              <button onClick={handleClose}>
                <RoundCross />
              </button>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="w-full h-auto relative">
              <p className="text-[#9CA3AF] font-semibold text-sm">
                Select rewards & duration for your existing liquidity pool to
                create a farm
              </p>
              {/* Farm Type */}
              {/* <div className="mt-4" >
                                <p className="text-white font-bold text-md">
                                    Farm Type:
                                </p>
                                <section className="flex items-center justify-start mt-2 gap-10" >
                                    <Radio
                                        label="Single Yield farm"
                                        value="0"
                                        checked={true}
                                        onChange={(e) => console.log(e)}
                                        name="farmType"
                                    />
                                    <Radio
                                        label="Dual Yield farm"
                                        value="1"
                                        checked={false}
                                        onChange={(e) => console.log(e)}
                                        name="farmType"
                                    />
                                </section>
                            </div> */}
              {/* Pool Id Type */}
              {/* <div className="mt-4" >
                                <p className="text-white font-bold text-md">
                                    Token Pair & Pool ID
                                </p>
                                <section className="flex items-center justify-start mt-2 gap-10" >
                                    <Radio
                                        label="Use existing Jump Pool ID"
                                        value="0"
                                        checked={true}
                                        onChange={(e) => console.log(e)}
                                        name="poolIdType"
                                    />
                                    <Radio
                                        label="Use existing Jump Pool ID"
                                        value="1"
                                        checked={false}
                                        onChange={(e) => console.log(e)}
                                        name="poolIdType"
                                    />
                                </section>
                            </div> */}

              {/* Token Selection Section */}
              <div className="w-full rounded-lg bg-[#ffffff1a] mt-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 p-4 md:mt-6">
                <TokenSelector
                  token={token0}
                  setToken={setToken0}
                  tokenToFilter={token1}
                  key="token0"
                />
                <TokenSelector
                  token={token1}
                  setToken={setToken1}
                  tokenToFilter={token0}
                  key="token1"
                />
              </div>

              {/* Pool Ids Section */}
              <div className="mt-4">
                <p className="text-white font-bold text-md">Confirm Pool ID</p>
                <div className="w-full max-h-[100px] overflow-y-auto rounded-md bg-[#594661] border border-white border-opacity-20 mt-4 py-2">
                  {pools && pools.length
                    ? pools.map((pool, i) => {
                      return (
                        <div className="w-full flex items-center justify-start px-6 py-2">
                          <Radio
                            label=""
                            value="0"
                            checked={selectedPool === pool?.id}
                            onChange={(e) => setSelectedPool(pool?.id)}
                            name="pools"
                          />
                          <div className="w-full flex items-center justify-between bg-[#ffffff4d] rounded-md p-2 ml-2">
                            <p className="text-[10px]">{pool?.id}</p>
                            <p className="text-[10px]">
                              Pool Liq{" "}
                              {formatNumberWithSuffix(
                                convertTokenAmountWithDecimal(
                                  pool?.amounts[0],
                                  pool?.token0?.decimal
                                )
                              )}{" "}
                              {pool?.token_symbols[0]} | {" "}
                              {formatNumberWithSuffix(
                                convertTokenAmountWithDecimal(
                                  pool?.amounts[1],
                                  pool?.token1?.decimal
                                )
                              )}
                              {" "}
                              {pool?.token_symbols[1]}
                            </p>
                          </div>
                        </div>
                      );
                    })
                    : ""}
                  {!token0 && !token1 ? (
                    <p className="text-center">Please select the tokens</p>
                  ) : (
                    ""
                  )}
                  {token0 && token1 && !pools?.length ? (
                    <p className="text-center">No pools found</p>
                  ) : (
                    ""
                  )}
                </div>
              </div>

              {/* REWARD TOKEN */}
              <div className="w-full flex items-center justify-between px-1">
                <p className="text-white font-bold text-md mb-2 mt-4">
                  Reward Token
                </p>
                <p className="text-white font-bold text-md mb-2 mt-4">
                  Deposit Amount
                  (
                  {rewardToken
                    ? `Balance: ${Number(balance) < 1
                      ? formatNumberWithSuffix(Number(balance))
                      : formatNumberWithSuffix(Number(balance))
                    }`
                    : "Balance: 0"}
                  )
                </p>
              </div>
              <div className="w-full h-auto  rounded-lg bg-[#ffffff1a] py-2 px-3">
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center justify-start">
                    <TokenSelector
                      token={rewardToken}
                      setToken={setRewardToken}
                      tokenToFilter={defaultTokens[0]}
                      key="rewardToken"
                    />
                  </div>
                  <section>
                    <input
                      className="bg-transparent 
                                 text-white 
                                  font-bold 
                                  text-md md:text-lg placeholder-white placeholder-opacity-70 border-none 
                                focus:border-white 
                                  focus:outline-none 
                                  focus:ring-0 
                                  hover:border-none text-right"
                      placeholder="0.0"
                      type="number"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      min={0}
                      onKeyDown={handleKeyDown}
                    />
                    <p className="text-white text-sm font-bold text-right pr-3 m-0">
                      {/* $10.00 */}
                    </p>
                  </section>
                </div>
              </div>
              {/* INTERVAL SECTION */}

              <div className="w-full flex items-center justify-between px-1">
                <p className="text-white font-bold text-md mb-2 mt-4">
                  Interval
                </p>
                <p className="text-white font-bold text-md mb-2 mt-4">
                  Reward per Interval
                </p>
              </div>
              <div className="w-full h-auto  rounded-lg bg-[#ffffff1a] py-2 px-3">
                <div className="w-full flex items-center justify-between">
                  <SimpleSelect
                    options={[
                      { label: "2 Minutes", value: "120" },
                      { label: "1 Week", value: "604800" },
                      { label: "1 Month", value: "2592000" },
                      { label: "2 Months", value: "5184000" },
                      { label: "3 Months", value: "7776000" }
                    ]}
                    selectedValue={interval}
                    onChange={(e) => setInterval(e)}
                    text=""
                    placeholder="Select Interval"
                  />
                  <section>
                    <input
                      className="bg-transparent 
                                 text-white 
                                  font-bold 
                                  text-md md:text-lg placeholder-white placeholder-opacity-70 border-none 
                                focus:border-white 
                                  focus:outline-none 
                                  focus:ring-0 
                                  hover:border-none text-right"
                      placeholder="0.0"
                      type="number"
                      value={tokensPerSession}
                      onChange={(e) => setTokenPerSession(e.target.value)}
                      min={0}
                      onKeyDown={handleKeyDown}
                    />
                    <p className="text-white text-sm font-bold text-right pr-3 m-0">
                      {/* $10.00 */}
                    </p>
                  </section>
                </div>
              </div>


              <div className="flex items-center justify-between" >
                <div className="flex flex-col items-start justify-start" >
                  <p className="text-white font-bold text-md mb-2 mt-4">
                    Start At
                  </p>
                  <DateInput
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                </div>
                <div className="flex flex-col items-start justify-start" >
                  <p className="text-white font-bold text-md mb-2 mt-4">
                      Anticipated End Date
                  </p>
                  <div
                    className="bg-[#00000033] text-white rounded-sm min-w-full  md:min-w-[185px] min-h-[36px] cursor-pointer flex items-center justify-between p-2"
                  >
                    {endTime ? <p>{endTime}</p>:<p>dd/mm/yyyy</p>} 
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between" >
              <small className="text-sm text-red mt-1" >{isToday ? "Farms will be shown after 5 min" : ""}</small>
              <small className="text-sm text-red mt-1 mr-2" >{isInvalidEnd ? "Cannot estimate end date " : ""}</small>
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
                onClick={handleCreateFarm}
              // disabled={feeTierMessage || !token0 || !token1 ? true : false}
              >
                <Text sx={{ ...gradientStyle, fontSize: "24px" }}>
                  Create Farm
                </Text>
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateFarm;
