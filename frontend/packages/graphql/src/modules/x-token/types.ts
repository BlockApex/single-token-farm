import { gql } from "apollo-server";

export default gql`
  # Blockchain Data
  type XTokenRatio {
    key_column: String
    time_event: String
    base_token_amount: String
    x_token_amount: String
  }

  type Query {
    get_historical_ratio(timestamp: String): [XTokenRatio]
  }
`;
