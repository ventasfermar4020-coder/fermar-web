import "dotenv/config";
import { database, pg } from "../src/db/index";
import { products } from "../src/db/schema";

async function main() {
  console.log("🔍 Checking products in database...\n");

  const allProducts = await database.select().from(products);

  console.log(`Found ${allProducts.length} products:\n`);

  allProducts.forEach((product) => {
    console.log(`ID: ${product.id}`);
    console.log(`Name: ${product.name}`);
    console.log(`Price: $${product.price}`);
    console.log(`Image: ${product.image || "NO IMAGE"}`);
    console.log(`Stock: ${product.stock}`);
    console.log(`Active: ${product.isActive}`);
    console.log("---");
  });

  await pg.end();
}

main();
