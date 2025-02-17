import { TimestampQuery, GraphQLContext } from "@/types";
import { QueryTypes } from "sequelize";
import { XTokenRatio } from "./resolver.types";

export default {
  Query: {
    async get_historical_ratio(
      _root: unknown,
      filters: TimestampQuery,
      { sequelize }: GraphQLContext
    ) {
      const result = await sequelize.query<XTokenRatio>(
        `SELECT * FROM "x_token_ratios" t 
        JOIN (select min(t2.time_event) as min_timestamp
         from "x_token_ratios" t2
         group by date(t2.time_event)
        ) t2 on t.time_event = t2.min_timestamp
        WHERE time_event <= $1
        ORDER BY time_event DESC
        LIMIT 360`,
        {
          bind: [
            new Date(parseInt(filters.timestamp))
              .toISOString()
              .replace("T", " ")
              .replace("Z", ""),
          ],
          type: QueryTypes.SELECT,
        }
      );

      return result || null;
    },
  },
};
