import { useState, Fragment } from "react";
import isEmpty from "lodash/isEmpty";
import { useNearQuery } from "react-near";
import { useNftStaking } from "@/stores/nft-staking-store";
import { CheckIcon, ArrowRightIcon } from "@/assets/svg";
import { ModalImageDialog, Button, If } from "@/components";
import { Flex, Text, Spinner } from "@chakra-ui/react";
import { useWalletSelector } from "@/context/wallet-selector";

export function NFTStakeModal({
  //TODO redo this component
  isOpen = false,
  onClose = () => {},
  collection,
}: {
  isOpen: boolean;
  collection: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const { selector, accountId } = useWalletSelector();

  const { stake } = useNftStaking();

  const stakeNFT = async (items?: string[]) => {
    if (!selected) {
      return;
    }

    stake(selector, accountId!, collection, items ?? selected);
  };

  const select = (id: string) => {
    const items = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];

    setSelected(items);
  };

  const { data, loading } = useNearQuery("nft_tokens_for_owner", {
    contract: collection,
    variables: {
      account_id: accountId,
      from_index: "0",
      limit: 100,
    },
    skip: !accountId,
  });

  return (
    <ModalImageDialog
      image="https://images.unsplash.com/photo-1642525027649-00d7397a6d4a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2670&q=80"
      isOpen={isOpen}
      title="Stake NFT"
      minH="max-content"
      minW="800px"
      onClose={() => {
        setSelected([]);
        onClose();
      }}
      footer={
        !loading &&
        !isEmpty(data) && (
          <Fragment>
            <Button white className="w-fit" onClick={() => stakeNFT()}>
              Stake Now!
              <ArrowRightIcon />
            </Button>

            <Button
              inline
              onClick={() => {
                stakeNFT(data?.map(({ token_id }) => token_id) || []);
              }}
            >
              Stake All
            </Button>
          </Fragment>
        )
      }
      shouldBlurBackdrop
    >
      <Flex w="100%" direction="column">
        <Text color="white" marginTop="-12px" marginBottom="12px">
          please select your NFTs
        </Text>

        {loading ? (
          <Flex height="320px" alignItems="center" justifyContent="center">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <If
            condition={!isEmpty(data)}
            fallback={
              <Flex pt="64px" marginTop="auto">
                <Text fontSize="18px">
                  You don&apos;t have tokens available to stake
                </Text>
              </Flex>
            }
          >
            <Flex
              rowGap="12px"
              flexWrap="wrap"
              maxHeight="320px"
              overflow="auto"
              className="jdx-content"
            >
              {data &&
                data.map(({ metadata, token_id }, i) => (
                  <Flex
                    key={"nft-stake-token" + i}
                    borderRadius="20px"
                    cursor="pointer"
                    width="100%"
                    height="auto"
                    padding="3px"
                    position="relative"
                    onClick={() => select(token_id)}
                    background={
                      selected.includes(token_id) ? "#761BA0" : "transparent"
                    }
                  >
                    <img
                      width="100%"
                      height="100%"
                      className="aspect-square"
                      src={`https://images.weserv.nl/?url=${metadata.media}&dpr=4`}
                      loading="lazy"
                    ></img>

                    {selected.includes(token_id) && (
                      <Flex
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        borderRadius="20px"
                        alignItems="center"
                        position="absolute"
                        justifyContent="center"
                        backdropFilter="blur(3px)"
                        background="rgba(0, 0, 0, .1)"
                      >
                        <CheckIcon color="#761BA0" height="48px" width="48px" />
                      </Flex>
                    )}
                  </Flex>
                ))}
            </Flex>
          </If>
        )}
      </Flex>
    </ModalImageDialog>
  );
}
