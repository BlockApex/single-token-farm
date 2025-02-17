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
import {
  CurrencyDollarIcon,
  CodeBracketIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { WalletIcon, JumpKangaroo, JumpKangarooUpsidedown } from "@/assets/svg";

export function FormIntroModal({
  isOpen,
  handleClose,
}: {
  isOpen: boolean;
  handleClose: () => void;
}) {
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
            <Box className="absolute z-0 top-[150px] left-[-20px]">
              <JumpKangaroo />
            </Box>
            <Box className="absolute z-0">
              <JumpKangarooUpsidedown />
            </Box>

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
                Token Launch
              </Text>
              <Text
                mt="22px"
                color="rgba(0, 0, 0, 0.7)"
                fontWeight="400"
                fontSize="0.875rem"
                textAlign="center"
                lineHeight="14px"
              >
                The first tool on NEAR Protocol that allows you to create tokens
                with few clicks
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
                gap="8px"
                display="flex"
                alignItems="flex-start"
                justifyContent="flex-start"
                borderRadius="12px"
                boxShadow="0px 2px 10px 1px rgba(152, 73, 156, 0.25)"
                backgroundColor="#FFF"
                height="99px"
                width="100%"
                zIndex="100"
              >
                <CodeBracketIcon className="w-[23px] h-[23px] text-[#894DA0] stroke-2" />
                <Flex direction="column" gap="9px" pt="5px">
                  <Text
                    color="#000"
                    fontWeight="700"
                    lineHeight="100%"
                    fontSize="0.875rem"
                  >
                    No coding required
                  </Text>
                  <Text
                    color="rgba(0,0,0,0.8)"
                    fontWeight="400"
                    lineHeight="100%"
                    fontSize="0.875rem"
                  >
                    Create NEP-141 tokens easily
                  </Text>
                </Flex>
              </Box>
              <Box
                pt="28px"
                pl="16px"
                gap="8px"
                display="flex"
                alignItems="flex-start"
                justifyContent="flex-start"
                borderRadius="12px"
                boxShadow="0px 2px 10px 1px rgba(152, 73, 156, 0.25)"
                backgroundColor="#FFF"
                height="99px"
                width="100%"
                zIndex="100"
              >
                <CurrencyDollarIcon className="w-[23px] h-[23px] text-[#894DA0] stroke-1" />
                <Flex direction="column" gap="9px" pt="5px">
                  <Text
                    color="#000"
                    fontWeight="700"
                    lineHeight="100%"
                    fontSize="0.875rem"
                  >
                    Sustainable tokenomics
                  </Text>
                  <Text
                    color="rgba(0,0,0,0.8)"
                    fontWeight="400"
                    lineHeight="100%"
                    fontSize="0.875rem"
                  >
                    Optimized for a variety of applications
                  </Text>
                </Flex>
              </Box>
              <Box
                pt="28px"
                pl="16px"
                gap="8px"
                display="flex"
                alignItems="flex-start"
                justifyContent="flex-start"
                borderRadius="12px"
                boxShadow="0px 2px 10px 1px rgba(152, 73, 156, 0.25)"
                backgroundColor="#FFF"
                height="99px"
                width="100%"
                zIndex="100"
              >
                <WalletIcon className="w-[30px] h-[30px] text-[#894DA0] mt-[-5px]" />

                <Flex direction="column" gap="9px" pt="5px" ml="-2px">
                  <Text
                    color="#000"
                    fontWeight="700"
                    lineHeight="100%"
                    fontSize="0.875rem"
                  >
                    Tokens sent to your wallet
                  </Text>
                  <Text
                    color="rgba(0,0,0,0.8)"
                    fontWeight="400"
                    lineHeight="130%"
                    fontSize="0.875rem"
                    pr="50px"
                  >
                    Get your tokens easily, sent directly to your wallet
                  </Text>
                </Flex>
              </Box>
            </ModalBody>

            <ModalFooter
              display="flex"
              alignItems="center"
              justifyContent="center"
              pb="46px"
              mt="9px"
            >
              <Button
                width="225px"
                height="46px"
                gap="10px"
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
                padding="16px 40px"
                backgroundColor="#894DA0"
                color="#FFF"
                borderRadius="10px"
                boxShadow="0px 4px 10px #DCA0DF"
                onClick={handleClose}
                _hover={{ backgroundColor: "#894DA0" }}
                zIndex="100"
              >
                <Text
                  textAlign="center"
                  fontWeight="600"
                  fontSize="0.875rem"
                  lineHeight="100%"
                >
                  Create your token
                </Text>
                <ArrowRightIcon className="text-white w-[18px] h-[18px]" />
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </>
  );
}
