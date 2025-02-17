import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export enum CacheControlScope {
  Private = "PRIVATE",
  Public = "PUBLIC",
}

export type CollectionMeta = {
  __typename?: "CollectionMeta";
  image?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
};

export type InvestorAllocation = {
  __typename?: "InvestorAllocation";
  account_id: Scalars["ID"];
  listing_id: Scalars["ID"];
  quantity_withdrawn?: Maybe<Scalars["String"]>;
  total_allocation?: Maybe<Scalars["String"]>;
  total_quantity?: Maybe<Scalars["String"]>;
};

export type LaunchpadInvestor = {
  __typename?: "LaunchpadInvestor";
  account_id: Scalars["ID"];
  allocation_count?: Maybe<Scalars["String"]>;
  last_check?: Maybe<Scalars["String"]>;
  staked_token: Scalars["ID"];
};

export type LaunchpadListing = {
  __typename?: "LaunchpadListing";
  allocation?: Maybe<InvestorAllocation>;
  allocations_sold?: Maybe<Scalars["String"]>;
  cliff_timestamp?: Maybe<Scalars["String"]>;
  description_project?: Maybe<Scalars["String"]>;
  description_token?: Maybe<Scalars["String"]>;
  dex_id?: Maybe<Scalars["String"]>;
  discord?: Maybe<Scalars["String"]>;
  end_cliff_timestamp?: Maybe<Scalars["String"]>;
  fee_liquidity_tokens?: Maybe<Scalars["String"]>;
  fee_price_tokens?: Maybe<Scalars["String"]>;
  final_sale_2_timestamp?: Maybe<Scalars["String"]>;
  fraction_cliff_release?: Maybe<Scalars["String"]>;
  fraction_instant_release?: Maybe<Scalars["String"]>;
  liquidity_pool_price_tokens?: Maybe<Scalars["String"]>;
  liquidity_pool_project_tokens?: Maybe<Scalars["String"]>;
  liquidity_pool_timestamp?: Maybe<Scalars["String"]>;
  listing_id: Scalars["ID"];
  open_sale_1_timestamp?: Maybe<Scalars["String"]>;
  open_sale_2_timestamp?: Maybe<Scalars["String"]>;
  price_token?: Maybe<Scalars["String"]>;
  price_token_info?: Maybe<ProjectTokenInfo>;
  project_allocations_sold?: Maybe<Scalars["String"]>;
  project_name?: Maybe<Scalars["String"]>;
  project_owner: Scalars["ID"];
  project_token: Scalars["ID"];
  project_token_info?: Maybe<ProjectTokenInfo>;
  project_total_amount_sale_project_tokens?: Maybe<Scalars["String"]>;
  public: Scalars["Boolean"];
  status?: Maybe<Scalars["String"]>;
  telegram?: Maybe<Scalars["String"]>;
  token_allocation_price?: Maybe<Scalars["String"]>;
  token_allocation_size?: Maybe<Scalars["String"]>;
  total_amount_sale_project_tokens?: Maybe<Scalars["String"]>;
  twitter?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
  whitepaper?: Maybe<Scalars["String"]>;
};

export type LaunchpadListingAllocationArgs = {
  account_id: Scalars["ID"];
};

export type LaunchpadPage = {
  __typename?: "LaunchpadPage";
  data?: Maybe<Array<Maybe<LaunchpadListing>>>;
  hasNextPage?: Maybe<Scalars["Boolean"]>;
  itemsPerPage?: Maybe<Scalars["Int"]>;
  pageSize?: Maybe<Scalars["Int"]>;
  totalCount?: Maybe<Scalars["Int"]>;
};

export type MessageOutput = {
  __typename?: "MessageOutput";
  message: Scalars["String"];
};

export type NftPage = {
  __typename?: "NFTPage";
  data?: Maybe<Array<Maybe<NftStaking>>>;
  hasNextPage?: Maybe<Scalars["Boolean"]>;
  itemsPerPage?: Maybe<Scalars["Int"]>;
  pageSize?: Maybe<Scalars["Int"]>;
  totalCount?: Maybe<Scalars["Int"]>;
};

