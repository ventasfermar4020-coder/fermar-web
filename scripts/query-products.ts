import { database } from "@/src/db";
import { products } from "@/src/db/schema";

async function queryProducts() {
  const allProducts = await database.select().from(products);
  console.log(JSON.stringify(allProducts, null, 2));
  process.exit(0);
}

queryProducts();
