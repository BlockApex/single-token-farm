import { X_JUMP_TOKEN } from "@/env/contract";
import { viewFunction } from "@/tools";
import { WalletSelector } from "@near-wallet-selector/core";
import { useNearQuery } from "react-near";

const defaultLPOptions = {
  contract: import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
  poolInterval: 1000 * 60,
  onError: console.warn,
};

export type InvestorInfo = {
  account_id: string;
  storage_deposit: string;
  storage_used: string;
  is_listing_owner: string;
  staked_token: string;
  last_check: string;
};

export const useViewInvestor = (account_id: string) => {
  return useNearQuery<InvestorInfo>("view_investor", {
    ...defaultLPOptions,
    skip: !account_id,
    variables: {
      account_id: account_id,
    },
  });
};

export const useViewVestedAllocations = (
  account_id: string,
  listing_id: string
) => {
  return useNearQuery<string>("view_vested_allocations", {
    ...defaultLPOptions,
    skip: !account_id || !listing_id,
    variables: {
      listing_id,
      account_id,
    },
  });
};

export const useViewTotalEstimatedInvestorAllowance = (account_id: string) => {
  return useNearQuery<string>("view_investor_allowance", {
    ...defaultLPOptions,
    skip: !account_id,
    variables: {
      account_id,
    },
  });
};
export const useViewLaunchpadSettings = () => {
  return useNearQuery<{
    membership_token: string;
    token_lock_period: string;
    tiers_minimum_tokens: string[];
    tiers_entitled_allocations: string[]; // number of allocations to which each tier of members is entitled in phase 1
    allowance_phase_2: string; // number of allocations to which every user is entitled in phase 2
    partner_dex: string;
  }>("view_contract_settings", {
    ...defaultLPOptions,
  });
};

export const useXTokenBalance = (wallet: string) => {
  return useNearQuery<string, { account_id: string }>("ft_balance_of", {
    contract: import.meta.env.VITE_STAKING_CONTRACT,
    variables: {
      account_id: wallet!,
    },
    poolInterval: 1000 * 60,
    skip: !wallet,
  });
};

export const useTokenMetadata = (account_id: string) => {
  return useNearQuery<{ decimals: number }, { account_id: string }>(
    "ft_metadata",
    {
      contract: account_id!,
      poolInterval: 1000 * 60,
      skip: !account_id,
    }
  );
};

export const useViewInvestorAllowance = (
  account_id: string,
  listing_id: string
) => {
  return useNearQuery<string>("view_investor_allowance", {
    ...defaultLPOptions,
    skip: !account_id || !listing_id,
    variables: {
      listing_id,
      account_id,
    },
  });
};

export const useViewInvestorAllocation = (
  account_id: string,
  listing_id: string
) => {
  const {
    data = [],
    loading,
    error,
    refetch,
  } = useNearQuery<[string, string]>("view_investor_allocation", {
    ...defaultLPOptions,
    skip: !account_id || !listing_id,
    variables: {
      listing_id,
      account_id,
    },
  });

  return {
    loading,
    error,
    refetch,
    data: {
      allocationsBought: data[0],
      totalTokensBought: data[1],
    },
  };
};

export async function useSettings(selector: WalletSelector) {
  const settings = await viewFunction(
    selector,
    import.meta.env.VITE_JUMP_LAUNCHPAD_CONTRACT,
    "view_contract_settings"
  );
  return settings;
}

export async function useXJumpMetadata(selector: WalletSelector) {
  const metadata = await viewFunction(selector, X_JUMP_TOKEN, "ft_metadata");
  return metadata;
}

export async function useCollectionStakedNfts(
  selector: WalletSelector,
  collection: string
): Promise<number> {
  try {
    let allStaked = [];
    let from_index = 0;
    while (true) {
      const staked = await viewFunction(
        selector,
        import.meta.env.VITE_NFT_STAKING_CONTRACT,
        "view_staked",
        {
          collection: {
            type: "NFTContract",
            account_id: selector,
          },
          from_index,
          limit: 50,
        }
      );
      from_index += 50;
      allStaked.concat(staked);
      if (staked.length < 50) {
        break;
      }
    }

    return allStaked.length;
  } catch (e) {
    console.warn(e);

    return 1;
  }
}
