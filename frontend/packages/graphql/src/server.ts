import { EnvVariables } from "@/env";
import { ApolloServer } from "apollo-server";
import { Sequelize } from "sequelize";
import { Global, Launchpad, NFTStaking, XToken } from "@/modules";

const {
  db_host,
  db_name,
  db_port,
  db_dialect,
  db_password,
  db_username,
  server_port,
} = EnvVariables;

const sequelize = new Sequelize({
  port: db_port,
  // host: db_host,
  host: db_host,
  database: db_name,
  dialect: db_dialect,
  username: db_username,
  password: db_password,
} as any);

const app = new ApolloServer({
  resolvers: [
    Global.Resolvers,
    Launchpad.Resolvers,
    NFTStaking.Resolvers,
    XToken.Resolvers,
  ],
  typeDefs: [Global.Types, Launchpad.Types, NFTStaking.Types, XToken.Types],
  introspection: true,
  context: (context) => {
    // TODO: Add Auth Layer
    return {
      expressContext: context,
      sequelize,
    };
  },
});

async function main(): Promise<void> {
  try {
    console.log(
      "Running the GraphQL Server with the following ENV for NEAR = " +
        process.env.ENV
    );
    console.log("Checking Database Connection ☢️");
    await sequelize.authenticate();
    console.log("Database Authenticated ✅");
    const serverInfo = await app.listen(server_port);
    console.log(
      `GraphQL running on ${serverInfo.port} at the current url ${serverInfo.url} ✅`
    );
  } catch (error) {
    console.error("The Server Crashed check here the logs", error);
  }
}

main();
