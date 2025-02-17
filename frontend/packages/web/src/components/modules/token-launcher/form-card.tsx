import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { Card } from "../../shared";
import {
  ExclamationCircleIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { FormButton } from "./form-button";
import { FormInputAndLabel } from "./form-input-label";
import { useFormContext } from "react-hook-form";
import { FormHeader } from "./form-header";
import { useMemo, useState } from "react";
import { XCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";

interface FormCardProps {
  onSubmitStepForm: (data: any) => void;
}

export function FormCardStep1({ onSubmitStepForm }: FormCardProps) {
  const { register, watch } = useFormContext();
  const [hasFocus, setFocus] = useState(false);

  const requiredInputs = {
    name: watch("name"),
    symbol: watch("symbol"),
    decimals: watch("decimals"),
  };

  const datalinkPrefix = "data:image/svg+xml";

  const tokenImg = watch("icon");

  const isTokenImgInvalid = useMemo(() => {
    return tokenImg?.slice(0, 18).includes(datalinkPrefix) || !tokenImg
      ? false
      : true;
  }, [tokenImg]);

  function checkInputLenghtGreaterThanZero(input: string) {
    return input?.length > 0;
  }

  const requiredInputsFilled = Object.values(requiredInputs).every(
    checkInputLenghtGreaterThanZero
  );

  const isButtonDisabled = !requiredInputsFilled || isTokenImgInvalid;

  const tooltipLabel =
    "The icon image must be a Data URL, to help consumers \
   display it quickly while protecting user data. Recommendation: use optimized \
   SVG, which can result in high - resolution images with only 100s of bytes of \
   storage cost. Further information on Data URLS is available at\
   www.developer.mozilla.org";

  return (
    <Card
      p="3px"
      flexGrow="1"
      borderRadius="25px"
      height={{ sm: "auto", md: "984px" }}
    >
      <Flex
        pl={{ base: "none", md: "10.3%" }}
        pr="3%"
        flex={1.6}
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="center"
        height="100%"
      >
        <FormHeader title="Set the basics" step="Step 1/2" />
        <FormControl id="form-step-1" mt="37px" pl={4}>
          <form id="form-step-1" onSubmit={onSubmitStepForm}>
            <FormInputAndLabel
              label="Token name"
              placeholder="Ex: Bitcoin, Ethereum"
              inputName="name"
              sublabel="Set your token name."
            />
            <FormInputAndLabel
              label="Symbol"
              placeholder="Ex: BTC, ETH"
              inputName="symbol"
              sublabel="Set your token abbreviation."
            />
            <FormLabel
              fontSize="16px"
              fontWeight="600"
              lineHeight="16px"
              mb="13px"
              mt="35px"
              display="flex"
            >
              Token image
              <Tooltip
                label={tooltipLabel}
                bg="gray.200"
                color="black"
                placement="top-start"
              >
                <Box className="w-[15px] h-[15x] white leading-3 ml-1">
                  <QuestionMarkOutlinedIcon />
                </Box>
              </Tooltip>
            </FormLabel>
            <div className="relative">
              <Input
                isInvalid={isTokenImgInvalid}
                errorBorderColor="#DB2B1F"
                pl="57px"
                border="0px"
                backgroundColor="rgba(255,255,255,0.2)"
                borderRadius="10px"
                width="93%"
                height="40px"
                fontWeight="400"
                fontSize="14px"
                lineHeight="40px"
                _placeholder={{ color: "#FFF", opacity: "0.5" }}
                placeholder="Paste URL here"
                {...register("icon")}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                mb="8px"
                focusBorderColor={!isTokenImgInvalid ? "blue.400" : "#DB2B1F"}
              />
              <div
                className="h-[40px] w-[40px] border-r-[1px] 
                        absolute left-0 top-0 border-[rgba(255,255,255,0.19)]"
              />
              <GlobeAltIcon
                className="h-[14px] w-[14px] 
                            absolute left-[13px] top-[13px] "
              />
            </div>
            {!isTokenImgInvalid && hasFocus && (
              <div className="flex flex-row">
                <ExclamationCircleIcon
                  className="absolute w-[15px] h-[15px] white sm:leading-3
                   mt-[5px] sm:mt-[2px]"
                />

                <Text
                  className="pl-5 sm:pl-0 sm:absolute mt-1 text-[12px]
                   text-white sm:leading-3 left-9"
                >
                  Set your token icon using a Data URL. In case of doubt, refer
                  to the tooltip on the question mark icon.
                </Text>
              </div>
            )}
            {isTokenImgInvalid && (
              <div className="flex flex-row">
                <XCircleIcon
                  className="absolute w-[17px] h-[17px] leading-3 mt-[1px]"
                  color="#DB2B1F"
                />

                <Text
                  className="absolute mt-1 text-[12px] leading-3 left-9"
                  color="#DB2B1F"
                >
                  Please, provide a valid Data URL.
                </Text>
              </div>
            )}
            <FormInputAndLabel
              label="Decimals"
              placeholder="Ex: 18"
              inputName="decimals"
              type="number"
              sublabel="Set the number of decimals of your token."
            />
            <FormInputAndLabel
              label={
                <>
                  Reference <span className="font-normal">(optional)</span>
                </>
              }
              placeholder="Paste URL here"
              inputName="reference"
              sublabel="The reference must be a link to a valid JSON file
               containing various keys with additional token details."
            />
            <FormInputAndLabel
              label={
                <>
                  Hash reference <span className="font-normal">(optional)</span>
                </>
              }
              placeholder="Ex: 0xe96909eAd7598C0B489A881749f87B1e412e2f47"
              inputName="reference_hash"
              sublabel="The reference hash is the base64-encoded sha256 hash
               of the JSON file contained in the reference field."
            />
          </form>
        </FormControl>
        <FormButton
          isDisabled={isButtonDisabled}
          mt={{ base: "41px", md: "61px" }}
          mb={{ base: "30px", md: "none" }}
          title="Create token"
          bg="#6E3A85"
          color="#FFF"
          type="submit"
          form="form-step-1"
        />
      </Flex>
    </Card>
  );
}
