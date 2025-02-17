import {
  Sequelize,
  ConnectionError,
  ConnectionTimedOutError,
  TimeoutError,
} from "sequelize";
import { initializeModels } from "./models";
import { sleep } from "./types";
import { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } from "./env";

export async function sequelizeConnect(): Promise<Sequelize> {
  await sleep(30000, 1);

  const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "postgres",
    retry: {
      match: [ConnectionError, ConnectionTimedOutError, TimeoutError],
      max: 5,
    },
  });

  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  initializeModels(sequelize);

  return sequelize;
}
