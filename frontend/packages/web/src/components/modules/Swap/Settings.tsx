import { useState } from "react";

import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Input,
  InputGroup,
} from "@chakra-ui/react";
import { InfoTooltip } from "@/components/shared";
import { VscPercentage } from "react-icons/vsc";
import { GoQuestion } from "react-icons/go";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";
import { RoundCross } from "@/assets/svg";

interface SettingsProps {
  setSelectedSlippage: (value: number) => void;
  selectedSlippage: number;
  isOpen: boolean;
  onClose: () => void;
}

const slippageValues = [0.5, 1 , 1.5];

const TooltipContent = () => {
  return (
    <div className="p-2">
      <p className="text-white-400">
        Slippage means the difference between what you expect to get and what
        you actually get due to other executing first
      </p>
    </div>
  );
};

export const Settings = ({
  isOpen,
  onClose,
  selectedSlippage,
  setSelectedSlippage,
}: SettingsProps) => {
  const slippages = () => {
    return (
      <Flex align="center" justify="space-between">
        <Flex
          bg="#47272D"
          borderRadius="full"
          p="2px"
          align="center"
          justify="space-between"
          height="24px"
        >
          {slippageValues.map((value, index) => (
            <Button
              id={`${index + 1}`}
              key={value}
              flex="1"
              borderRadius="full"
              height="full"
              onClick={() => setSelectedSlippage(value)}
              bg={selectedSlippage === value ? "#572550" : "transparent"}
              color="white"
              width="58px"
              _hover={{ bg: "#4d3059" }}
              _active={{ bg: "#572550" }}
            >
              {value}%
            </Button>
          ))}
        </Flex>
        <InputGroup
          _placeholder={{ color: "white" }}
          border="none"
          fontWeight="bold"
          color="white"
          fontSize="14px"
          ml="4"
          w="85px"
          bg="#47272D"
          borderRadius="full"
          height="24px"
        >
          <Flex align="center">
            <Input
              _placeholder={{ color: "white" }}
              value={selectedSlippage}
              type="number"
              height="full"
              border="none"
              borderRadius="full"
              w="60px"
              textAlign="right"
              focusBorderColor="#7b20a2"
              onChange={(e) => {
                const value = e.target.value;
                setSelectedSlippage(parseFloat(value));
              }}
            />
            <Box>
              <VscPercentage />
            </Box>
          </Flex>
        </InputGroup>
      </Flex>
    );
  };

  return (
    // <Modal isOpen={isOpen} onClose={onClose} isCentered>
    //   <ModalOverlay />
    //   <ModalContent backgroundColor="#4d3059" color="white" >
    //     <ModalHeader fontSize={18}>Settings</ModalHeader>
    //     <ModalCloseButton />
    //     <ModalBody pb={12}>
    //       <Box color="#b8acbd" fontSize="14px" fontWeight="bold">
    //         <Flex mb={4} borderRadius="lg" align="center" justify="flex-start">
    //           <Box pr={2}>Slippage tolerance</Box>
    //           <InfoTooltip label={<TooltipContent />}>
    //             <span className="ml-2 ">
    //               <QuestionMarkOutlinedIcon className="w-4 h-4" />
    //             </span>
    //           </InfoTooltip>
    //         </Flex>
    //         {slippages()}
    //       </Box>
    //     </ModalBody>
    //   </ModalContent>
    // </Modal>
    <section
      className={`${
        isOpen ? "block" : "hidden"
      } bg-[#4d3059] z-10 w-[350px] h-auto absolute -right-16 top-10 rounded-md p-4`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-white tracking-tighter font-bold leading-6 flex items-center">
          Settings
        </h2>
        <button onClick={onClose}>
          <RoundCross />
        </button>
      </div>
      <div className="mt-4 mb-6">
        <Box color="#b8acbd" fontSize="14px" fontWeight="bold">
          <Flex mb={4} borderRadius="lg" align="center" justify="flex-start">
            <Box pr={2}>Slippage tolerance</Box>
            <InfoTooltip label={<TooltipContent />}>
              <span className="ml-2 ">
                <QuestionMarkOutlinedIcon className="w-4 h-4" />
              </span>
            </InfoTooltip>
          </Flex>
          {slippages()}
        </Box>
      </div>
    </section>
  );
};
