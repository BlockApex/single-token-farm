import { Sequelize } from "sequelize";
import { initializeLaunchpad } from "./launchpad";
import { initializeNftStaking } from "./nftStaking";
import { initializeXToken } from "./xToken";
import { initializeInternalTables } from "./internal";

export {
  LaunchpadInvestor,
  Listing,
  ListingMetadata,
  Allocation,
} from "./launchpad";

export {
  StakingProgram,
  StakingProgramMetadata,
  StakedNft,
} from "./nftStaking";

export { xTokenRatio } from "./xToken";

export { ProcessedEvent } from "./internal";

export function initializeModels(sequelize: Sequelize) {
  initializeLaunchpad(sequelize);
  initializeNftStaking(sequelize);
  initializeXToken(sequelize);
  initializeInternalTables(sequelize);
}
