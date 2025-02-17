const { Client } = require("pg");
const fs = require("fs");

restartDb();

async function restartDb() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
  });

  await client.connect();

  const dropQuery = "DROP SCHEMA public CASCADE";
  try {
    await client.query(dropQuery);
  } catch (err) {
    if (!err.toString().includes(`error: schema "public" does not exist`))
      throw err;
  }
  console.log("Previous DB succesfully droped");

  const createSchemaQuery = "CREATE SCHEMA public";
  await client.query(createSchemaQuery);
  console.log("Schema base succesfully created");

  const createTablesQuery = fs
    .readFileSync("packages/db/sql/schema.sql")
    .toString();
  await client.query(createTablesQuery);
  console.log("Schema succesfully created");

  process.exit(0);
}