export type NftStaking = {
  __typename?: "NFTStaking";
  collection_id: Scalars["ID"];
  collection_image?: Maybe<Scalars["String"]>;
  collection_meta?: Maybe<CollectionMeta>;
  collection_modal_image?: Maybe<Scalars["String"]>;
  collection_owner_id: Scalars["String"];
  early_withdraw_penalty?: Maybe<Scalars["String"]>;
  min_staking_period?: Maybe<Scalars["String"]>;
  rewards?: Maybe<Array<Maybe<NftStakingReward>>>;
  round_interval?: Maybe<Scalars["String"]>;
  token_address: Scalars["ID"];
};

export type NftStakingRewardsArgs = {
  account_id?: InputMaybe<Scalars["ID"]>;
};

export type NftStakingReward = {
  __typename?: "NFTStakingReward";
  account_id?: Maybe<Scalars["String"]>;
  decimals?: Maybe<Scalars["Int"]>;
  icon?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  perMonth?: Maybe<Scalars["String"]>;
  spec?: Maybe<Scalars["String"]>;
  symbol?: Maybe<Scalars["String"]>;
};

export type ProjectTokenInfo = {
  __typename?: "ProjectTokenInfo";
  decimals?: Maybe<Scalars["String"]>;
  image?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  symbol?: Maybe<Scalars["String"]>;
};

export type Query = {
  __typename?: "Query";
  get_historical_ratio?: Maybe<Array<Maybe<XTokenRatio>>>;
  health?: Maybe<MessageOutput>;
  investor_info?: Maybe<LaunchpadInvestor>;
  launchpad_project?: Maybe<LaunchpadListing>;
  launchpad_projects: LaunchpadPage;
  nft_staking_projects: NftPage;
  staking?: Maybe<NftStaking>;
};

export type QueryGetHistoricalRatioArgs = {
  timestamp?: InputMaybe<Scalars["String"]>;
};

export type QueryInvestorInfoArgs = {
  account_id: Scalars["ID"];
};

export type QueryLaunchpadProjectArgs = {
  project_id: Scalars["ID"];
};

export type QueryLaunchpadProjectsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  showMineOnly?: InputMaybe<Scalars["Boolean"]>;
  status?: InputMaybe<StatusEnum>;
  visibility?: InputMaybe<VisibilityEnum>;
};

export type QueryNftStakingProjectsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  showStaked?: InputMaybe<StakedEnum>;
};

export type QueryStakingArgs = {
  collection_id: Scalars["ID"];
};

export enum StakedEnum {
  No = "No",
  Yes = "Yes",
}

export type StakedNft = {
  __typename?: "StakedNFT";
  collection_id?: Maybe<Scalars["ID"]>;
  nft_id?: Maybe<Scalars["ID"]>;
  owner_id?: Maybe<Scalars["ID"]>;
  rewards_acova?: Maybe<Scalars["String"]>;
  rewards_jump?: Maybe<Scalars["String"]>;
  rewards_project_token?: Maybe<Scalars["String"]>;
  staked_timestamp?: Maybe<Scalars["String"]>;
};

export enum StatusEnum {
  Closed = "Closed",
  Open = "Open",
  Waiting = "Waiting",
}

export enum VisibilityEnum {
  Private = "Private",
  Public = "Public",
}

export type XTokenRatio = {
  __typename?: "XTokenRatio";
  base_token_amount?: Maybe<Scalars["String"]>;
  key_column?: Maybe<Scalars["String"]>;
  time_event?: Maybe<Scalars["String"]>;
  x_token_amount?: Maybe<Scalars["String"]>;
};

export type InvestorInfoQueryVariables = Exact<{
  accountId: Scalars["ID"];
}>;

export type InvestorInfoQuery = {
  __typename?: "Query";
  investor_info?: {
    __typename?: "LaunchpadInvestor";
    account_id: string;
    staked_token: string;
    last_check?: string | null;
    allocation_count?: string | null;
  } | null;
};

export type LaunchpadConenctionQueryVariables = Exact<{
  accountId: Scalars["ID"];
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  status?: InputMaybe<StatusEnum>;
  visibility?: InputMaybe<VisibilityEnum>;
  showMineOnly?: InputMaybe<Scalars["Boolean"]>;
}>;

