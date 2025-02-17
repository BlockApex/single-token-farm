import React, { useEffect, useState } from 'react'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    Image,
    Text,
    Spinner,
    Box,
} from "@chakra-ui/react";
import { Button } from "@/components";
import { InfoTooltip } from '../shared';
import { QuestionMarkOutlinedIcon } from '@/assets/svg/question-mark-icon';
import { RoundCross } from '@/assets/svg';
import { useTokens } from '@/utils/tokens';
import { accounts } from '@/utils/account-ids';
import { Account } from 'near-api-js';
import { useWalletSelector } from '@/context/wallet-selector';
import { connectDefaultNear, nearConfigs } from "../../utils/config";
import { formatNumberWithSuffix, formatValueInDecimals } from '@/utils/conversion';
import { Transaction, FunctionCallAction } from "@near-wallet-selector/core";




const TooltipContent = () => {
    return (
        <div className="p-2">
            <p className="text-white-400">
                <b>Tutorial Tips:</b>View and recover tokens that may have been unintentionally lost during transactions. Follow the steps to identify and take action on lost tokens.
            </p>
        </div>
    );
};


const gradientStyle = {
    background:
        "radial-gradient(circle, rgba(174,108,198,1) 65%, rgba(112,112,238,1) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "transparent",
    display: "inline",
};




const LostWithdraw = ({ open, handleClose }) => {
    const {
        tokens,
        strict,
        loading,
        starredTokens: storageStarredTokens,
        refetch,
    } = useTokens();
    const { toggleModal, accountId, selector } = useWalletSelector();
    const [connectedAccount, setConnectedAccount] = useState<Account>();
    const [filteredTokens, setFilteredTokens] = useState<null | any[]>(null)
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        const connectWallet = async () => {
            if (accountId && (!connectedAccount || !connectedAccount.accountId)) {
                const near = await connectDefaultNear(nearConfigs);
                const response = await near.account(accountId as string);
                setConnectedAccount(response);
            }
        };

        connectWallet();
    }, [connectedAccount, accountId]);



    const getDeposit = async (token: any) => {
        try {
            const deposit = await connectedAccount!.viewFunction(
                accounts.SOR,
                "get_deposits",
                {
                    account_id: accountId,
                    token_id: token.address,
                }
            );
            return deposit[0]
        } catch (error) {
            console.log(error, 'getDeposit')
        }
    }

    const checkBalance = async (tokens: any) => {
        // console.log(tokens , "TOKENS.......")
        try {
            setLoading(true)
            let _tokens: any = [];
            for (const token of tokens) {
                let amount = await getDeposit(token);
                const formattedAmount = formatValueInDecimals(
                    amount,
                    token.decimals
                );
                if (parseFloat(amount) > 0) {
                    let _token = {
                        ...token,
                        amount,
                        formattedAmount: formattedAmount
                    };
                    _tokens.push(_token);
                }
            }
            // console.log(_tokens , "UNDERSCORE TOKENS")
            setFilteredTokens(_tokens)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
    };


    useEffect(() => {
        if (tokens && connectedAccount && accountId && !filteredTokens) {
            checkBalance(tokens)
        }
    }, [tokens, connectedAccount, accountId])



    const handleWithdraw = async (token: any) => {
        const contract = accounts.SOR;
        const gas = "300000000000000";
        const deposit = "1";
        let transactions: Transaction[] = [];
        try {
            const actions: FunctionCallAction[] = [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_tokens",
                        args: {
                            token_id: token.address,
                            amount: token.amount,
                        },
                        gas,
                        deposit,
                    },
                },
            ];

            const transaction: Transaction = {
                signerId: accountId as string,
                receiverId: contract,
                actions: actions,
            };
            transactions.push(transaction);
            (await selector.wallet())
            .signAndSendTransactions({
              transactions
            }).then((res)=>{
              if (!res) return;
        
              const transactionHashes = (Array.isArray(res) ? res : [res])?.map(
                (r) => r.transaction.hash
              );
              const parsedTransactionHashes = transactionHashes?.join(',');
              const newHref = window.location.origin + window.location.pathname + `?transactionHashes=${parsedTransactionHashes}`;
              window.location.href = newHref;
            }).catch((error)=>{
              console.log(error, "Transaction error");
            })

        } catch (error) {
            console.log(error)
        }
    }


    return (
        <Modal isCentered isOpen={open} onClose={() => null}>
            <ModalOverlay />
            <ModalContent
                backgroundColor="#5F456A"
                maxW="600px"
                minW="400px"
                width="90%"
            >
                <ModalHeader>
                    <div className="flex items-center justify-between mt-4">
                        <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
                            Lost Tokens
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
                    <div className="w-full h-[500px] relative pb-6 overflow-y-scroll">
                        <div className='bg-white-600 rounded-md py-1 px-3 grid grid-cols-3 gap-4'>
                            <div className="text-white font-semibold text-sm flex items-center justify-start">
                                Token
                            </div>
                            <div className="text-white font-semibold text-sm flex items-center justify-start">
                                Balance
                            </div>
                            <div className="text-white font-semibold text-sm flex items-center justify-start">
                                Action
                            </div>
                        </div>

                        {filteredTokens && filteredTokens.length > 0 ? (
                            <>
                                {filteredTokens.map((token: any, index: number) => {
                                    return (
                                        <div className='bg-white-600 rounded-md py-2 px-3 grid grid-cols-3 gap-4 mt-4'>
                                            <div className="text-white font-semibold text-sm flex items-center">
                                                {token.icon ? (
                                                    <Image
                                                        src={token.icon}
                                                        style={{ height: "28px", width: "28px" }}
                                                        mr={2}
                                                        className="mr-2"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
                                                )}
                                                <Box>
                                                    <Text fontSize={16}>{token.symbol}</Text>
                                                    <Text
                                                        fontSize={12}
                                                        fontWeight="semibold"
                                                        color="#9c94a7"
                                                    >
                                                        {token.name}
                                                    </Text>
                                                </Box>
                                            </div>
                                            <div className="text-white font-semibold text-sm flex items-center">
                                                {formatNumberWithSuffix(parseFloat(token.formattedAmount))}
                                            </div>
                                            <div>
                                                <Button
                                                    onClick={() => handleWithdraw(token)}
                                                    outline={true}
                                                    className="min-w-[150px] mt-0"
                                                >
                                                    Withdraw
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                                
                            </>
                        ) : ("")}
                        {!isLoading && filteredTokens && !filteredTokens.length ? (
                            <p className="text-white font-semibold text-sm flex items-center justify-center text-center mt-2">
                                No lost tokens found.
                            </p>
                        ) : ""}

                        {isLoading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center pb-14 mt-8">
                                <Spinner
                                    thickness='4px'
                                    speed='0.65s'
                                    emptyColor='gray.200'
                                    color='#4b2354'
                                    size='xl'
                                />
                                <p className="text-white font-semibold text-sm flex items-center justify-center text-center mt-2">
                                    Please wait, this may take some time..</p>
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                </ModalBody>

            </ModalContent>
        </Modal>
    )
}

export default LostWithdraw