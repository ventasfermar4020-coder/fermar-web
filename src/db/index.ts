import { env } from "@/src/env";
import * as schema from "./schema";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let database: PostgresJsDatabase<typeof schema>;
let pg: ReturnType<typeof postgres>;

if (env.NODE_ENV === "production") {
  pg = postgres(env.DATABASE_URL);
  database = drizzle(pg, { schema });
} else {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(global as any).database!) {
    pg = postgres(env.DATABASE_URL);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).database = drizzle(pg, { schema });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  database = (global as any).database;
}

export { database, pg };
