import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

// Create postgres connection
const client = postgres(env.databaseUrl);

// Create drizzle instance
export const db = drizzle(client, { schema });

export { schema };
