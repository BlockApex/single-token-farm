import { useState, useEffect } from "react";
import {
  Flex,
  Input,
  Text,
  Box,
  Icon,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  InputGroup,
  InputLeftElement,
  Button,
} from "@chakra-ui/react";
import { IoSearch } from "react-icons/io5";
import { RxDash } from "react-icons/rx";
import { IoStarOutline, IoStar } from "react-icons/io5";
import { useTokens } from "@/utils/tokens";
import { TokenMetadataType } from "@/utils/types";
import Balance from "@/components/modules/Swap/Balance"
import { useRPCStore } from "@/stores/rpc-store";

type TokenListIdentifier = "strict" | "all";

interface TokenListProp {
  open: boolean;
  setOpen: (o: boolean) => void;
  setSelectedToken: (token: TokenMetadataType) => void;
  tokenToFilter?: TokenMetadataType;
}

const TokenList = ({
  open,
  setOpen,
  setSelectedToken,
  tokenToFilter,
}: TokenListProp) => {
  const { account } = useRPCStore();
  const {
    tokens,
    strict,
    loading,
    starredTokens: storageStarredTokens,
    refetch,
  } = useTokens();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [starredTokens, setStarredTokens] =
    useState<TokenMetadataType[]>(storageStarredTokens);
  const [tokenListIdentifier, setTokenListIdentifier] =
    useState<TokenListIdentifier>("strict");
  const [selectedTokenList, setSelectedTokenList] =
    useState<TokenMetadataType[]>(strict);
  const [filteredTokens, setFilteredTokens] =
    useState<TokenMetadataType[]>(selectedTokenList);

  const addStarredTokensToStorage = (starredTokens: TokenMetadataType[]) => {
    // if (starredTokens.length) {
      localStorage.setItem("starred_tokens", JSON.stringify(starredTokens));
    // }
  };

  useEffect(() => {
    if (storageStarredTokens.length) {
      setStarredTokens(storageStarredTokens);
    }
  }, [storageStarredTokens]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    if (query === "") {
      setFilteredTokens(selectedTokenList);
    } else {
      const filtered = tokens.filter(
        (token) =>
          (token.name.toLowerCase().includes(query) ||
            token.address.toLowerCase().includes(query) ||
            token.symbol.toLowerCase().includes(query)) && filterTokens(token)
      );
      setFilteredTokens(filtered);
    }
  }, [searchQuery, tokens, selectedTokenList]);

  useEffect(() => {
    if (tokenListIdentifier === "all") {
      setSelectedTokenList(tokens);
    } else {
      setSelectedTokenList(strict);
    }
  }, [tokenListIdentifier, tokens, strict]);

  const filterTokens = (t: TokenMetadataType) => {

    if (!tokenToFilter) {
      return true;
    }
    if (tokenToFilter.isNear) {
      return t.address !== tokenToFilter.address || !t.isNear;
    }
    return t.address !== tokenToFilter.address || t.isNear;
  };

  const showStar = (star: TokenMetadataType, token: TokenMetadataType) => {
    if (star.isNear && token?.isNear) {
      return true;
    }
    if (star.address === token.address) {
      if (star.symbol === token.symbol) {
        return true;
      }
    }
  };
  

  const handleStarClick = (token: TokenMetadataType) => {
    let tokensCopy = [...starredTokens];
    let tokenExist = tokensCopy.find((t) => showStar(t, token));
    console.log(tokenExist , "TOKEN EXIST.....")

    if (!tokenExist) {
      // If the token doesn't exist, add it to the starred tokens
      tokensCopy = [...tokensCopy, token];
      addStarredTokensToStorage(tokensCopy);
      refetch();
    } else {
      // If the token exists, check if isNear is true and remove accordingly
      let filterTokens;

      if (token?.isNear) {
        console.log("is near ", token)
        // Remove the token with the same address and isNear: true
        filterTokens = tokensCopy.filter(
          (t) => !(t.address === token.address && t.isNear)
        );
        console.log(filterTokens)
      } else {
        // Remove the token with the same address and isNear: false (or undefined)
        filterTokens = tokensCopy.filter(
          (t) => !(t.address === token.address && !t.isNear)
        );
      }

      addStarredTokensToStorage(filterTokens);
      refetch();
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        setOpen(false);
      }}
      size="lg"
      isCentered={true}
    >
      <ModalOverlay />
      <ModalContent backgroundColor="#4d3059" color="white" mt={20}>
        <ModalHeader fontSize={24}>Select a token</ModalHeader>
        <ModalCloseButton onClick={() => setSearchQuery("")} />
        <ModalBody pb={12}>
          {loading ? (
            "Loading..."
          ) : (
            <Box>
              <InputGroup
                bg="#3e2647"
                fontWeight="bold"
                borderRadius="xl"
                color="#D1D5DB"
              >
                <InputLeftElement pointerEvents="none">
                  <IoSearch style={{ height: "26px", width: "26px" }} />
                </InputLeftElement>
                <Input
                  type="text"
                  borderRadius="xl"
                  placeholder="Search name or paste address..."
                  fontSize={16}
                  _placeholder={{ color: "#D1D5DB" }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              {starredTokens.length > 0 ? (
                <Flex mt={8} gap={2} width="100%" wrap="wrap">
                  {starredTokens.filter(filterTokens).map((token, index) => (
                    <Flex
                      id={`${token.address}${index}-star-${index}`}
                      key={`${token.address}${index}-star-${index}`}
                      bg="#3e2647"
                      border="1px"
                      borderColor="#65516c"
                      align="center"
                      as="button"
                      textAlign="left"
                      width="fit-content"
                      borderRadius="xl"
                      p={2}
                      onClick={() => {
                        setSelectedToken(token);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      {token.icon ? (
                        <Image
                          src={token.icon}
                          style={{ height: "28px", width: "28px" }}
                          mr={2}
                        />
                      ) : (
                        <Icon color="white" ml={1} mr={4} />
                      )}
                      <Flex flexDirection="column">
                        <Text fontSize={16}>{token.symbol}</Text>
                        <Text
                          fontSize={12}
                          fontWeight="semibold"
                          color="#9c94a7"
                        >
                          {token.name}
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </Flex>
              ) : (
                <></>
              )}
              <Flex mt={8} justifyContent="space-between" align="center">
                <Flex bg="#3e2647" width="min-content" borderRadius="xl">
                  <Button
                    id="1"
                    key="1"
                    borderRadius="xl"
                    onClick={() => setTokenListIdentifier("strict")}
                    bg={
                      tokenListIdentifier === "strict"
                        ? "#65516c"
                        : "transparent"
                    }
                    color="white"
                    width={20}
                    _hover={{ bg: "#572550" }}
                    _active={{ bg: "#65516c" }}
                  >
                    Strict
                  </Button>
                  <Button
                    id="1"
                    key="1"
                    borderRadius="xl"
                    onClick={() => setTokenListIdentifier("all")}
                    bg={
                      tokenListIdentifier === "all" ? "#65516c" : "transparent"
                    }
                    color="white"
                    width={20}
                    _hover={{ bg: "#572550" }}
                    _active={{ bg: "#65516c" }}
                  >
                    All
                  </Button>
                </Flex>
                <Text
                  fontSize="14px"
                  height="20px"
                  color="#9c94a7"
                  fontWeight="bold"
                  pr="12px"
                  textAlign="right"
                >
                  {/* {balance
                    ? `Balance: ${balance.toFixed(2)}`
                    : balance === 0
                    ? `Balance: ${balance.toFixed(2)}`
                    : "Balance"} */}
                  Balance
                </Text>
              </Flex>
              {filteredTokens.length > 0 ? (
                  <Box overflowY="scroll" maxHeight="300px">
                    {filteredTokens?.filter(filterTokens).map((filteredToken, index) => {
                      return (
                                              
                        <Flex
                          id={`${filteredToken.address}${index}`}
                          key={`${filteredToken.address}${index}`}
                          my={3}
                          mx={2}
                          justifyContent="space-between"
                        >
                          <Flex
                            align="center"
                            as="button"
                            textAlign="left"
                            onClick={() => {
                              setSelectedToken(filteredToken);
                              setOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            {filteredToken.icon ? (
                              <Image
                                src={filteredToken.icon}
                                style={{ height: "28px", width: "28px" }}
                                mr={2}
                                className="mr-2"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
                            )}
                            <Box>
                              <Text fontSize={16}>{filteredToken.symbol}</Text>
                              <Text
                                fontSize={12}
                                fontWeight="semibold"
                                color="#9c94a7"
                              >
                                {filteredToken.name}
                                {/* {filteredToken?.address} */}
                              </Text>
                            </Box>
                          </Flex>
                          <Flex alignItems="center" gap={1} >
                            <Box textAlign="right">
                              <Flex direction="column" alignItems="flex-end">
                                <Text
                                  fontSize="14px"
                                  height="20px"
                                  color="#9c94a7"
                                  fontWeight="bold"
                                  textAlign="right"
                                >
                                  {/* $_${token.rate} */}
                                  <Balance connectedAccount={account} token={filteredToken} />
                                </Text>
                              </Flex>
                            </Box>
                            <Box
                              as="button"
                              // onClick={() => {
                              //   if (starredTokens.length <= 20000) {
                              //     const tokenExistsAlready = starredTokens.find(
                              //       (star) =>
                              //         star.address === filteredToken.address
                              //     );
                              //     if (!tokenExistsAlready) {
                              //       setStarredTokens([
                              //         ...starredTokens,
                              //         filteredToken,
                              //       ]);
                              //       addStarredTokensToStorage([
                              //         ...starredTokens,
                              //         filteredToken,
                              //       ]);
                              //     } else {
                              //       const removedStarredToken =
                              //         starredTokens.filter(
                              //           (star) =>
                              //             star.address !== filteredToken.address
                              //         );
                              //       setStarredTokens(removedStarredToken);
                              //       addStarredTokensToStorage(
                              //         removedStarredToken
                              //       );
                              //     }
                              //   } else {
                              //     const tokenExistsAlready = starredTokens.find(
                              //       (star) =>
                              //         star.address === filteredToken.address
                              //     );
                              //     if (tokenExistsAlready) {
                              //       const removedStarredToken =
                              //         starredTokens.filter(
                              //           (star) =>
                              //             star.address !== filteredToken.address
                              //         );
                              //       setStarredTokens(removedStarredToken);
                              //       addStarredTokensToStorage(
                              //         removedStarredToken
                              //       );
                              //     }
                              //   }
                              // }}
                              onClick={() => handleStarClick(filteredToken)}
                            >
                              {starredTokens.find((star) =>
                                showStar(star, filteredToken)
                              ) ? (
                                <IoStar
                                  style={{
                                    height: "23px",
                                    width: "23px",
                                    color: "#9c94a7",
                                  }}
                                />
                              ) : (
                                <IoStarOutline
                                  style={{
                                    height: "23px",
                                    width: "23px",
                                    color: "#9c94a7",
                                  }}
                                />
                              )}
                            </Box>
                          </Flex>
                        </Flex>
                      
                      )
                    })}
                  </Box>
                ) : (
                  <Flex
                    flexDirection="column"
                    alignItems="center"
                    justifyItems="center"
                    mt={8}
                  >
                    <Text fontWeight="extrabold">No Tokens Found</Text>
                  </Flex>
                )}
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TokenList;
