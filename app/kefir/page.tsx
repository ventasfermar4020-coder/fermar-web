import Image from "next/image";
import Link from "next/link";
import { database } from "@/src/db";
import { products } from "@/src/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import ProductGrid from "../components/ProductGrid";

// Force dynamic rendering - don't prerender at build time
export const dynamic = "force-dynamic";

export default async function KefirPage() {
  // Fetch only the kefir grains product
  const kefirProducts = await database
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), ilike(products.name, "%kefir%")));

  return (
    <div className="min-h-screen bg-white">
      {/* Kefir Product Section */}
      <section className="max-w-[1170px] mx-auto px-6 py-12">
        {/* Navigation Labels */}
        <div className="flex gap-8 mb-6">
          <Link
            href="/"
            className="text-[#676767] text-sm font-medium tracking-[0.5em] hover:text-[#212B36] transition-colors cursor-pointer"
          >
            INICIO
          </Link>
          <p className="text-[#676767] text-sm font-medium tracking-[0.5em]">
            GRANOS DE KÉFIR
          </p>
        </div>

        {/* Section Title */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/fermar-logo.png"
            alt="Fermar"
            width={300}
            height={70}
            className="object-contain"
          />
        </div>

        {/* Section Description */}
        <p className="text-[#676767] text-[19px] leading-[36px] mb-12 text-center">
          Granos de kéfir de leche de la más alta calidad.
        </p>

        {/* Product Display */}
        {kefirProducts.length > 0 ? (
          <ProductGrid products={kefirProducts} />
        ) : (
          <div className="text-center py-12">
            <p className="text-[#676767] text-lg">
              Producto no disponible en este momento
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
