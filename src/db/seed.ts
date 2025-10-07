import "dotenv/config";

import { database, pg } from "./index";
import { products } from "./schema";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed products
  console.log("📦 Creating products...");
  await database
    .insert(products)
    .values([
      {
        name: "Playmobil City Life",
        description:
          "Juguete de construcción de la serie City Life de Playmobil, ideal para niños a partir de 4 años.",
        price: "699.00",
        image: "/products/playmobil.png",
        stock: 25,
        isActive: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Created 1 product`);

  console.log("✨ Database seeded successfully!");
  await pg.end();
}

main();
