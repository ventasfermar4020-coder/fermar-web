import postgres from "postgres";

// Read DATABASE_URL directly from process.env loaded by dotenv
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pg = postgres(DATABASE_URL);

async function main() {
  console.log("Checking/adding price columns to ec_products...");
  
  const existing = await pg`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'ec_products'
    ORDER BY column_name
  `;
  const colNames = existing.map((r) => r.column_name as string);
  console.log("Existing columns:", colNames.join(", "));

  if (!colNames.includes("listingPrice")) {
    await pg`ALTER TABLE ec_products ADD COLUMN "listingPrice" numeric(10,2)`;
    console.log("✅ Added listingPrice column");
  } else {
    console.log("ℹ️  listingPrice already exists");
  }

  if (!colNames.includes("salePrice")) {
    await pg`ALTER TABLE ec_products ADD COLUMN "salePrice" numeric(10,2)`;
    console.log("✅ Added salePrice column");
  } else {
    console.log("ℹ️  salePrice already exists");
  }

  await pg.end();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