export type LaunchpadConenctionQuery = {
  __typename?: "Query";
  launchpad_projects: {
    __typename?: "LaunchpadPage";
    pageSize?: number | null;
    totalCount?: number | null;
    itemsPerPage?: number | null;
    hasNextPage?: boolean | null;
    data?: Array<{
      __typename?: "LaunchpadListing";
      listing_id: string;
      public: boolean;
      project_owner: string;
      project_token: string;
      price_token?: string | null;
      open_sale_2_timestamp?: string | null;
      open_sale_1_timestamp?: string | null;
      final_sale_2_timestamp?: string | null;
      liquidity_pool_timestamp?: string | null;
      total_amount_sale_project_tokens?: string | null;
      token_allocation_size?: string | null;
      token_allocation_price?: string | null;
      liquidity_pool_project_tokens?: string | null;
      allocations_sold?: string | null;
      project_name?: string | null;
      status?: string | null;
      fee_liquidity_tokens?: string | null;
      fee_price_tokens?: string | null;
      end_cliff_timestamp?: string | null;
      cliff_timestamp?: string | null;
      fraction_cliff_release?: string | null;
      fraction_instant_release?: string | null;
      liquidity_pool_price_tokens?: string | null;
      dex_id?: string | null;
      project_allocations_sold?: string | null;
      project_total_amount_sale_project_tokens?: string | null;
      project_token_info?: {
        __typename?: "ProjectTokenInfo";
        name?: string | null;
        image?: string | null;
        symbol?: string | null;
        decimals?: string | null;
      } | null;
      price_token_info?: {
        __typename?: "ProjectTokenInfo";
        name?: string | null;
        image?: string | null;
        symbol?: string | null;
        decimals?: string | null;
      } | null;
      allocation?: {
        __typename?: "InvestorAllocation";
        total_quantity?: string | null;
        total_allocation?: string | null;
      } | null;
    } | null> | null;
  };
};

export type LaunchPadProjectQueryVariables = Exact<{
  projectId: Scalars["ID"];
  accountId: Scalars["ID"];
}>;

export type LaunchPadProjectQuery = {
  __typename?: "Query";
  launchpad_project?: {
    __typename?: "LaunchpadListing";
    listing_id: string;
    public: boolean;
    project_owner: string;
    project_token: string;
    price_token?: string | null;
    open_sale_1_timestamp?: string | null;
    open_sale_2_timestamp?: string | null;
    final_sale_2_timestamp?: string | null;
    liquidity_pool_timestamp?: string | null;
    total_amount_sale_project_tokens?: string | null;
    token_allocation_size?: string | null;
    token_allocation_price?: string | null;
    allocations_sold?: string | null;
    liquidity_pool_project_tokens?: string | null;
    liquidity_pool_price_tokens?: string | null;
    fraction_instant_release?: string | null;
    fraction_cliff_release?: string | null;
    cliff_timestamp?: string | null;
    end_cliff_timestamp?: string | null;
    fee_price_tokens?: string | null;
    fee_liquidity_tokens?: string | null;
    status?: string | null;
    project_name?: string | null;
    description_token?: string | null;
    description_project?: string | null;
    discord?: string | null;
    twitter?: string | null;
    telegram?: string | null;
    website?: string | null;
    whitepaper?: string | null;
    dex_id?: string | null;
    project_allocations_sold?: string | null;
    project_total_amount_sale_project_tokens?: string | null;
    project_token_info?: {
      __typename?: "ProjectTokenInfo";
      name?: string | null;
      image?: string | null;
      symbol?: string | null;
      decimals?: string | null;
    } | null;
    price_token_info?: {
      __typename?: "ProjectTokenInfo";
      name?: string | null;
      image?: string | null;
      symbol?: string | null;
      decimals?: string | null;
    } | null;
    allocation?: {
      __typename?: "InvestorAllocation";
      account_id: string;
      listing_id: string;
      quantity_withdrawn?: string | null;
      total_quantity?: string | null;
      total_allocation?: string | null;
    } | null;
  } | null;
};

export type NftStakingProjectsConnectionQueryVariables = Exact<{
  search?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  showStaked?: InputMaybe<StakedEnum>;
}>;

export type NftStakingProjectsConnectionQuery = {
  __typename?: "Query";
  nft_staking_projects: {
    __typename?: "NFTPage";
    pageSize?: number | null;
    totalCount?: number | null;
    itemsPerPage?: number | null;
    hasNextPage?: boolean | null;
    data?: Array<{
      __typename?: "NFTStaking";
      collection_id: string;
      collection_image?: string | null;
      collection_modal_image?: string | null;
      collection_owner_id: string;
      token_address: string;
      collection_meta?: {
        __typename?: "CollectionMeta";
        image?: string | null;
        name?: string | null;
      } | null;
      rewards?: Array<{
        __typename?: "NFTStakingReward";
        spec?: string | null;
        name?: string | null;
        symbol?: string | null;
        icon?: string | null;
        decimals?: number | null;
        perMonth?: string | null;
        account_id?: string | null;
      } | null> | null;
    } | null> | null;
  };
};

