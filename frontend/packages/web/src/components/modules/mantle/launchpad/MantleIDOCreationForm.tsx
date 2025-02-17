import { FormButton, FormInputAndLabel } from "@/components";
import { Flex, FormControl, FormLabel } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
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
import { parseEther, parseUnits } from "viem";
import { erc20ABI } from "wagmi";
import { set } from "date-fns";
import { Tutorial } from "@/components";
import PageContainer from "@/components/PageContainer";
const stepItems = [
  {
    element: ".priceToken",
    title: "Price Token Address",
    intro: (
      <div>
        <span>
          Enter the address of the token that will be used to buy the project
        </span>
      </div>
    ),
  },
  {
    element: ".vestingToken",
    title: "Vesting Token Address",
    intro: (
      <div>
        <span>
          Enter the address of the token that will be used to distribute the
          project
        </span>
      </div>
    ),
  },
  {
    element: ".totalSaleAmount",
    title: "Total Sale Amount",
    intro: (
      <div>
        <span>
          Enter the amount of VESTING tokens that will be sold in the project
        </span>
      </div>
    ),
  },
  {
    element: ".vestingTokenPerAllocation",
    title: "Vesting Token Per Allocation",
    intro: (
      <div>
        <span>
          Enter the amount of VESTING tokens that will be distributed per
          allocation
        </span>
      </div>
    ),
  },
  {
    element: ".dates",
    title: "Setting the date and time",
    intro: (
      <div>
        <span>
          Set the date and time when the project will be launched. Please make
          sure the days and hours are correct set and not overlapped
        </span>
      </div>
    ),
  },
];

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
  async function onFormSubmit(e: any) {
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
        totalSaleAmount: parseUnits(
          `${formData.totalSaleAmount}`,
          formData.vestingTokenDecimals
        ).toString(),
        tokenPerAllocation: parseUnits(
          `${formData.vestingTokenPerAllocation}`,
          formData.vestingTokenDecimals
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
        privateSalePrice: parseUnits(
          `${formData.privatePricePerAllocation}`,
          formData.saleTokenDecimals
        ).toString(),
        publicSalePrice: parseUnits(
          `${formData.publicPricePerAllocation}`,
          formData.saleTokenDecimals
        ).toString(),
      };

      console.log(args);

      const argsArray = Object.values(args);
      setIdoArgs(argsArray);
      setDataChecked(true);
      setIdoData(args);
    } else if (!approveSuccess) {
      if (!approveWrite) {
        toast.error("Token not approved, please try again later");
        return;
      }
      await approveWrite();
    } else {
      if (!createIdoWrite) {
        toast.error("Error creating IDO, please try again later");
        return;
      }
      await createIdoWrite();
      toast.success("IDO Transaction sent, allow some time for it to process");
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
    <PageContainer>
      <Flex gap={5} className="flex-col lg:flex-row mb-[10px] relative">
        <Tutorial items={stepItems} />
      </Flex>

      <Flex
        pl={{ base: "none", md: "10%" }}
        pr="3%"
        flex={1.6}
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="center"
        height="100%"
      >
        <p> Note: You may need to have permission to create IDO Launchpad.</p>
        <FormControl id="ido-form" mt="37px" pl={4}>
          <form id="ido-form" onSubmit={onFormSubmit}>
            <FormInputAndLabel
              label="Price Token Address(The token invester pay for IDO)"
              placeholder="eg. 0x1234..."
              inputName="saleTokenAddress"
              sublabel="Set your price token."
              stepName="priceToken"
            />

            <FormInputAndLabel
              label="Price Token Decimals"
              placeholder="eg. 6 for USDC , 18 for ERC20"
              inputName="saleTokenDecimals"
              sublabel="Set your price token decimals."
            />
            <FormInputAndLabel
              label="Vesting Token Address(The token invester will get)"
              placeholder="eg. 0x1234..."
              inputName="vestingTokenAddress"
              sublabel="Set your vesting token."
              stepName="vestingToken"
            />
            <FormInputAndLabel
              label="Vesting Token Decimals"
              placeholder="eg. 18"
              inputName="vestingTokenDecimals"
              sublabel="Set your vesting token decimals."
            />
            <FormInputAndLabel
              label="Total Sale Amount"
              placeholder="eg. 1000000000"
              inputName="totalSaleAmount"
              sublabel="Set your total sale amount.(must be divisible by vesting token per allocation)"
              stepName="totalSaleAmount"
            />

            <FormInputAndLabel
              label="Vesting Token Per Allocation"
              placeholder="eg. 2000000"
              inputName="vestingTokenPerAllocation"
              stepName="vestingTokenPerAllocation"
            />
            {watch("totalSaleAmount") && watch("vestingTokenPerAllocation") && (
              <div className="ml-7">
                {watch("totalSaleAmount") %
                  watch("vestingTokenPerAllocation") !==
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
              stepName="privatePricePerAllocation"
            />
            <FormInputAndLabel
              label="Public Price Per Allocation(Price Token)"
              placeholder="eg. 20"
              inputName="publicPricePerAllocation"
              sublabel="Set your public price per allocation. eg 60 USDC per allocation."
              stepName="publicPricePerAllocation"
            />

            {watch("totalSaleAmount") && watch("privatePricePerAllocation") && (
              <div className="ml-7 mt-7">
                Total private sale price :{" "}
                {(watch("totalSaleAmount") /
                  watch("vestingTokenPerAllocation")) *
                  watch("privatePricePerAllocation")}
              </div>
            )}
            {watch("totalSaleAmount") && watch("publicPricePerAllocation") && (
              <div className="ml-7 mt-3">
                Total public sale price :{" "}
                {(watch("totalSaleAmount") /
                  watch("vestingTokenPerAllocation")) *
                  watch("publicPricePerAllocation")}
              </div>
            )}
            <div className="flex flex-row flex-wrap gap-7 dates">
              <DateDurationPicker
                control={control}
                label="Private Sale Start Date"
                placeholder="Select a date"
                inputName="privateSaleStartDate"
                sublabel=""
                durationLabel="Private Sale Duration(Seconds)"
                durationInputName="privateSaleDuration"
              />

              <DateDurationPicker
                control={control}
                label="Public Sale Start Date"
                placeholder="Select a date"
                inputName="publicSaleStartDate"
                sublabel=""
                durationLabel="Public Sale Duration(Seconds)"
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
              stepName="initialReleasePercentage"
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
    </PageContainer>
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
            placeholder={"eg. 10"}
            inputName={durationInputName}
            sublabel={sublabel}
          />
        </div>
      )}
    />
  );
}
