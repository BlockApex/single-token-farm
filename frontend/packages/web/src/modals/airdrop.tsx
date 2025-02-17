import Big from "big.js";
import { ModalImageDialog, Button } from "@/components";
import { Flex, Text } from "@chakra-ui/react";
import { useWalletSelector } from "@/context/wallet-selector";
import {
  getTransaction,
  executeMultipleTransactions,
  viewFunction,
} from "@/tools";
import { Transaction } from "@near/ts";

export function AirdropModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { selector, accountId } = useWalletSelector();

  const getJumpTokens = async () => {
    const wallet = await selector.wallet();

    const tokens = await viewFunction(
      selector,
      import.meta.env.VITE_FAUCET_CONTRACT,
      "view_tokens"
    );

    const transactions: Transaction[] = [];

    for (let token of tokens) {
      const metadata = await viewFunction(selector, token, "ft_metadata");
      const decimalsPower = new Big("10").pow(metadata.decimals);

      transactions.push(
        getTransaction(
          accountId!,
          import.meta.env.VITE_FAUCET_CONTRACT,
          "ft_faucet",
          {
            token,
            amount: new Big(20).mul(decimalsPower).toString(),
          },
          "0.51"
        )
      );
    }

    executeMultipleTransactions(transactions, wallet);
  };

  const getNfts = async () => {
    const wallet = await selector.wallet();

    const collections = await viewFunction(
      selector,
      import.meta.env.VITE_FAUCET_CONTRACT,
      "view_nfts"
    );

    const transactions: Transaction[] = [];

    for (let collection of collections) {
      transactions.push(
        getTransaction(
          accountId!,
          import.meta.env.VITE_FAUCET_CONTRACT,
          "nft_faucet",
          {
            collection,
          },
          "0.25"
        )
      );
    }

    executeMultipleTransactions(transactions, wallet);
  };

  return (
    <ModalImageDialog
      image="https://images.unsplash.com/photo-1642525027649-00d7397a6d4a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2670&q=80"
      isOpen={isOpen}
      title="Airdrop Tokens"
      minH="max-content"
      minW="800px"
      onClose={() => onClose()}
      shouldBlurBackdrop
    >
      <Flex w="100%" direction="column">
        <Text color="white" marginTop="-12px" marginBottom="12px">
          Get Tokens to Jump Dex
        </Text>

        <div className="flex flex-col space-y-[12px] items-stretch w-[200px]">
          <Button
            white
            onClick={() => getJumpTokens()}
            className="justify-start"
          >
            Get JUMP Tokens
          </Button>

          <Button white onClick={() => getNfts()} className="justify-start">
            Get NFT's to Stake
          </Button>
        </div>
      </Flex>
    </ModalImageDialog>
  );
}
