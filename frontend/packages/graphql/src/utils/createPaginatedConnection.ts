import { PaginationError } from "@/errors/pagination";
import { QueryTypes, Sequelize } from "sequelize";

type Pageable = Record<string, unknown>;

type Page<P extends Pageable> = {
  pageSize: number;
  totalCount: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  data: P[];
};

export type PaginationFilters = {
  limit: number;
  offset: number;
};

/**
 * @name createPageableQuery
 * @description - This helpers creates for you a brand new paged
 * query from from the select that you are already making
 * @param query - This is the query string from SQL - NOTE: YOU SHOULD NOT PASS THE ENDING SIGN ';'
 * @param sequelize - This is the sequelize instance of the application to create the paginated query for you
 * @param filters - These are the pagination filters
 * @param parameters - Those are the sequelize parameters
 */
export async function createPageableQuery<
  P extends Pageable,
  Params extends unknown[] | Record<string, unknown>
>(
  query: string,
  sequelize: Sequelize,
  { limit = 30, offset }: Partial<PaginationFilters>,
  parameters?: Params
): Promise<Page<P>> {
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS query`;

  const options = { bind: parameters ?? [], type: QueryTypes.SELECT } as const;

  const [{ count = 0 }] = await sequelize
    .query<{ count: number }>(countQuery, options)
    .catch((err) => {
      console.error(err);
      throw err;
    });

  let pagedQuery = query;

  pagedQuery += ` LIMIT ${limit}`;
  if (offset) pagedQuery += ` OFFSET ${offset}`;

  const data = await sequelize.query<P>(pagedQuery, options).catch((err) => {
    console.error(err);
    throw err;
  });

  return {
    data,
    itemsPerPage: limit,
    pageSize: data.length || 0,
    totalCount: count,
    hasNextPage: count > data.length + (offset ?? 0),
  };
}
