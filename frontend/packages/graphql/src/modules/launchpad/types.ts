import { gql } from "apollo-server";

export default gql`
  # Blockchain Contract Info
  type ProjectTokenInfo {
    image: String
    name: String
    symbol: String
    decimals: String
  }

  # SQL Table
  type LaunchpadInvestor {
    account_id: ID!
    staked_token: ID!
    last_check: String
    allocation_count: String
  }

  # SQL Table
  type InvestorAllocation {
    account_id: ID!
    listing_id: ID!
    quantity_withdrawn: String
    total_quantity: String
    total_allocation: String
  }

  # GraphQL + SQL + Blockchain Contract
  type LaunchpadListing {
    # SQL Fields
    listing_id: ID!
    public: Boolean!
    project_owner: ID!
    project_token: ID!
    price_token: String
    open_sale_1_timestamp: String
    open_sale_2_timestamp: String
    final_sale_2_timestamp: String
    liquidity_pool_timestamp: String
    total_amount_sale_project_tokens: String
    token_allocation_size: String
    token_allocation_price: String
    allocations_sold: String
    liquidity_pool_project_tokens: String
    liquidity_pool_price_tokens: String
    fraction_instant_release: String
    fraction_cliff_release: String
    cliff_timestamp: String
    end_cliff_timestamp: String
    fee_price_tokens: String
    fee_liquidity_tokens: String
    status: String
    dex_id: String
    project_name: String
    description_token: String
    description_project: String
    discord: String
    twitter: String
    telegram: String
    website: String
    whitepaper: String

    # Sub Queries
    project_token_info: ProjectTokenInfo
    price_token_info: ProjectTokenInfo
    project_allocations_sold: String
    project_total_amount_sale_project_tokens: String
    allocation(account_id: ID!): InvestorAllocation
  }

  enum StatusEnum {
    Open
    Closed
    Waiting
  }

  enum VisibilityEnum {
    Private
    Public
  }

  type LaunchpadPage {
    pageSize: Int
    totalCount: Int
    itemsPerPage: Int
    hasNextPage: Boolean
    data: [LaunchpadListing]
  }

  type Query {
    launchpad_projects(
      search: String
      status: StatusEnum
      visibility: VisibilityEnum
      showMineOnly: Boolean
      limit: Int
      offset: Int
    ): LaunchpadPage!
    investor_info(account_id: ID!): LaunchpadInvestor
    launchpad_project(project_id: ID!): LaunchpadListing
  }
`;
