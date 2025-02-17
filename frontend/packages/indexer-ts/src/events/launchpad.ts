import Big from "big.js";
import { Sequelize } from "sequelize/types";
import {
  NearEvent,
  CREATE_LISTING,
  CreateListingData,
  CANCEL_LISTING,
  CancelListingData,
  PROJECT_FUND_LISTING,
  ProjectFundListingData,
  PROJECT_WITHDRAW_LISTING,
  ProjectWithdrawListingData,
  INVESTOR_BUY_ALLOCATIONS,
  InvestorBuyAllocationsData,
  INVESTOR_WITHDRAW_ALLOCATIONS,
  InvestorWithdrawAllocationsData,
  EventId,
} from "../types";
import { Listing, Allocation } from "../models";
import { unixTsToDate, sleep } from "../types";
import { processEventId } from ".";

export async function handleLaunchpadEvent(
  event: NearEvent,
  eventId: EventId,
  sequelize: Sequelize
): Promise<boolean> {
  switch (event.event) {
    case CREATE_LISTING: {
      let data: CreateListingData = event.data[0];
      let objectData = data.listing_data.V1;

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;

      try {
        await Listing.create(
          {
            listing_id: objectData.listing_id,
            public: objectData.listing_type == "Public",
            status: objectData.status.toLowerCase(),
            project_owner: objectData.project_owner,
            project_token: objectData.project_token.FT.account_id,
            price_token: objectData.price_token.FT.account_id,
            open_sale_1_timestamp: unixTsToDate(
              objectData.open_sale_1_timestamp
            ),
            open_sale_2_timestamp: unixTsToDate(
              objectData.open_sale_2_timestamp
            ),
            final_sale_2_timestamp: unixTsToDate(
              objectData.final_sale_2_timestamp
            ),
            liquidity_pool_timestamp: unixTsToDate(
              objectData.liquidity_pool_timestamp
            ),
            total_amount_sale_project_tokens:
              objectData.total_amount_sale_project_tokens,
            token_allocation_size: objectData.token_allocation_size,
            token_allocation_price: objectData.token_allocation_price,
            allocations_sold: objectData.allocations_sold,
            liquidity_pool_project_tokens:
              objectData.liquidity_pool_project_tokens,
            liquidity_pool_price_tokens: objectData.liquidity_pool_price_tokens,
            fraction_instant_release: objectData.fraction_instant_release,
            fraction_cliff_release: objectData.fraction_cliff_release,
            cliff_timestamp: unixTsToDate(objectData.cliff_timestamp),
            end_cliff_timestamp: unixTsToDate(objectData.end_cliff_timestamp),
            fee_price_tokens: objectData.fee_price_tokens,
            fee_liquidity_tokens: objectData.fee_liquidity_tokens,
            dex_id: objectData.dex_id,
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

    case CANCEL_LISTING: {
      let data: CancelListingData = event.data[0];
      let entryPk = data.listing_id;

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;

      try {
        let entry: Listing = (await Listing.findByPk(entryPk))!;
        entry.status = "cancelled";
        await entry.save({ transaction });

        await transaction.commit();
      } catch {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    case PROJECT_FUND_LISTING: {
      let data: ProjectFundListingData = event.data[0];
      let entryPk = data.listing_id;

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;

      try {
        let entry: Listing = (await Listing.findByPk(entryPk))!;
        entry.status = "funded";
        await entry.save({ transaction });

        await transaction.commit();
      } catch {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    case PROJECT_WITHDRAW_LISTING: {
      let data: ProjectWithdrawListingData = event.data[0];
      let entryPk = data.listing_id;

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;

      try {
        let entry: Listing = (await Listing.findByPk(entryPk))!;
        entry.status = data.project_status;
        await entry.save({ transaction });

        await transaction.commit();
      } catch {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    case INVESTOR_BUY_ALLOCATIONS: {
      let data: InvestorBuyAllocationsData = event.data[0];

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;

      try {
        let listing: Listing = (await Listing.findByPk(data.listing_id))!;
        let entry = await Allocation.findOne({
          where: {
            account_id: data.investor_id,
            listing_id: data.listing_id,
          },
        });

        if (entry === null) {
          await Allocation.create(
            {
              account_id: data.investor_id,
              listing_id: data.listing_id,
              total_allocation: data.allocations_purchased,
              total_quantity: data.tokens_purchased,
              quantity_withdrawn: "0",
            },
            { transaction }
          );
        } else {
          entry.set({
            total_allocation: new Big(entry.total_allocation)
              .plus(new Big(data.allocations_purchased))
              .toFixed(),
            total_quantity: new Big(entry.total_quantity)
              .plus(new Big(data.tokens_purchased))
              .toFixed(),
          });
          await entry.save({ transaction });
        }

        listing.set({
          status: data.project_status,
          allocations_sold: data.total_allocations_sold,
        });
        await listing.save({ transaction });

        await transaction.commit();
      } catch {
        await transaction.rollback();
        return false;
      }

      return true;
    }

    case INVESTOR_WITHDRAW_ALLOCATIONS: {
      let data: InvestorWithdrawAllocationsData = event.data[0];

      const transaction = await sequelize.transaction();

      if (!(await processEventId(eventId, transaction))) return true;

      try {
        const listing: Listing = (await Listing.findByPk(data.listing_id))!;

        const entry: Allocation = (await Allocation.findOne({
          where: {
            account_id: data.investor_id,
            listing_id: data.listing_id,
          },
        }))!;

        entry.quantity_withdrawn = new Big(entry.quantity_withdrawn)
          .plus(new Big(data.project_tokens_withdrawn))
          .toFixed();
        entry.save({ transaction });

        listing.status = data.project_status;
        listing.save({ transaction });

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
