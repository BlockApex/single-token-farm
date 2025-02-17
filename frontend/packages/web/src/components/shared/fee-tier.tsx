import React from "react";
import { Button, Flex, Input, InputGroup, Box } from "@chakra-ui/react";
import { VscPercentage } from "react-icons/vsc";

export const FeeTier = ({ feeTier, setFeeTier, hasInput = true }) => {
  const slippageValues = [0.1, 0.5, 1];
  return (
    <div className="w-full md:w-[70%] flex items-center justify-start">
      <section className="w-full bg-[#47272D] h-[26px] flex items-center rounded-full">
        {slippageValues.map((value, index) => (
          <Button
            id={index.toString()}
            key={value}
            onClick={() => setFeeTier(value)}
            flex="1"
            borderRadius="full"
            height="full"
            bg={feeTier === value ? "#572550" : "transparent"}
            // color="white"
            _hover={{ bg: "#4d3059" }}
            _active={{ bg: "#572550" }}
            className="text-sm text-white font-normal p-3"
          >
            {value}%
          </Button>
        ))}
      </section>
      {hasInput && (
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
          height="26px"
        >
          <Flex align="center">
            <Input
              _placeholder={{ color: "white" }}
              value={feeTier}
              type="number"
              height="full"
              border="none"
              borderRadius="full"
              w="60px"
              textAlign="right"
              focusBorderColor="#7b20a2"
              className="text-sm text-white font-normal"
              onChange={(e) => {
                const value = e.target.value;
                setFeeTier(parseFloat(value));
              }}
            />
            <Box className="pr-2">
              <VscPercentage />
            </Box>
          </Flex>
        </InputGroup>
      )}
    </div>
  );
};
