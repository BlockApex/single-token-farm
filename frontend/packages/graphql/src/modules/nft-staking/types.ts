import { gql } from "apollo-server";

export default gql`
  # Blockchain Data
  type CollectionMeta {
    image: String
    name: String
  }

  type NFTStaking {
    # SQL + Blockchain Data
    collection_id: ID!
    collection_meta: CollectionMeta # On Chain Data
    collection_owner_id: String!
    token_address: ID!
    min_staking_period: String
    early_withdraw_penalty: String
    round_interval: String
    collection_image: String
    collection_modal_image: String
    active: Boolean!

    # Queries
    rewards(account_id: ID): [NFTStakingReward] # On Chain Data
  }

  type NFTStakingReward @cacheControl(maxAge: 120, scope: PUBLIC) {
    spec: String
    name: String
    symbol: String
    icon: String
    decimals: Int
    perMonth: String
    account_id: String
  }

  enum StakedEnum {
    Yes
    No
  }

  type StakedNFT {
    # SQL + Blockchain Data
    nft_id: ID
    collection_id: ID
    owner_id: ID
    staked_timestamp: String
    rewards_jump: String
    rewards_acova: String
    rewards_project_token: String
  }

  type NFTPage {
    pageSize: Int
    totalCount: Int
    itemsPerPage: Int
    hasNextPage: Boolean
    data: [NFTStaking]
  }

  type Query {
    nft_staking_projects(
      limit: Int
      offset: Int
      search: String
      showStaked: StakedEnum
    ): NFTPage!
    staking(collection_id: ID!): NFTStaking
  }
`;
