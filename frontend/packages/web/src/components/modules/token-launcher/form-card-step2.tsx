import { Box, Flex, FormControl, FormLabel, Text } from "@chakra-ui/react";
import { Card } from "../../shared";
import { FormButton } from "./form-button";
import { FormInputAndLabel } from "./form-input-label";
import { FormHeader } from "./form-header";
import { useEffect, useRef, useState, RefObject } from "react";
import { ChevronDownIcon, ChevronLeftIcon } from "@heroicons/react/24/solid";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface FormCardProps {
  onReturnFunction: () => void;
  onSubmitStep2Form: () => void;
  onUpdateTokenType: (value: string) => void;
}

export function FormCardStep2({
  onReturnFunction,
  onSubmitStep2Form,
  onUpdateTokenType,
}: FormCardProps) {
  const [selectedOpen, setSelectOpen] = useState<Boolean>(false);
  const [selectedValue, setSelectedValue] = useState<string>("Select");

  const ref = useRef(null) as RefObject<HTMLDivElement>;

  function handleSelectValue(value: string) {
    setSelectedValue(value);
    onUpdateTokenType(value);
  }

  const handleClickOutsideOfSelect = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setSelectOpen(false);
    }
  };

  useEffect(() => {
    if (selectedValue != "Select") {
      setSelectOpen(false);
    }
  }, [selectedValue]);

  useEffect(() => {
    document.addEventListener("click", handleClickOutsideOfSelect, true);

    return () => {
      document.removeEventListener("click", handleClickOutsideOfSelect, true);
    };
  }, []);

  const isButtonDisabled = selectedValue == "Select";

  return (
    <Card p="3px" flexGrow="1" borderRadius="25px" height="auto">
      <Flex
        pl={{ base: "none", md: "10.3%" }}
        pr="3%"
        flex={1.6}
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="center"
        height="100%"
        width="100%"
      >
        <FormHeader title="Set up the Tokenomics" step="Step 2/2" />
        <FormControl mt="37px" pl={4}>
          <form id="form-step-2" onSubmit={onSubmitStep2Form}>
            <FormLabel
              fontSize="16px"
              fontWeight="600"
              lineHeight="16px"
              mb="13px"
              mt="31px"
            >
              Token Type
            </FormLabel>
            <Box
              border="0px"
              backgroundColor="rgba(255,255,255,0.2)"
              borderRadius="10px"
              width="93%"
              height="40px"
              pl="20px"
              onClick={() => setSelectOpen(true)}
              cursor="pointer"
              ref={ref}
            >
              <div className="relative w-full h-full">
                <Text
                  color={
                    selectedValue == "Select" ? "rgba(255,255,255,0.5)" : "#FFF"
                  }
                  lineHeight="40px"
                  fontSize="14px"
                >
                  {selectedValue}
                </Text>

                <ChevronDownIcon
                  className="absolute w-[20px] h-[19px] 
                                white top-[12px] right-[30px]"
                />
              </div>
              {selectedOpen && (
                <Box
                  borderRadius="15px"
                  height="148px"
                  width="91.4%"
                  position="absolute"
                  backgroundColor="#FFF"
                  boxShadow="0px 4px 15px rgba(43, 1, 24, 0.2)"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-around"
                  padding="16px 11px 20px 8px"
                  ml="-20px"
                  top="110px"
                  zIndex="1000"
                >
                  <Text
                    width="100%"
                    color="#000"
                    lineHeight="40px"
                    fontSize="16px"
                    pl="16px"
                    borderRadius="12px"
                    transition="0.1s background-color"
                    _hover={{ backgroundColor: "#D6B8D8" }}
                    onClick={() => handleSelectValue("Fixed Supply Token")}
                  >
                    Fixed Supply Token
                  </Text>
                  <Text
                    width="100%"
                    color="#000"
                    lineHeight="40px"
                    fontSize="16px"
                    pl="16px"
                    borderRadius="12px"
                    transition="0.1s background-color"
                    _hover={{ backgroundColor: "#D6B8D8" }}
                    onClick={() => handleSelectValue("Mintable Token")}
                  >
                    Mintable Token
                  </Text>
                </Box>
              )}
            </Box>
            {selectedValue == "Mintable Token" && (
              <>
                <FormLabel
                  fontSize="16px"
                  fontWeight="600"
                  lineHeight="16px"
                  mb="13px"
                  mt="31px"
                >
                  Supply Type
                </FormLabel>
                <Box
                  border="0px"
                  backgroundColor="rgba(255,255,255,0.2)"
                  borderRadius="10px"
                  width="93%"
                  height="40px"
                  pl="20px"
                >
                  <Text
                    color="rgba(255,255,255,0.5)"
                    lineHeight="40px"
                    fontSize="14px"
                  >
                    Unlimited
                  </Text>
                </Box>
                <FormInputAndLabel
                  placeholder="Ex: 10000"
                  label="Initial Supply"
                  inputName="total_supply"
                  type="number"
                  showDetails={false}
                />
                <div className="flex flex-row">
                  <div className="flex flex-column h-[40px] items-center  mr-[7px]">
                    <ExclamationCircleIcon className="w-[15px] h-[15px] white" />
                  </div>
                  <Text fontSize="12px" lineHeight="40px" color="#FFF">
                    Set your token initial supply
                  </Text>
                </div>
              </>
            )}
            {selectedValue == "Fixed Supply Token" && (
              <>
                <FormLabel
                  fontSize="16px"
                  fontWeight="600"
                  lineHeight="16px"
                  mb="13px"
                  mt="31px"
                >
                  Supply Type
                </FormLabel>
                <Box
                  border="0px"
                  backgroundColor="rgba(255,255,255,0.2)"
                  borderRadius="10px"
                  width="93%"
                  height="40px"
                  pl="20px"
                >
                  <Text
                    color="rgba(255,255,255,0.5)"
                    lineHeight="40px"
                    fontSize="14px"
                  >
                    Fixed
                  </Text>
                </Box>
                <FormInputAndLabel
                  placeholder="Ex: 10000"
                  label="Maximum Supply"
                  inputName="total_supply"
                  type="number"
                  showDetails={false}
                />
                <div className="flex flex-row">
                  <div className="flex flex-column h-[40px] items-center mr-[7px]">
                    <ExclamationCircleIcon className="w-[15px] h-[15px] white" />
                  </div>

                  <Text fontSize="12px" lineHeight="40px" color="#FFF">
                    Set your token maximum supply
                  </Text>
                </div>
              </>
            )}
          </form>
        </FormControl>
        <Flex
          gap="16px"
          width="100%"
          justifyContent="center"
          alignItems="center"
          mt="50px"
          mb={{ base: "30px", md: "6px" }}
          pr={{ base: "none", md: "40px" }}
          flexDirection={{ base: "column", md: "row" }}
        >
          <FormButton
            onClick={() => onReturnFunction()}
            title={"Back"}
            leftIcon={<ChevronLeftIcon className="w-[23px] h-[23px]" />}
            bg="#FFF"
            color="#6E3A85"
          />
          <FormButton
            isDisabled={isButtonDisabled}
            type="submit"
            title="Create token"
            bg="#6E3A85"
            color="#FFF"
            form="form-step-2"
          />
        </Flex>
      </Flex>
    </Card>
  );
}
