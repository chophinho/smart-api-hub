import knex from "knex";

export const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "host.docker.internal",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "postgres",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "123456",
  },
});
