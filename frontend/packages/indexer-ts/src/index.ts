import { startStream, types } from "near-lake-framework";
import { S3_BUCKET, START_BLOCK } from "./env";
import { sequelizeConnect } from "./connector";
import { processTransaction } from "./processor";
import { Sequelize } from "sequelize/types";
import { ProcessedEvent } from "./models";
import { readFileSync } from "fs";
import path from "path";

/* Amount of blocks to reparse after rebooting indexer
 * from shutdown
 */
const BLOCK_REDUNDANCY = 100;

/* Handles each indexed block
 * @param streamerMessage Block of indexed data and sends all non failed transactions
 *        to processing
 * @dev  must handle all logic for treating the indexed data
 */
function closureHandleStreamerMessage(sequelize: Sequelize) {
  return async function handleStreamerMessage(
    streamerMessage: types.StreamerMessage
  ): Promise<void> {
    const blockHeight = streamerMessage.block.header.height;
    if (blockHeight % 100 == 0) console.log(blockHeight);

    for (const shard of streamerMessage.shards) {
      for (const receipt of shard.receiptExecutionOutcomes) {
        const outcome = receipt.executionOutcome.outcome;
        const status: any = outcome.status;
        if (status.Failure !== null && status.Unknown !== null) {
          await processTransaction(receipt, blockHeight, sequelize);
        }
      }
    }
  };
}

(async () => {
  const sequelize = await sequelizeConnect();

  // initialize DB if it is not
  await sequelize.query(
    readFileSync(path.resolve(__dirname, "../../db/sql/schema.sql")).toString()
  );

  // get highest block in DB
  const lastProcessedTransaction = (await ProcessedEvent.findOne({
    attributes: [
      [sequelize.fn("max", sequelize.col("block_height")), "block_height"],
    ],
    raw: true,
  }))!;

  const lastProcessedBlock = lastProcessedTransaction.block_height
    ? parseInt(lastProcessedTransaction.block_height) - BLOCK_REDUNDANCY
    : START_BLOCK;

  const lakeConfig: types.LakeConfig = {
    s3BucketName: S3_BUCKET,
    s3RegionName: "eu-central-1",
    startBlockHeight: lastProcessedBlock,
  };

  await startStream(lakeConfig, closureHandleStreamerMessage(sequelize));
})();
