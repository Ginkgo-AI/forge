import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString =
  process.env.DATABASE_URL || "postgresql://forge:forge@localhost:5435/forge";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export * from "./schema/index.js";
export type Database = typeof db;
