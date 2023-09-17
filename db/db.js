require("dotenv").config();
require("colors");
const { Pool } = require("pg");
BYCRYPT_WORK_FACTOR = 10;

function getDatabaseUrl() {
  const dbUser = process.env.DATABASE_USER || "postgres";
  const dbPassword = process.env.DATABASE_PASS
    ? encodeURI(process.env.DATABASE_PASS)
    : "postgres";
  const dbHost = process.env.DATABASE_HOST || "localhost";
  const dbPort = process.env.DATABASE_PORT
    ? Number(process.env.DATABASE_PORT)
    : 5432;
  const dbName = process.env.DATABASE_NAME || "tama_database";

  let dbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

  return {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  };
}

console.log("DATABASE_URL: ".yellow, getDatabaseUrl());

const pool = new Pool({
  //   connectionString: getDatabaseUrl().connectionString,
  //   ssl: getDatabaseUrl().ssl,
  //   idleTimeoutMillis: 60000,
  //   connectionTimeoutMillis: 60000, // wait 1 minute for connection
  //   debug: true,
  connectionString: getDatabaseUrl().connectionString,
});

module.exports = {
  BYCRYPT_WORK_FACTOR,
  getDatabaseUrl,
  pool,
  query: (text, params) => pool.query(text, params),
};
