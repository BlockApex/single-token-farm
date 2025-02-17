import {
  Allocation,
  LaunchpadFilters,
  LaunchpadListing,
  NFTInvestor,
  PaginatedLaunchpadFilters,
} from "./resolver.types";
import { AccountIdQuery, GraphQLContext, ProjectIdQuery } from "@/types";
import { findTokenMetadata, findProjectInfo } from "@/utils";
import { QueryTypes } from "sequelize";
import { ImportantStatusFilters, queriesPerStatus } from "@/constants/statuses";
import { VisibilityEnum } from "@near/apollo";
import { createPageableQuery } from "@/utils/createPaginatedConnection";

export default {
  LaunchpadListing: {
    async project_token_info({ project_token }: LaunchpadListing) {
      const { name, icon, symbol, decimals } = await findTokenMetadata(
        project_token
      );
      return {
        name,
        image: icon,
        symbol,
        decimals,
      };
    },
    async price_token_info({ price_token }: LaunchpadListing) {
      const { name, icon, symbol, decimals } = await findTokenMetadata(
        price_token
      );
      return {
        name,
        image: icon,
        symbol,
        decimals,
      };
    },
    async project_allocations_sold({ listing_id }: LaunchpadListing) {
      const { allocations_sold } = await findProjectInfo(listing_id);

      return allocations_sold;
    },
    async project_total_amount_sale_project_tokens({
      listing_id,
    }: LaunchpadListing) {
      const { total_amount_sale_project_tokens } = await findProjectInfo(
        listing_id
      );

      console.log(
        "project_total_amount_sale_project_tokens",
        total_amount_sale_project_tokens
      );

      return total_amount_sale_project_tokens;
    },
    async allocation(
      { listing_id }: LaunchpadListing,
      { account_id }: AccountIdQuery,
      { sequelize }: GraphQLContext
    ) {
      const result = await sequelize.query<Allocation>(
        'select * from "allocations" where "account_id" = $1 and "listing_id" = $2',
        {
          bind: [account_id, listing_id],
          type: QueryTypes.SELECT,
        }
      );

      return result[0] || null;
    },
  },
  Query: {
    async investor_info(
      _root: unknown,
      { account_id }: AccountIdQuery,
      { sequelize }: GraphQLContext
    ) {
      const result = await sequelize.query<NFTInvestor>(
        'select * from "launchpad_investors" where "account_id" = $1',
        {
          bind: [account_id],
          type: QueryTypes.SELECT,
        }
      );

      return result[0] || null;
    },

    async launchpad_project(
      _root: unknown,
      filters: ProjectIdQuery,
      { sequelize }: GraphQLContext
    ) {
      const result = await sequelize.query<NFTInvestor>(
        `SELECT * 
          FROM (SELECT * FROM "listings" WHERE listing_id = $1) AS l
          INNER JOIN "listings_metadata" m
            ON(l.listing_id = m.listing_id)`,
        {
          bind: [filters.project_id],
          type: QueryTypes.SELECT,
        }
      );

      return result[0] || null;
    },

    async launchpad_projects(
      _root: unknown,
      filters: Partial<PaginatedLaunchpadFilters>,
      { sequelize }: GraphQLContext
    ) {
      type BindParameterClause = (offset: number) => string;
      type QueryClause = string | BindParameterClause;
      type FiltersMap<K extends string> = {
        [key in K]: {
          active: boolean;
          joinClause?: QueryClause;
          whereClause?: QueryClause;
          params?: any[];
        };
      };

      const evalQueryClause = (clause: QueryClause, offset: number) =>
        typeof clause == "string" ? clause : clause(offset);

      const filtersMap: FiltersMap<keyof LaunchpadFilters> = {
        status: {
          active: !!(
            filters.status && ImportantStatusFilters.includes(filters.status)
          ),
          whereClause: filters.status ? queriesPerStatus[filters.status] : "",
        },
        showMineOnly: {
          active: !!filters.showMineOnly,
          joinClause:
            'INNER JOIN "allocations" AS a ON(l.listing_id = a.listing_id)',
        },
        visibility: {
          active: !!filters.visibility,
          whereClause:
            filters.visibility == VisibilityEnum.Public
              ? " l.public = true"
              : " l.public = false",
        },
        search: {
          active: !!filters.search,
          whereClause: (offset: number) =>
            `(m.project_name ILIKE $${1 + offset} || '%')`,
          params: [filters.search],
        },
      };

      const baseQuery =
        'SELECT * FROM "listings" AS l INNER JOIN "listings_metadata" AS m ON(l.listing_id = m.listing_id)';

      const joinClauseStatements: string[] = [];
      const whereClauseStatements: string[] = [];
      const params: any[] = [];
      for (const filter of Object.values(filtersMap)) {
        if (!filter.active) continue;

        if (filter.joinClause) {
          joinClauseStatements.push(
            evalQueryClause(filter.joinClause, params.length)
          );
        }

        if (filter.whereClause) {
          whereClauseStatements.push(
            evalQueryClause(filter.whereClause, params.length)
          );
        }

        if (filter.params?.length) {
          params.push(...filter.params);
        }
      }

      const joinClause = joinClauseStatements.length
        ? joinClauseStatements.join(" ")
        : "";
      const whereClause = whereClauseStatements.length
        ? `WHERE ${whereClauseStatements.join(" AND")}`
        : "";

      const finalQuery = [baseQuery, joinClause, whereClause]
        .filter((clause) => clause.length)
        .join(" ");

      return createPageableQuery(
        finalQuery,
        sequelize,
        {
          limit: filters.limit,
          offset: filters.offset,
        },
        params
      );
    },
  },
};
