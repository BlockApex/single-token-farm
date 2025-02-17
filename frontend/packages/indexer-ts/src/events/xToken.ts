import { Sequelize, Transaction } from "sequelize/types";
import {
  NearEvent,
  PROFIT_DEPOSIT,
  ProfitDepositData,
  EventId,
} from "../types";
import { xTokenRatio } from "../models";
import { unixTsToDate } from "../types";
import { processEventId } from ".";

export async function handleXTokenEvent(
  event: NearEvent,
  eventId: EventId,
  sequelize: Sequelize
): Promise<boolean> {
  switch (event.event) {
    case PROFIT_DEPOSIT: {
      let data: ProfitDepositData = event.data[0];

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;

      try {
        await xTokenRatio.create(
          {
            time_event: unixTsToDate(data.timestamp),
            base_token_amount: data.base_token_treasury_after_deposit,
            x_token_amount: data.x_token_supply_after_deposit,
          },
          { transaction }
        );

        await transaction.commit();
      } catch {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    default:
      return true;
  }
}
