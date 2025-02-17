import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Text,
  Box,
} from "@chakra-ui/react";

export function NftStorageConfirmModal({
  isOpen,
  handleClose,
  stakeSelectedStakableTokens,
}: {
  isOpen: boolean;
  handleClose: () => void;
  stakeSelectedStakableTokens: () => void;
}) {
  function handleStake() {
    window.localStorage.setItem("shownStorageWarning", "true");
    /*   stakeSelectedStakableTokens(); */
    handleClose();
  }
  return (
    <>
      <div>
        <Modal isOpen={isOpen} onClose={handleClose}>
          <ModalOverlay />

          <ModalContent
            mt="65px"
            display="flex"
            width={{ base: "90%", md: "29%" }}
            height="626px"
            flexDirection="column"
            borderRadius="12px"
            backgroundColor="#FFF"
            alignContent="center"
            justifyContent="flex-start"
            position="relative"
            overflow="hidden"
          >
            <ModalHeader
              display="flex"
              width="100%"
              flexDirection="column"
              alignContent="center"
              justifyContent="center"
              pt="45px"
              pl="15%"
              pr="15%"
            >
              <Text
                color="#000"
                fontWeight="800"
                fontSize="1.125rem"
                textAlign="center"
              >
                Welcome to Jump DeFi
              </Text>
              <Text
                backgroundColor="#7000ff"
                fontWeight="800"
                fontSize="1.125rem"
                textAlign="center"
                backgroundImage="linear-gradient(45deg, #AE59F0, #7646FF)"
                backgroundSize="100%"
                backgroundRepeat="repeat"
                sx={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  MozBackgroundClip: "text",
                  MozTextFillColor: "transparent",
                }}
              >
                NFT Staking
              </Text>
            </ModalHeader>
            <ModalBody
              pl="7%"
              pr="7%"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-start"
              gap="24px"
            >
              <Box
                pt="28px"
                pl="16px"
                pb="28px"
                gap="8px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="12px"
                boxShadow="0px 2px 10px 1px rgba(152, 73, 156, 0.25)"
                backgroundColor="#FFF"
                width="100%"
                zIndex="100"
              >
                <Flex direction="column" gap="9px" pt="5px" ml="-2px">
                  <Text
                    color="#000"
                    fontWeight="700"
                    lineHeight="100%"
                    fontSize="0.875rem"
                  >
                    About Storage Fee
                  </Text>
                  <Text
                    color="rgba(0,0,0,0.8)"
                    fontWeight="400"
                    lineHeight="130%"
                    fontSize="0.875rem"
                    pr="50px"
                  >
                    NEAR smart contracts require a one-time storage fee of 0.25
                    Near upon first use.
                  </Text>
                  <Text
                    color="rgba(0,0,0,0.8)"
                    fontWeight="400"
                    lineHeight="130%"
                    fontSize="0.875rem"
                    pr="50px"
                  >
                    <b>
                      The storage fee is redeemable when you no longer use the
                      application.{" "}
                    </b>
                  </Text>
                  <Text
                    color="rgba(0,0,0,0.8)"
                    fontWeight="400"
                    lineHeight="130%"
                    fontSize="0.875rem"
                    pr="50px"
                  >
                    Note: Claiming Locked JUMP rewards also requires a one-time
                    0.5 NEAR storage fee which goes to a separate smart contract
                  </Text>
                </Flex>
              </Box>
              <Button
                width="225px"
                height="46px"
                gap="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                padding="16px 40px"
                backgroundColor="#894DA0"
                color="#FFF"
                borderRadius="10px"
                boxShadow="0px 4px 10px #DCA0DF"
                onClick={handleStake}
                _hover={{ backgroundColor: "#894DA0" }}
                zIndex="100"
              >
                <Text
                  textAlign="center"
                  fontWeight="600"
                  fontSize="0.875rem"
                  lineHeight="100%"
                >
                  Confirm
                </Text>
              </Button>
            </ModalBody>

            <ModalFooter
              display="flex"
              alignItems="center"
              justifyContent="center"
              pb="46px"
              mt="9px"
            ></ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </>
  );
}
