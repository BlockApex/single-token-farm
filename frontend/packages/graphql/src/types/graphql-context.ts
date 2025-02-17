import type { ExpressContext } from "apollo-server-express";
import type { Sequelize } from "sequelize";

/** @description - GraphQL Context Argument */
export type GraphQLContext = {
  sequelize: Sequelize;
  context: ExpressContext;
};
