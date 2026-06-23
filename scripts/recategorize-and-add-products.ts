import "dotenv/config";
import { ilike, eq } from "drizzle-orm";
import { database, pg } from "@/src/db";
import { products } from "@/src/db/schema";

async function main() {
  // ── 1. Move all Avon-prefixed products to "Perfumes" ──────────────────────
  const before = await database
    .select({ id: products.id, name: products.name, category: products.category })
    .from(products)
    .where(ilike(products.name, "Avon%"));

  console.log(`\nAvon products before update (${before.length}):`);
  for (const r of before) console.log(`  [${r.id}] ${r.name}  → was: ${r.category}`);

  const moved = await database
    .update(products)
    .set({ category: "Perfumes", updatedAt: new Date() })
    .where(ilike(products.name, "Avon%"))
    .returning({ id: products.id, name: products.name });

  console.log(`\n✅ Moved ${moved.length} Avon product(s) → "Perfumes"`);

  // ── 2. Insert headset into "Regalos" (idempotent) ─────────────────────────
  const existing = await database
    .select({ id: products.id })
    .from(products)
    .where(eq(products.name, "True Wireless Headset M30 Pro"));

  if (existing.length > 0) {
    console.log(`\nℹ️  Headset already exists (id=${existing[0].id}), skipping insert.`);
  } else {
    const [inserted] = await database
      .insert(products)
      .values({
        name: "True Wireless Headset M30 Pro",
        description:
          "Audífonos inalámbricos True Wireless M30 Pro con estuche de carga, sonido estéreo de alta definición y conexión Bluetooth estable.",
        price: "200.00",
        image: "/products/headset-m30-pro.png",
        stock: 50,
        isActive: true,
        isDigital: false,
        category: "Regalos",
      })
      .returning({ id: products.id });
    console.log(`\n✅ Inserted headset (id=${inserted.id}) → "Regalos"`);
  }

  // ── 3. Summary: category counts ───────────────────────────────────────────
  const all = await database
    .select({ id: products.id, name: products.name, category: products.category })
    .from(products);

  const counts = new Map<string, number>();
  for (const r of all) {
    const k = r.category ?? "(null)";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  console.log("\n── Category counts ───────────────────────────────");
  for (const [k, v] of [...counts.entries()].sort()) console.log(`  ${k}: ${v}`);
  console.log(`  Total products: ${all.length}`);

  await pg.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