export type StakingProjectQueryVariables = Exact<{
  collection: Scalars["ID"];
}>;

export type StakingProjectQuery = {
  __typename?: "Query";
  staking?: {
    __typename?: "NFTStaking";
    collection_id: string;
    collection_owner_id: string;
    collection_image?: string | null;
    collection_modal_image?: string | null;
    token_address: string;
    min_staking_period?: string | null;
    early_withdraw_penalty?: string | null;
    collection_meta?: {
      __typename?: "CollectionMeta";
      image?: string | null;
      name?: string | null;
    } | null;
    rewards?: Array<{
      __typename?: "NFTStakingReward";
      spec?: string | null;
      name?: string | null;
      symbol?: string | null;
      icon?: string | null;
      decimals?: number | null;
      perMonth?: string | null;
      account_id?: string | null;
    } | null> | null;
  } | null;
};

export type XJumpProjectQueryVariables = Exact<{
  timestamp?: InputMaybe<Scalars["String"]>;
}>;

export type XJumpProjectQuery = {
  __typename?: "Query";
  get_historical_ratio?: Array<{
    __typename?: "XTokenRatio";
    key_column?: string | null;
    time_event?: string | null;
    base_token_amount?: string | null;
    x_token_amount?: string | null;
  } | null> | null;
};

export const InvestorInfoDocument = gql`
  query InvestorInfo($accountId: ID!) {
    investor_info(account_id: $accountId) {
      account_id
      staked_token
      last_check
      allocation_count
    }
  }
`;

/**
 * __useInvestorInfoQuery__
 *
 * To run a query within a React component, call `useInvestorInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useInvestorInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useInvestorInfoQuery({
 *   variables: {
 *      accountId: // value for 'accountId'
 *   },
 * });
 */
export function useInvestorInfoQuery(
  baseOptions: Apollo.QueryHookOptions<
    InvestorInfoQuery,
    InvestorInfoQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<InvestorInfoQuery, InvestorInfoQueryVariables>(
    InvestorInfoDocument,
    options
  );
}
export function useInvestorInfoLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    InvestorInfoQuery,
    InvestorInfoQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<InvestorInfoQuery, InvestorInfoQueryVariables>(
    InvestorInfoDocument,
    options
  );
}
export type InvestorInfoQueryHookResult = ReturnType<
  typeof useInvestorInfoQuery
>;
export type InvestorInfoLazyQueryHookResult = ReturnType<
  typeof useInvestorInfoLazyQuery
>;
export type InvestorInfoQueryResult = Apollo.QueryResult<
  InvestorInfoQuery,
  InvestorInfoQueryVariables
>;
export const LaunchpadConenctionDocument = gql`
  query LaunchpadConenction(
    $accountId: ID!
    $limit: Int
    $offset: Int
    $search: String
    $status: StatusEnum
    $visibility: VisibilityEnum
    $showMineOnly: Boolean
  ) {
    launchpad_projects(
      limit: $limit
      offset: $offset
      search: $search
      status: $status
      visibility: $visibility
      showMineOnly: $showMineOnly
    ) {
      pageSize
      totalCount
      itemsPerPage
      hasNextPage
      data {
        listing_id
        public
        project_owner
        project_token
        price_token
        open_sale_2_timestamp
        open_sale_1_timestamp
        final_sale_2_timestamp
        liquidity_pool_timestamp
        total_amount_sale_project_tokens
        token_allocation_size
        token_allocation_price
        liquidity_pool_project_tokens
        allocations_sold
        project_name
        project_token_info {
          name
          image
          symbol
          decimals
        }
        price_token_info {
          name
          image
          symbol
          decimals
        }
        status
        fee_liquidity_tokens
        fee_price_tokens
        end_cliff_timestamp
        cliff_timestamp
        fraction_cliff_release
        fraction_instant_release
        liquidity_pool_price_tokens
        dex_id
        allocation(account_id: $accountId) {
          total_quantity
          total_allocation
        }
        project_allocations_sold
        project_total_amount_sale_project_tokens
      }
    }
  }
`;

