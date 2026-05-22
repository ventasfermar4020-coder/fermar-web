import "dotenv/config";
import { database } from "../src/db/index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding listingPrice and salePrice columns to ec_products...");
  await database.execute(sql`
    ALTER TABLE ec_products
    ADD COLUMN IF NOT EXISTS "listingPrice" numeric(10,2),
    ADD COLUMN IF NOT EXISTS "salePrice" numeric(10,2)
  `);
  console.log("✅ Columns added successfully.");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
