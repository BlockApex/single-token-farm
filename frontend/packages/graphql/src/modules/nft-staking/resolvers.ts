import { CommonErrors } from "@/errors";
import { GraphQLContext } from "@/types";
import {
  NFTStaking,
  NFTStakingFilters,
  PaginatedNFTStakingFilters,
} from "./resolver.types";
import { StakingToken } from "@near/ts";
import { QueryTypes } from "sequelize";
import { StakedEnum } from "@near/apollo";
import {
  findCollectionMetadata,
  findStakingProgram,
  findTokenMetadata,
} from "@/utils";

import {
  createPageableQuery,
  PaginationFilters,
} from "@/utils/createPaginatedConnection";
import BN from "bn.js";
import Big from "big.js";

export default {
  NFTStaking: {
    async collection_meta({ collection_id }: NFTStaking) {
      const { name, icon } = await findCollectionMetadata(collection_id);
      return {
        name,
        image: icon,
      };
    },
    async rewards({ collection_id }: NFTStaking) {
      const { farm } = (await findStakingProgram(collection_id)) || {};

      const millisecondsPerMonth = 2592000000;

      const interval = farm.round_interval;
      const distributions = farm.distributions;

      const stakingRewards: StakingToken[] = [];

      for (const key in distributions) {
        const metadata = await findTokenMetadata(key);

        const { reward } = distributions[key];

        const rewardBN = new BN(new Big(reward).toFixed(0));
        const intervalBN = new BN(interval);
        const millisecondsPerMonthBN = new BN(millisecondsPerMonth);

        stakingRewards.push({
          ...metadata,
          account_id: key,
          perMonth: millisecondsPerMonthBN
            .mul(rewardBN)
            .div(intervalBN)
            .toString(),
        });
      }

      return stakingRewards.sort((a, b) => a.symbol.localeCompare(b.symbol));
    },
  },
  Query: {
    async staking(
      _root: unknown,
      { collection_id }: { collection_id: string },
      { sequelize }: GraphQLContext
    ) {
      const result = await sequelize.query<NFTStaking>(
        `SELECT * FROM "staking_programs" AS s INNER JOIN "staking_programs_metadata" AS m 
        ON (s.collection_id = m.collection_id) WHERE s.collection_id = $1 LIMIT 1`,
        {
          bind: [collection_id],
          type: QueryTypes.SELECT,
        }
      );

      if (!result[0]) throw new CommonErrors.NotFound();

      return result[0];
    },
    async nft_staking_projects(
      _root: unknown,
      filters: Partial<PaginatedNFTStakingFilters>,
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

      const filtersMap: FiltersMap<keyof NFTStakingFilters> = {
        search: {
          active: !!filters.search,
          whereClause: (offset: number) =>
            `(s.collection_id ILIKE $${1 + offset} || '%')`,
          params: [filters.search],
        },
        showStaked: {
          active: !!filters.showStaked,
          whereClause:
            filters.showStaked == "Yes"
              ? "exists (select 1 from staked_nfts as a where s.collection_id = a.collection_id)"
              : "not exists (select 1 from staked_nfts as a where s.collection_id = a.collection_id)",
        },
      };

      const baseQuery = `SELECT * FROM "staking_programs" AS s INNER JOIN "staking_programs_metadata" AS m ON (s.collection_id = m.collection_id)`;

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