/**
 * __useLaunchpadConenctionQuery__
 *
 * To run a query within a React component, call `useLaunchpadConenctionQuery` and pass it any options that fit your needs.
 * When your component renders, `useLaunchpadConenctionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLaunchpadConenctionQuery({
 *   variables: {
 *      accountId: // value for 'accountId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      search: // value for 'search'
 *      status: // value for 'status'
 *      visibility: // value for 'visibility'
 *      showMineOnly: // value for 'showMineOnly'
 *   },
 * });
 */
export function useLaunchpadConenctionQuery(
  baseOptions: Apollo.QueryHookOptions<
    LaunchpadConenctionQuery,
    LaunchpadConenctionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    LaunchpadConenctionQuery,
    LaunchpadConenctionQueryVariables
  >(LaunchpadConenctionDocument, options);
}
export function useLaunchpadConenctionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    LaunchpadConenctionQuery,
    LaunchpadConenctionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    LaunchpadConenctionQuery,
    LaunchpadConenctionQueryVariables
  >(LaunchpadConenctionDocument, options);
}
export type LaunchpadConenctionQueryHookResult = ReturnType<
  typeof useLaunchpadConenctionQuery
>;
export type LaunchpadConenctionLazyQueryHookResult = ReturnType<
  typeof useLaunchpadConenctionLazyQuery
>;
export type LaunchpadConenctionQueryResult = Apollo.QueryResult<
  LaunchpadConenctionQuery,
  LaunchpadConenctionQueryVariables
>;
export const LaunchPadProjectDocument = gql`
  query LaunchPadProject($projectId: ID!, $accountId: ID!) {
    launchpad_project(project_id: $projectId) {
      listing_id
      public
      project_owner
      project_token
      price_token
      open_sale_1_timestamp
      open_sale_2_timestamp
      final_sale_2_timestamp
      liquidity_pool_timestamp
      total_amount_sale_project_tokens
      token_allocation_size
      token_allocation_price
      allocations_sold
      liquidity_pool_project_tokens
      liquidity_pool_price_tokens
      fraction_instant_release
      fraction_cliff_release
      cliff_timestamp
      end_cliff_timestamp
      fee_price_tokens
      fee_liquidity_tokens
      status
      project_name
      description_token
      description_project
      discord
      twitter
      telegram
      website
      whitepaper
      project_token_info {
        name
        image
        symbol
        decimals
      }
      dex_id
      price_token_info {
        name
        image
        symbol
        decimals
      }
      allocation(account_id: $accountId) {
        account_id
        listing_id
        quantity_withdrawn
        total_quantity
        total_allocation
      }
      project_allocations_sold
      project_total_amount_sale_project_tokens
    }
  }
`;

/**
 * __useLaunchPadProjectQuery__
 *
 * To run a query within a React component, call `useLaunchPadProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useLaunchPadProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLaunchPadProjectQuery({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      accountId: // value for 'accountId'
 *   },
 * });
 */
export function useLaunchPadProjectQuery(
  baseOptions: Apollo.QueryHookOptions<
    LaunchPadProjectQuery,
    LaunchPadProjectQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<LaunchPadProjectQuery, LaunchPadProjectQueryVariables>(
    LaunchPadProjectDocument,
    options
  );
}
export function useLaunchPadProjectLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    LaunchPadProjectQuery,
    LaunchPadProjectQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    LaunchPadProjectQuery,
    LaunchPadProjectQueryVariables
  >(LaunchPadProjectDocument, options);
}
export type LaunchPadProjectQueryHookResult = ReturnType<
  typeof useLaunchPadProjectQuery
>;
export type LaunchPadProjectLazyQueryHookResult = ReturnType<
  typeof useLaunchPadProjectLazyQuery
>;
export type LaunchPadProjectQueryResult = Apollo.QueryResult<
  LaunchPadProjectQuery,
  LaunchPadProjectQueryVariables
>;
export const NftStakingProjectsConnectionDocument = gql`
  query NFTStakingProjectsConnection(
    $search: String
    $limit: Int
    $offset: Int
    $showStaked: StakedEnum
  ) {
    nft_staking_projects(
      search: $search
      limit: $limit
      offset: $offset
      showStaked: $showStaked
    ) {
      pageSize
      totalCount
      itemsPerPage
      hasNextPage
      data {
        collection_id
        collection_meta {
          image
          name
        }
        collection_image
        collection_modal_image
        collection_owner_id
        active
        token_address
        rewards {
          spec
          name
          symbol
          icon
          decimals
          perMonth
          account_id
        }
      }
    }
  }
`;

