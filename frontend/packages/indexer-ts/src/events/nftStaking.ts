import { Sequelize } from "sequelize/types";
import {
  NearEvent,
  EventId,
  CREATE_STAKING_PRGRAM,
  CreateStakingProgramData,
  UPDATE_STAKING_PROGRAM,
  UpdateStakingProgramData,
  STAKE_NFT,
  StakeNftData,
  UNSTAKE_NFT,
  UnstakeNftData,
} from "../types";
import { StakingProgram, StakedNft } from "../models";
import { unixTsToDate, sleep } from "../types";
import { processEventId } from ".";

export async function handleNftStakingEvent(
  event: NearEvent,
  eventId: EventId,
  sequelize: Sequelize
): Promise<boolean> {
  switch (event.event) {
    case CREATE_STAKING_PRGRAM: {
      let data: CreateStakingProgramData = event.data[0];

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;
      try {
        await StakingProgram.create(
          {
            collection_id: data.collection_address,
            collection_owner_id: data.collection_owner,
            token_address: data.token_address,
            min_staking_period: data.min_staking_period,
            early_withdraw_penalty: data.early_withdraw_penalty,
            round_interval: data.round_interval,
          },
          { transaction }
        );

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    case UPDATE_STAKING_PROGRAM: {
      let data: UpdateStakingProgramData = event.data[0];

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;
      try {
        let entry: StakingProgram = (await StakingProgram.findByPk(
          data.collection_address
        ))!;

        if (data.early_withdraw_penalty)
          entry.early_withdraw_penalty = data.early_withdraw_penalty;
        if (data.min_staking_period)
          entry.min_staking_period = data.min_staking_period;

        entry.save({ transaction });

        await transaction.commit();
      } catch {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    case STAKE_NFT: {
      let data: StakeNftData = event.data[0];

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;
      try {
        await StakedNft.create(
          {
            nft_id: data.token_id[1],
            collection_id: data.token_id[0].account_id,
            owner_id: data.owner_id,
            staked_timestamp: unixTsToDate(data.staked_timestamp),
          },
          { transaction }
        );

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    case UNSTAKE_NFT: {
      let data: UnstakeNftData = event.data[0];

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;
      try {
        const entry: StakedNft = (await StakedNft.findOne({
          where: {
            nft_id: data.token_id[1],
            collection_id: data.token_id[0].account_id,
          },
        }))!;

        await entry.destroy({ transaction });

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    default:
      return true;
  }
}
