import "dotenv/config";
import { existsSync } from "fs";
import path from "path";
import { database, pg } from "../src/db/index";
import { products } from "../src/db/schema";

async function main() {
  console.log("🖼️  Validating product images...\n");

  const allProducts = await database.select().from(products);
  const publicDir = path.join(process.cwd(), "public");

  let missing = 0;
  let noImage = 0;
  let ok = 0;

  for (const product of allProducts) {
    if (!product.image) {
      noImage++;
      console.log(`⚠️  [ID ${product.id}] "${product.name}" — no image path in DB`);
      continue;
    }

    const filePath = path.join(publicDir, product.image);
    if (existsSync(filePath)) {
      ok++;
      console.log(`✅ [ID ${product.id}] "${product.name}" — ${product.image}`);
    } else {
      missing++;
      console.log(`❌ [ID ${product.id}] "${product.name}" — MISSING: ${product.image}`);
      console.log(`   Expected at: ${filePath}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total products: ${allProducts.length}`);
  console.log(`✅ Images found: ${ok}`);
  console.log(`❌ Images missing: ${missing}`);
  console.log(`⚠️  No image set: ${noImage}`);

  if (missing > 0) {
    console.log(`\n⚠️  ${missing} product(s) have image paths that don't match any file in public/.`);
    console.log(`   Fix by uploading the correct files or updating the DB image column.`);
  }

  await pg.end();
}

main();