/**
 * __useNftStakingProjectsConnectionQuery__
 *
 * To run a query within a React component, call `useNftStakingProjectsConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useNftStakingProjectsConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNftStakingProjectsConnectionQuery({
 *   variables: {
 *      search: // value for 'search'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      showStaked: // value for 'showStaked'
 *   },
 * });
 */
export function useNftStakingProjectsConnectionQuery(
  baseOptions?: Apollo.QueryHookOptions<
    NftStakingProjectsConnectionQuery,
    NftStakingProjectsConnectionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    NftStakingProjectsConnectionQuery,
    NftStakingProjectsConnectionQueryVariables
  >(NftStakingProjectsConnectionDocument, options);
}
export function useNftStakingProjectsConnectionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NftStakingProjectsConnectionQuery,
    NftStakingProjectsConnectionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    NftStakingProjectsConnectionQuery,
    NftStakingProjectsConnectionQueryVariables
  >(NftStakingProjectsConnectionDocument, options);
}
export type NftStakingProjectsConnectionQueryHookResult = ReturnType<
  typeof useNftStakingProjectsConnectionQuery
>;
export type NftStakingProjectsConnectionLazyQueryHookResult = ReturnType<
  typeof useNftStakingProjectsConnectionLazyQuery
>;
export type NftStakingProjectsConnectionQueryResult = Apollo.QueryResult<
  NftStakingProjectsConnectionQuery,
  NftStakingProjectsConnectionQueryVariables
>;
export const StakingProjectDocument = gql`
  query StakingProject($collection: ID!) {
    staking(collection_id: $collection) {
      collection_id
      collection_meta {
        image
        name
      }
      collection_owner_id
      collection_image
      collection_modal_image
      token_address
      active
      rewards {
        spec
        name
        symbol
        icon
        decimals
        perMonth
        account_id
      }
      min_staking_period
      early_withdraw_penalty
    }
  }
`;

/** rewards {
        spec
        name
        symbol
        icon
        decimals
        perMonth
        account_id
      }
 * __useStakingProjectQuery__
 *
 * To run a query within a React component, call `useStakingProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useStakingProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStakingProjectQuery({
 *   variables: {
 *      collection: // value for 'collection'
 *   },
 * });
 */
export function useStakingProjectQuery(
  baseOptions: Apollo.QueryHookOptions<
    StakingProjectQuery,
    StakingProjectQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<StakingProjectQuery, StakingProjectQueryVariables>(
    StakingProjectDocument,
    options
  );
}
export function useStakingProjectLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    StakingProjectQuery,
    StakingProjectQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<StakingProjectQuery, StakingProjectQueryVariables>(
    StakingProjectDocument,
    options
  );
}
export type StakingProjectQueryHookResult = ReturnType<
  typeof useStakingProjectQuery
>;
export type StakingProjectLazyQueryHookResult = ReturnType<
  typeof useStakingProjectLazyQuery
>;
export type StakingProjectQueryResult = Apollo.QueryResult<
  StakingProjectQuery,
  StakingProjectQueryVariables
>;
export const XJumpProjectDocument = gql`
  query XJumpProject($timestamp: String) {
    get_historical_ratio(timestamp: $timestamp) {
      key_column
      time_event
      base_token_amount
      x_token_amount
    }
  }
`;

/**
 * __useXJumpProjectQuery__
 *
 * To run a query within a React component, call `useXJumpProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useXJumpProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useXJumpProjectQuery({
 *   variables: {
 *      timestamp: // value for 'timestamp'
 *   },
 * });
 */
export function useXJumpProjectQuery(
  baseOptions?: Apollo.QueryHookOptions<
    XJumpProjectQuery,
    XJumpProjectQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<XJumpProjectQuery, XJumpProjectQueryVariables>(
    XJumpProjectDocument,
    options
  );
}
export function useXJumpProjectLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    XJumpProjectQuery,
    XJumpProjectQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<XJumpProjectQuery, XJumpProjectQueryVariables>(
    XJumpProjectDocument,
    options
  );
}
export type XJumpProjectQueryHookResult = ReturnType<
  typeof useXJumpProjectQuery
>;
export type XJumpProjectLazyQueryHookResult = ReturnType<
  typeof useXJumpProjectLazyQuery
>;
export type XJumpProjectQueryResult = Apollo.QueryResult<
  XJumpProjectQuery,
  XJumpProjectQueryVariables
>;
