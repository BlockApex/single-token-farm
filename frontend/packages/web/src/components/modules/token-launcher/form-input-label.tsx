import { FormLabel, Input, Text } from "@chakra-ui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

interface FormInputAndLabelProps {
  placeholder: string;
  label: JSX.Element | string;
  inputName: string;
  type?: string;
  showDetails?: boolean;
  sublabel?: string;
  stepName?: string;
}

export function FormInputAndLabel({
  placeholder,
  label,
  inputName,
  type,
  showDetails = true,
  sublabel,
  stepName,
}: FormInputAndLabelProps) {
  const { register } = useFormContext();
  const [hasFocus, setFocus] = useState(false);

  return (
    <>
      <FormLabel
        className={`${stepName}`}
        fontSize="16px"
        fontWeight="600"
        lineHeight="16px"
        mb="13px"
        mt="35px"
      >
        {label}
      </FormLabel>
      <Input
        border="0px"
        backgroundColor="rgba(255,255,255,0.2)"
        borderRadius="10px"
        width="93%"
        height="40px"
        fontWeight="400"
        fontSize="14px"
        lineHeight="40px"
        pl="20px"
        _placeholder={{ color: "#FFF", opacity: "0.5" }}
        placeholder={placeholder}
        {...register(inputName)}
        type={type}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        mb="8px"
        onWheel={(event) => {
          event.currentTarget.blur();
        }}
      />
      {hasFocus && showDetails && (
        <div className="flex flex-row">
          <ExclamationCircleIcon className="absolute w-[15px] h-[15px] white md:leading-3 mt-[5px] sm:mt-[2px]" />

          <Text className="pl-5 sm:pl-0 sm:absolute mt-1 text-[12px] text-white sm:leading-3 left-9">
            {sublabel}
          </Text>
        </div>
      )}
    </>
  );
}