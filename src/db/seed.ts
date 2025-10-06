import "dotenv/config";

import { database, pg } from "./index";
import { products, orders, orderItems } from "./schema";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed products
  console.log("📦 Creating products...");
  const [product1, product2, product3, product4] = await database
    .insert(products)
    .values([
      {
        name: "Premium Steel Pipe",
        description:
          "High-quality steel pipe for industrial applications. Durable and corrosion-resistant.",
        price: "125.50",
        stock: 50,
        isActive: true,
      },
      {
        name: "Construction Rebar Bundle",
        description:
          "Grade 60 rebar bundle for construction projects. 20 pieces per bundle.",
        price: "89.99",
        stock: 100,
        isActive: true,
      },
      {
        name: "Galvanized Sheet Metal",
        description:
          "Corrosion-resistant galvanized sheet metal. 4x8 feet sheets.",
        price: "156.00",
        stock: 30,
        isActive: true,
      },
      {
        name: "Structural I-Beam",
        description:
          "Heavy-duty structural I-beam for construction. 20 feet length.",
        price: "450.00",
        stock: 15,
        isActive: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Created ${4} products`);

  // Seed orders
  console.log("📋 Creating orders...");
  const [order1, order2] = await database
    .insert(orders)
    .values([
      {
        contactEmail: "customer1@example.com",
        contactPhone: "+1-555-0100",
        shippingAddress: "123 Main Street, Apt 4B",
        shippingCity: "New York",
        shippingState: "NY",
        shippingZipCode: "10001",
        shippingCountry: "USA",
        status: "delivered",
        totalAmount: "215.49",
        deliveredAt: new Date("2025-01-15"),
      },
      {
        contactEmail: "customer2@example.com",
        contactPhone: "+1-555-0200",
        shippingAddress: "456 Oak Avenue",
        shippingCity: "Los Angeles",
        shippingState: "CA",
        shippingZipCode: "90001",
        shippingCountry: "USA",
        status: "processing",
        totalAmount: "606.00",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Created ${2} orders`);

  // Seed order items
  console.log("🛒 Creating order items...");
  await database
    .insert(orderItems)
    .values([
      // Order 1 items
      {
        orderId: order1.id,
        productId: product1.id,
        quantity: 1,
        priceAtPurchase: "125.50",
        productNameSnapshot: "Premium Steel Pipe",
      },
      {
        orderId: order1.id,
        productId: product2.id,
        quantity: 1,
        priceAtPurchase: "89.99",
        productNameSnapshot: "Construction Rebar Bundle",
      },
      // Order 2 items
      {
        orderId: order2.id,
        productId: product3.id,
        quantity: 2,
        priceAtPurchase: "156.00",
        productNameSnapshot: "Galvanized Sheet Metal",
      },
      {
        orderId: order2.id,
        productId: product4.id,
        quantity: 1,
        priceAtPurchase: "450.00",
        productNameSnapshot: "Structural I-Beam",
      },
    ])
    .onConflictDoNothing();

  console.log(`✅ Created order items`);

  console.log("✨ Database seeded successfully!");
  await pg.end();
}

main();
