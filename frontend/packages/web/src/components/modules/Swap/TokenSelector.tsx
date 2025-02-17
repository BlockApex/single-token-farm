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
import Balance from "./Balance"
import { useEffect, useState } from "react";
import { RxTriangleDown } from "react-icons/rx";
import { IoSearch } from "react-icons/io5";
import { RxDash } from "react-icons/rx";
import { IoStarOutline, IoStar } from "react-icons/io5";
import { useTokens } from "../../../utils/tokens";
import { TokenMetadataType } from "@/utils/types";
import { getDefaultTokens } from "@/utils/defaultTokens";


interface TokenSelectorProps {
  label: string;
  balance: string | null;
  setSelectedToken: (token: TokenMetadataType) => void;
  token: TokenMetadataType;
  tokenAmount: string | undefined;
  setTokenAmount: (amount: string) => void;
  tokenToFilter: TokenMetadataType;
  connectedAccount?: any
}

type TokenListIdentifier = "strict" | "all";

export const TokenSelector = ({
  label,
  balance,
  setSelectedToken,
  token,
  tokenAmount,
  setTokenAmount,
  tokenToFilter,
  connectedAccount
}: TokenSelectorProps) => {
  const defaultTokens = getDefaultTokens();
  const {
    tokens,
    strict,
    loading,
    starredTokens: storageStarredTokens,
    refetch,
  } = useTokens();
  const [isTokenListSelected, setIsTokenListSelected] =
    useState<boolean>(false);
  const [tokenListIdentifier, setTokenListIdentifier] =
    useState<TokenListIdentifier>("strict");
  // const [balanceInUSD, setBalanceInUSD] = useState<number>(0);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTokenList, setSelectedTokenList] =
    useState<TokenMetadataType[]>(strict);
  const [filteredTokens, setFilteredTokens] =
    useState<TokenMetadataType[]>(selectedTokenList);
  const [starredTokens, setStarredTokens] =
    useState<TokenMetadataType[]>(storageStarredTokens);


  // useEffect(() => {
  //   const convertTokenPriceToUSD = async () => {
  //     if (balance) {
  //       if (!balanceInUSD) {
  //         const nearUsdRate = await fetchNearToUsdRate();
  //         setBalanceInUSD(convertNearToUsd(balance, nearUsdRate));
  //       }
  //     }
  //   };

  //   convertTokenPriceToUSD();
  // }, [balanceInUSD, balance]);

  const addStarredTokensToStorage = (starredTokens: TokenMetadataType[]) => {
    // if (starredTokens.length) {
    localStorage.setItem("starred_tokens", JSON.stringify(starredTokens));
    // }
  };

  useEffect(() => {
    // if (storageStarredTokens.length) {
    // console.log(storageStarredTokens)
    setStarredTokens(storageStarredTokens);
    // }
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

  const handleStarClick = (token: TokenMetadataType) => {
    let tokensCopy = [...starredTokens];
    let tokenExist = tokensCopy.find((t) => showStar(t, token));

    if (!tokenExist) {
      // If the token doesn't exist, add it to the starred tokens
      tokensCopy = [...tokensCopy, token];
      addStarredTokensToStorage(tokensCopy);
      refetch();
    } else {
      // If the token exists, check if isNear is true and remove accordingly
      let filterTokens;

      if (token?.isNear) {
        // Remove the token with the same address and isNear: true
        filterTokens = tokensCopy.filter(
          (t) => !(t.address === token.address && t.isNear)
        );
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


  const filterTokens = (t: TokenMetadataType) => {
    if (tokenToFilter.isNear) {
      return t.address !== tokenToFilter.address || !t.isNear;
    }
    if (!tokenToFilter.isNear) {
      return t.address !== tokenToFilter.address || t.isNear
    }
  }


  const TokenList = () => {
    return (
      <Modal
        isOpen={isTokenListSelected}
        onClose={() => {
          setSearchQuery("");
          setIsTokenListSelected(false);
        }}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent backgroundColor="#4d3059" color="white">
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
                    {starredTokens
                      .filter(filterTokens)
                      .map((token, index) => (
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
                            setIsTokenListSelected(false);
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
                            <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
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
                        tokenListIdentifier === "all"
                          ? "#65516c"
                          : "transparent"
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
                    mt="15px"
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
                              setTokenAmount("0");
                              setIsTokenListSelected(false);
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
                                  <Balance connectedAccount={connectedAccount} token={filteredToken} />
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

  const maxTheInputWithBalance = () => {
    setTokenAmount(balance ? balance : "0");
  };

  const halfTheInputWithBalance = () => {
    setTokenAmount(
      parseFloat(balance!) ? (parseFloat(balance!) / 2.0).toString() : "0"
    );
  };

  const backgrounColor = label === "primary" ? "#FFFFFF1A" : "#FFFFFF1A";
  return (
    <Box pt="8px">
      {isTokenListSelected ? TokenList() : <></>}
      <Box
        background={backgrounColor}
        padding="0 0 0 8px"
        borderRadius="xl"
        color="white"
        height="100px"
        borderColor={isInputFocused ? "#7b20a2" : "none"}
        boxShadow={isInputFocused ? "#7b20a2" : "none"}
        transition="box-shadow 0.2s, border-color 0.2s"
      >
        <Flex align="center" justify="space-between" pt="12px" wrap="nowrap">
          <Box borderRadius="xl" bg="#FFFFFF1A" className="min-w-[120px]">
            <Flex
              align="center"
              justify="space-between"
              wrap="nowrap"
              w="full"
              as="button"
              onClick={() => {
                refetch();
                setIsTokenListSelected(true);
              }}
            >
              <Box p="6px">
                {token.icon ? (
                  <Image
                    src={token.icon}
                    style={{ height: "28px", width: "28px" }}
                    mr={2}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
                )}
              </Box>
              <Text color="white">{token.symbol}</Text>
              <Box>
                <RxTriangleDown color="white" />
              </Box>
            </Flex>
          </Box>
          <Input
            type="number"
            placeholder="0.00"
            _placeholder={{ color: "white" }}
            border="none"
            fontWeight="bold"
            textAlign="right"
            title=''
            fontSize="20px"
            ml="4"
            w="fit-content"
            value={tokenAmount}
            min={0}
            disabled={label !== "primary"}
            _focus={{ boxShadow: "none", borderColor: "transparent" }}
            onFocus={() => {
              setIsInputFocused(true);
            }}
            onBlur={() => {
              setIsInputFocused(false);
            }}
            onChange={(e) => {
              if (label === "primary") {
                setTokenAmount(e.target.value);
              }
            }}
          />
        </Flex>
        {/* <Text
          fontSize="14px"
          align="right"
          paddingRight="16px"
          alignContent="center"
          fontWeight="bold"
          color="#d1d5db"
        >
          $-{balanceInUSD.toFixed(2)}
        </Text> */}
        {label === "primary" ? (
          <Flex
            justifyContent="right"
            margin="6px 16px 6px 0"
            color="#A6ACB7"
            fontWeight="bold"
            fontSize="12px"
          >
            <Text
              margin="0 8px 0 0"
              as="button"
              onClick={() => {
                halfTheInputWithBalance();
              }}
            >
              Half
            </Text>
            <Text
              as="button"
              onClick={() => {
                maxTheInputWithBalance();
              }}
            >
              Max
            </Text>

          </Flex>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
};
