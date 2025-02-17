import { useNftStaking } from "@/stores/nft-staking-store";
import { ArrowRightIcon } from "@/assets/svg";
import { ModalImageDialog, Button } from "@/components";
import { Flex, Text, useMediaQuery, Image } from "@chakra-ui/react";
import { Token } from "@near/ts";
import { useWalletSelector } from "@/context/wallet-selector";

export function NFTUnstakeModal({
  selected,
  isOpen = false,
  onClose = () => {},
  collection,
}: {
  isOpen: boolean;
  selected: Token[];
  collection: string;
  onClose: () => void;
}) {
  const { unstake } = useNftStaking();
  const { selector, accountId } = useWalletSelector();
  const [isMobile] = useMediaQuery("(max-width: 810px)");

  return (
    <ModalImageDialog
      image="https://images.unsplash.com/photo-1642525027649-00d7397a6d4a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2670&q=80"
      isOpen={isOpen}
      title="Unstake NFT"
      minH="max-content"
      minW="800px"
      onClose={() => onClose()}
      footer={
        <Button
          white
          full
          onClick={async () =>
            unstake(selector, accountId as string, selected, collection)
          }
        >
          Unstake
          <ArrowRightIcon />
        </Button>
      }
      shouldBlurBackdrop
    >
      <Flex w="100%" direction="column">
        <Text marginTop="-12px" marginBottom="12px">
          Unstake all selected NFT&apos;s?
        </Text>

        <Flex
          rowGap="12px"
          overflow="auto"
          maxHeight="370px"
          flexDirection="column"
        >
          {selected &&
            selected.map(({ metadata }, i) => (
              <Flex
                key={"nft-stake-token" + i}
                borderRadius="20px"
                cursor="pointer"
                width="100%"
                height="auto"
                position="relative"
              >
                <Image
                  width="100%"
                  height="100%"
                  borderRadius="20px"
                  className="aspect-square"
                  src={`https://images.weserv.nl/?url=${metadata.media}&w=800&fit=contain`}
                />
              </Flex>
            ))}
        </Flex>
      </Flex>
    </ModalImageDialog>
  );
}
