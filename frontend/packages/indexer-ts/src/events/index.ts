import { Transaction } from "sequelize";
import { Sequelize } from "sequelize/types";
import {
  LAUNCHPAD_CONTRACT,
  NFT_STAKING_CONTRACT,
  XTOKEN_CONTRACT,
} from "../env";
import { EventId, NearEvent, sleep } from "../types";
import { handleLaunchpadEvent } from "./launchpad";
import { handleNftStakingEvent } from "./nftStaking";
import { handleXTokenEvent } from "./xToken";
import { ProcessedEvent } from "../models";

// Maximum number of retries
const MAX_COUNT = 3;
// Timeout between each transaction retry, in ms
const RETRY_TIMEOUT = 2000;

export async function processEvent(
  executorId: string,
  eventJsonString: string,
  eventId: EventId,
  sequelize: Sequelize
): Promise<void> {
  let counter = 0;

  // Process event
  const event: NearEvent = JSON.parse(eventJsonString);
  retryLoop: while (true) {
    executorSwitch: switch (executorId) {
      case LAUNCHPAD_CONTRACT: {
        if (await handleLaunchpadEvent(event, eventId, sequelize))
          break retryLoop;
        break executorSwitch;
      }
      case NFT_STAKING_CONTRACT: {
        if (await handleNftStakingEvent(event, eventId, sequelize))
          break retryLoop;
        break executorSwitch;
      }
      case XTOKEN_CONTRACT: {
        if (await handleXTokenEvent(event, eventId, sequelize)) break retryLoop;
        break executorSwitch;
      }
    }

    counter += 1;
    if (await counterHandler(counter)) break retryLoop;
  }
}

/* Method to insert evetnIds into table
 * must be called on every event write to DB
 */
export async function processEventId(
  eventId: EventId,
  transaction: Transaction
): Promise<boolean> {
  try {
    await ProcessedEvent.create(
      {
        block_height: eventId.blockHeight,
        transaction_hash: eventId.transactionHash,
        event_index: eventId.eventIndex,
      },
      { transaction }
    );
    return true;
  } catch (err) {
    await transaction.rollback();
    return false;
  }
}

/* Method to handle retry counts and backoffs
 */
async function counterHandler(counter: number): Promise<boolean> {
  // If max retries are exceeded, stop processing the transaction
  if (counter >= MAX_COUNT) return true;

  // If it is a retry, sleep for retry timeout
  if (counter > 0) await sleep(RETRY_TIMEOUT, counter);

  return false;
}
