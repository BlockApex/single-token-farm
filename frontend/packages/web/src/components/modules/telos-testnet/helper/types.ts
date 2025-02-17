import { Address } from "wagmi";

export interface IdoContractArgs {
  ownerAddress: Address;
  saleTokenAddress: Address;
  vestingTokenAddress: Address;
  totalSaleAmount: string;
  tokenPerAllocation: string;
  privateStartTime: string;
  privateSaleDuration: string;
  publicStartTime: string;
  publicSaleDuration: string;
  vestingStartTime: string;
  initialReleasePercent: string;
  cliffStartTime: string;
  cliffDuration: string;
  nativePrivateSalePrice: string;
  nativePublicSalePrice: string;
  privateSalePrice: string;
  publicSalePrice: string;
}

export interface formInputData {
  saleTokenAddress: string;
  /*   saleTokenDecimals: number; */
  /*   vestingTokenDecimals: number; */
  vestingTokenAddress: string;
  totalSaleAmount: number;
  vestingTokenPerAllocation: number;
  privateSaleStartDate: Date;
  privateSaleDuration: number;
  publicSaleStartDate: Date;
  publicSaleDuration: number;
  vestingStartDate: Date;
  initialReleasePercentage: number;
  vestingDuration: number;
  privatePricePerAllocation: number;
  publicPricePerAllocation: number;
}
export interface IDOProjectData {
  id: string;
  owner: Address;
  totalSaleAmount: string;
  totalSoldAmount: string;
  totalInvestors: string;
  tokenPerAllocation: string;
  saleToken: Address;
  vestingToken: Address;
  privateSalePrice: string;
  publicSalePrice: string;
  nativePrivateSalePrice: string;
  nativePublicSalePrice: string;
  privateStartTime: string;
  privateEndTime: string;
  publicStartTime: string;
  publicEndTime: string;
  vestingStartTime: string;
  initialReleasePercent: string;
  cliffStartTime: string;
  cliffEndTime: string;
  allowTieredSale: boolean;
  vestingTokenFunedAmount: string;
  saleTokenReceived: string;
  nativeTokenReceived: string;
}

export interface IDOProjectDatabaseData {
  id: string;
  name: string;
  description: string;
  logo?: string;
  website?: string;
  whitepaper?: string;
  owner?: Address;
  privateStartTime?: string;
  privateEndTime?: string;
  publicStartTime?: string;
  publicEndTime?: string;
  totalSale?: string;
  totalSold?: string;
  publicPrice?: string;
  privatePrice?: string;
  saleToken?: Address;
  vestingToken?: Address;
}
