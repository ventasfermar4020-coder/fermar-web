const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  await client.query(`
    ALTER TABLE ec_products
    ADD COLUMN IF NOT EXISTS "listingPrice" numeric(10,2),
    ADD COLUMN IF NOT EXISTS "salePrice" numeric(10,2)
  `);
  console.log('Columns listingPrice and salePrice added successfully.');
  await client.end();
}

main().catch((e) => {
  console.error('Error:', e.message);
  client.end();
  process.exit(1);
});
