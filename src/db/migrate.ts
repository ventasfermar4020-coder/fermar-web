import "dotenv/config";

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { database, pg } from "./index";

async function main() {
  console.log("🚀 Running migrations...");
  await migrate(database, { migrationsFolder: "drizzle" });
  console.log("✅ Migrations completed successfully!");
  await pg.end();
}

main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
