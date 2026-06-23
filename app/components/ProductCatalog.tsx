"use client";

import { useMemo, useState } from "react";
import CategoryTabs from "./CategoryTabs";
import ProductGrid, { type Product } from "./ProductGrid";

// Preferred display order for the storefront category tabs. Only categories
// that actually have products are rendered (empty ones are hidden).
const CATEGORY_ORDER = ["Juguetes", "Regalos", "Perfumes", "Cremas"];

export default function ProductCatalog({ products }: { products: Product[] }) {
  // Non-empty categories, in the preferred order.
  const categories = useMemo(() => {
    const present = new Set(
      products.map((p) => p.category).filter((c): c is string => Boolean(c))
    );
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [products]);

  const [active, setActive] = useState(() => categories[0] ?? "");

  const filtered = useMemo(
    () => products.filter((p) => p.category === active),
    [products, active]
  );

  return (
    <>
      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        active={active}
        onChange={setActive}
        productCount={filtered.length}
      />
      {/* Product Grid — key remounts the grid so pagination resets on category change */}
      <div id="productos" className="scroll-mt-24">
        <ProductGrid key={active} products={filtered} />
      </div>
    </>
  );
}
