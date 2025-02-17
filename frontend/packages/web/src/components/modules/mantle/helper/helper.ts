import toast from "react-hot-toast";
import { formInputData } from "./types";
const DAY = 86400000;

const ERROR_PRIVATE_SALE_START_DATE =
  "Private sale start date must be after now";

const ERROR_PUBLIC_SALE_START_DATE =
  "Public sale start date must be after private sale end duration";
const ERROR_VESTING_START_DATE =
  "Vesting start date must be after public sale end duration";

const ERROR_ALLOCATION_NOT_DIVISIBLE =
  "Allocation must be divisible by total sale amount";
const ERROR_PERCENTAGE = "Percentage must be between 0 and 100";
const ERROR_DURATION = "Duration must be greater than 0";
const ERROR_PRICE = "Price must be greater than 0";

export function dataCheck(data: formInputData) {
  if (
    !data.saleTokenAddress ||
    !data.saleTokenDecimals ||
    !data.vestingTokenAddress ||
    !data.vestingTokenDecimals ||
    !data.totalSaleAmount ||
    !data.vestingTokenPerAllocation ||
    !data.privatePricePerAllocation ||
    !data.publicPricePerAllocation ||
    !data.privateSaleStartDate ||
    !data.privateSaleDuration ||
    !data.publicSaleStartDate ||
    !data.publicSaleDuration ||
    !data.vestingStartDate ||
    !data.vestingDuration ||
    !data.initialReleasePercentage
  ) {
    toast.error("Please fill all the fields");
    return false;
  }

  if (data.privateSaleStartDate.getTime() < Date.now()) {
    toast.error(ERROR_PRIVATE_SALE_START_DATE);
    return false;
  }

  if (
    data.privateSaleStartDate.getTime() + Number(data.privateSaleDuration) >
    data.publicSaleStartDate.getTime()
  ) {
    console.log(
      data.privateSaleStartDate.getTime() + Number(data.privateSaleDuration)
    );
    console.log(data.publicSaleStartDate.getTime());
    console.log(
      data.privateSaleStartDate.getTime() + Number(data.privateSaleDuration) >
      data.publicSaleStartDate.getTime()
    );

    toast.error(ERROR_PUBLIC_SALE_START_DATE);
    return false;
  }
  if (
    data.publicSaleStartDate.getTime() + Number(data.publicSaleDuration) >
    data.vestingStartDate.getTime()
  ) {
    toast.error(ERROR_VESTING_START_DATE);
    return false;
  }
  return true;
}

export function parseRawIDOData(projectData: any) {
  const data = projectData as any[];
  if (!data) return undefined;
  if (data.length === 0) return undefined;

  const _parsedData = {
    id: data[0].toString(),
    owner: data[1],
    totalSaleAmount: data[2].toString(),
    totalSoldAmount: data[3].toString(),
    totalInvestors: data[4].toString(),
    tokenPerAllocation: data[5].toString(),
    saleToken: data[6],
    vestingToken: data[7],
    privateSalePrice: data[8].toString(),
    publicSalePrice: data[9].toString(),
    nativePrivateSalePrice: data[10].toString(),
    nativePublicSalePrice: data[11].toString(),
    privateStartTime: data[12].toString(),
    privateEndTime: data[13].toString(),
    publicStartTime: data[14].toString(),

    publicEndTime: data[15].toString(),
    vestingStartTime: data[16].toString(),
    initialReleasePercent: data[17].toString(),
    cliffStartTime: data[18].toString(),
    cliffEndTime: data[19].toString(),
    allowTieredSale: data[20],
    vestingTokenFunedAmount: data[21].toString(),
    saleTokenReceived: data[22].toString(),
    nativeTokenReceived: data[23].toString(),
  };
  return _parsedData;
}

export function convertSecondStringToDateTime(seconds: string) {
  return new Date(parseInt(seconds) * 1000).toLocaleString();
}