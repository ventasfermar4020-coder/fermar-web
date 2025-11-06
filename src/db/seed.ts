import "dotenv/config";

import { database, pg } from "./index";
import { products } from "./schema";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed products
  console.log("📦 Creating products...");
  const insertedProducts = await database
    .insert(products)
    .values([
      // Toys - Hot Wheels Collection
      {
        name: "Hot Wheels Retro Racers",
        description:
          "Colección de autos clásicos Hot Wheels con diseños retro. Incluye 5 vehículos de edición especial perfectos para coleccionistas.",
        price: "349.00",
        stripePriceId: null,
        image: "/products/retro-racers.png",
        stock: 15,
        isActive: true,
      },
      {
        name: "Hot Wheels Flames Edition",
        description:
          "Auto deportivo Hot Wheels con diseño de llamas. Modelo de alta velocidad con detalles metálicos y acabados premium.",
        price: "189.00",
        stripePriceId: null,
        image: "/products/flames.png",
        stock: 30,
        isActive: true,
      },
      {
        name: "Hot Wheels Drift Masters",
        description:
          "Set de autos Hot Wheels especializados en drift. Incluye pista de prueba y 3 vehículos con neumáticos de alto agarre.",
        price: "429.00",
        stripePriceId: null,
        image: "/products/drift.png",
        stock: 12,
        isActive: true,
      },
      {
        name: "Hot Wheels Motor Show Collection",
        description:
          "Edición especial Motor Show con vehículos de exhibición. Set premium con 6 autos exclusivos y base de exhibición.",
        price: "599.00",
        stripePriceId: null,
        image: "/products/motor-show.png",
        stock: 8,
        isActive: true,
      },
      {
        name: "Hot Wheels Remote Adventure",
        description:
          "Auto Hot Wheels a control remoto con tecnología de última generación. Alcance de 30 metros y velocidad máxima de 15 km/h.",
        price: "799.00",
        stripePriceId: null,
        image: "/products/remote-adventure.png",
        stock: 10,
        isActive: true,
      },
      {
        name: "Hot Wheels Tesla Model X",
        description:
          "Réplica detallada del Tesla Model X en escala Hot Wheels. Detalles auténticos y diseño futurista.",
        price: "249.00",
        stripePriceId: null,
        image: "/products/tesla-mX.jpg",
        stock: 20,
        isActive: true,
      },
      {
        name: "Hot Wheels Ford F-150",
        description:
          "Modelo Hot Wheels de la legendaria pickup Ford F-150. Detalles realistas y construcción resistente.",
        price: "229.00",
        stripePriceId: null,
        image: "/products/f150.jpg",
        stock: 18,
        isActive: true,
      },
      {
        name: "Hot Wheels Aqua King 2010",
        description:
          "Edición especial Aqua King 2010 con diseño acuático único. Colección limitada de Hot Wheels.",
        price: "279.00",
        stripePriceId: null,
        image: "/products/Aqua-king-2010.jpg",
        stock: 14,
        isActive: true,
      },
      // Playmobil
      {
        name: "Playmobil City Life",
        description:
          "Juguete de construcción de la serie City Life de Playmobil. Ideal para niños a partir de 4 años con múltiples accesorios.",
        price: "549.00",
        stripePriceId: "price_1SFfBLCXE9gLIJzj2CTp4U8e",
        image: "/products/playmobil.png",
        stock: 25,
        isActive: true,
      },
      // Barbie
      {
        name: "Barbie Fashionista",
        description:
          "Muñeca Barbie de la colección Fashionista con outfit exclusivo. Incluye accesorios y ropa intercambiable.",
        price: "399.00",
        stripePriceId: null,
        image: "/products/barbie.png",
        stock: 20,
        isActive: true,
      },
      // Beauty - Avon Products
      {
        name: "Set de Belleza Avon",
        description:
          "Set completo de productos Avon para el cuidado de la piel. Incluye crema hidratante, sérum y limpiador facial.",
        price: "649.00",
        stripePriceId: null,
        image: "/products/wild-country.jpeg",
        stock: 35,
        isActive: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Created ${insertedProducts.length} products`);

  console.log("✨ Database seeded successfully!");
  await pg.end();
}

main();
