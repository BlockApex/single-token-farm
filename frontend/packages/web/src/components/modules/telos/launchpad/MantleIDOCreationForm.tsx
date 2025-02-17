import { FormButton, FormInputAndLabel } from "@/components";
import { Flex, FormControl, FormLabel } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LaunchPadAbi from "@/contracts/Launchpad.json";
import {
  Address,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { toast } from "react-hot-toast";
import { IdoContractArgs, formInputData } from "../helper/types";
import { dataCheck } from "../helper/helper";
import { parseEther } from "viem";
import { erc20ABI } from "wagmi";
import { set } from "date-fns";

export default function MantleIDOCreationForm({
  LaunchPadAddress,
}: {
  LaunchPadAddress: Address;
}) {
  const { control, register, watch } = useFormContext();
  const { address } = useAccount();
  const [dataChecked, setDataChecked] = useState(false);
  const [idoData, setIdoData] = useState<IdoContractArgs | null>(null);
  const [idoArgs, setIdoArgs] = useState<any[]>([]);
  const [approved, setApproved] = useState(false);

  const { config: approveConfig } = usePrepareContractWrite({
    address: idoData?.vestingTokenAddress,
    abi: erc20ABI,
    functionName: "approve",
    //@ts-ignore
    args: [LaunchPadAddress, idoData?.totalSaleAmount || "0"],
    enabled: !!idoData?.vestingTokenAddress && !!idoData?.totalSaleAmount,
  });
  const { data: approveData, writeAsync: approveWrite } =
    useContractWrite(approveConfig);
  const { isFetching: approveLoading, isSuccess: approveSuccess } =
    useWaitForTransaction({
      hash: approveData?.hash,
    });
  const { config: createIdoConfig } = usePrepareContractWrite({
    address: LaunchPadAddress,
    abi: LaunchPadAbi.abi,
    functionName: "createProject",
    args: idoArgs,
    enabled: dataChecked && approveSuccess,
  });

  const { data: createIdoData, writeAsync: createIdoWrite } =
    useContractWrite(createIdoConfig);
  const {
    data: data,
    isFetching: createIdoLoading,
    isSuccess: createIdoSuccess,
  } = useWaitForTransaction({
    hash: createIdoData?.hash,
  });
  async function onFormSubmit(e) {
    e.preventDefault();
    const formData: formInputData = watch() as formInputData;
    if (!dataChecked) {
      if (!dataCheck(formData)) {
        return;
      }

      if (!address) return toast.error("Please connect your wallet");

      const privateStartTimeSeconds = Math.floor(
        formData.privateSaleStartDate.getTime() / 1000
      );
      const publicStartTimeSeconds = Math.floor(
        formData.publicSaleStartDate.getTime() / 1000
      );
      const vestingStartTimeSeconds = Math.floor(
        formData.vestingStartDate.getTime() / 1000
      );

      const args: IdoContractArgs = {
        ownerAddress: address,
        saleTokenAddress: formData.saleTokenAddress as Address,
        vestingTokenAddress: formData.vestingTokenAddress as Address,
        totalSaleAmount: parseEther(`${formData.totalSaleAmount}`).toString(),
        tokenPerAllocation: parseEther(
          `${formData.vestingTokenPerAllocation}`
        ).toString(),
        privateStartTime: privateStartTimeSeconds.toString(),
        privateSaleDuration: formData.privateSaleDuration.toString(),
        publicStartTime: (publicStartTimeSeconds + 1).toString(),
        publicSaleDuration: formData.publicSaleDuration.toString(),
        vestingStartTime: (vestingStartTimeSeconds + 2).toString(),
        initialReleasePercent: (
          formData.initialReleasePercentage * 100
        ).toString(),
        cliffStartTime: (vestingStartTimeSeconds + 3).toString(),
        cliffDuration: formData.vestingDuration.toString(),
        nativePrivateSalePrice: parseEther(`${0}`).toString(),
        nativePublicSalePrice: parseEther(`${0}`).toString(),
        privateSalePrice: parseEther(
          `${formData.privatePricePerAllocation}`
        ).toString(),
        publicSalePrice: parseEther(
          `${formData.publicPricePerAllocation}`
        ).toString(),
      };
      const argsArray = Object.values(args);
      setIdoArgs(argsArray);
      setDataChecked(true);
      setIdoData(args);
    } else if (!approveSuccess) {
      if (!approveWrite) {
        toast.error("Error generating approval transaction");
        return;
      }
      await approveWrite();
    } else {
      if (!createIdoWrite) {
        toast.error("Error generating create ido transaction");
        return;
      }
      await createIdoWrite();
    }
  }

  const ButtonWord = useCallback(() => {
    if (!dataChecked) {
      return "Verify Data";
    } else if (!approveSuccess) {
      if (approveLoading) {
        return "Approving...";
      }
      return "Approve";
    } else {
      return "Create IDO";
    }
  }, [dataChecked, approved, approveLoading, approveSuccess]);

  return (
    <Flex
      pl={{ base: "none", md: "10%" }}
      pr="3%"
      flex={1.6}
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      height="100%"
    >
      <p> Note: You need to have permission to create IDO Launchpad.</p>
      <FormControl id="ido-form" mt="37px" pl={4}>
        <form id="ido-form" onSubmit={onFormSubmit}>
          <FormInputAndLabel
            label="Price Token Address"
            placeholder="eg. 0x1234..."
            inputName="saleTokenAddress"
            sublabel="Set your price token."
          />
          {/*   <FormInputAndLabel
            label="Price Token Decimals"
            placeholder="eg. 18"
            inputName="saleTokenDecimals"
            sublabel="Set your price token decimals."
          /> */}
          <FormInputAndLabel
            label="Vesting Token Address"
            placeholder="eg. 0x1234..."
            inputName="vestingTokenAddress"
            sublabel="Set your vesting token."
          />
          {/*    <FormInputAndLabel
            label="Vesting Token Decimals"
            placeholder="eg. 18"
            inputName="vestingTokenDecimals"
            sublabel="Set your vesting token decimals."
          /> */}
          <FormInputAndLabel
            label="Total Sale Amount"
            placeholder="eg. 1000000000"
            inputName="totalSaleAmount"
            sublabel="Set your total sale amount.(must be divisible by vesting token per allocation)"
          />

          <FormInputAndLabel
            label="Vesting Token Per Allocation"
            placeholder="eg. 2000000"
            inputName="vestingTokenPerAllocation"
          />
          {watch("totalSaleAmount") && watch("vestingTokenPerAllocation") && (
            <div className="ml-7">
              {watch("totalSaleAmount") % watch("vestingTokenPerAllocation") !==
              0 ? (
                <div className="text-red">
                  Total sale amount must be divisible by vesting token per
                  allocation
                </div>
              ) : (
                <div className="text-green-500">
                  Total Allocations :{" "}
                  {watch("totalSaleAmount") /
                    watch("vestingTokenPerAllocation")}
                </div>
              )}
            </div>
          )}
          <FormInputAndLabel
            label="Private Price Per Allocation(Price Token)"
            placeholder="eg. 20"
            inputName="privatePricePerAllocation"
            sublabel="Set your private price per allocation. eg 20 USDC per allocation."
          />
          <FormInputAndLabel
            label="Public Price Per Allocation(Price Token)"
            placeholder="eg. 20"
            inputName="publicPricePerAllocation"
            sublabel="Set your public price per allocation. eg 60 USDC per allocation."
          />

          {watch("totalSaleAmount") && watch("privatePricePerAllocation") && (
            <div className="ml-7 mt-7">
              Total private sale price :{" "}
              {(watch("totalSaleAmount") / watch("vestingTokenPerAllocation")) *
                watch("privatePricePerAllocation")}
            </div>
          )}
          {watch("totalSaleAmount") && watch("publicPricePerAllocation") && (
            <div className="ml-7 mt-3">
              Total public sale price :{" "}
              {(watch("totalSaleAmount") / watch("vestingTokenPerAllocation")) *
                watch("publicPricePerAllocation")}
            </div>
          )}
          <div className="flex flex-row flex-wrap gap-7 ">
            <DateDurationPicker
              control={control}
              label="Private Sale Start Date"
              placeholder="Select a date"
              inputName="privateSaleStartDate"
              sublabel=""
              durationLabel="Private Sale Duration(days)"
              durationInputName="privateSaleDuration"
            />

            <DateDurationPicker
              control={control}
              label="Public Sale Start Date"
              placeholder="Select a date"
              inputName="publicSaleStartDate"
              sublabel=""
              durationLabel="Public Sale Duration(days)"
              durationInputName="publicSaleDuration"
            />

            <DateDurationPicker
              control={control}
              label="Cliif Start Date"
              placeholder="Select a date"
              inputName="vestingStartDate"
              sublabel=""
              durationLabel="Cliff Duration(days)"
              durationInputName="vestingDuration"
            />
          </div>
          <FormInputAndLabel
            label="Initial Release Percentage"
            placeholder="eg. 10"
            inputName="initialReleasePercentage"
            sublabel="Set your initial release percentage."
          />
        </form>
      </FormControl>
      <FormButton
        mt={{ base: "41px", md: "61px" }}
        mb={{ base: "30px", md: "none" }}
        title={ButtonWord()}
        bg="#6E3A85"
        color="#FFF"
        type="submit"
        form="ido-form"
      />
    </Flex>
  );
}

function DateDurationPicker({
  control,
  label,
  placeholder,
  inputName,
  sublabel,
  durationLabel,
  durationInputName,
}: {
  control: any;
  label: string;
  placeholder: string;
  inputName: string;
  sublabel: string;
  durationLabel: string;
  durationInputName: string;
}) {
  return (
    <Controller
      control={control}
      name={inputName}
      render={({ field }) => (
        <div>
          <FormLabel
            fontSize="16px"
            fontWeight="600"
            lineHeight="16px"
            mb="13px"
            mt="35px"
          >
            {label}
          </FormLabel>
          <DatePicker
            placeholderText="Select a date"
            className="bg-white/20 rounded-xl text-white p-2"
            onChange={(date) => field.onChange(date)}
            selected={field.value}
            showTimeSelect
            dateFormat="Pp"
          />
          <FormInputAndLabel
            label={durationLabel}
            placeholder={placeholder}
            inputName={durationInputName}
            sublabel={sublabel}
          />
        </div>
      )}
    />
  );
}