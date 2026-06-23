import Link from "next/link";
import { database } from "@/src/db";
import { products, productImages } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";
import ProductCatalog from "./components/ProductCatalog";
import CartIconButton from "./components/CartIconButton";
import AuthNavLinks from "./components/AuthNavLinks";
import ProductsNavLink from "./components/ProductsNavLink";
import { navButtonClass } from "./components/navButton";
import FloatingLogos from "./components/FloatingLogos";

// Force dynamic rendering - don't prerender at build time
export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch active products from database
  const activeProducts = await database
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  // Fetch all product images, sorted by sortOrder
  const allImages = await database
    .select()
    .from(productImages)
    .orderBy(asc(productImages.sortOrder));

  // Group images by productId
  const imagesByProduct = new Map<number, { url: string; sortOrder: number }[]>();
  for (const img of allImages) {
    const list = imagesByProduct.get(img.productId) || [];
    list.push({ url: img.url, sortOrder: img.sortOrder });
    imagesByProduct.set(img.productId, list);
  }

  // Attach images array to each product
  const productsWithImages = activeProducts.map((product) => ({
    ...product,
    images: imagesByProduct.get(product.id) || [],
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Cart Icon */}
      <CartIconButton />
      {/* Our Products Section */}
      <section className="max-w-[1170px] mx-auto px-6 py-12">
        {/* Navigation Labels */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <ProductsNavLink />
          <Link href="/conocenos" className={navButtonClass}>
            CONÓCENOS
          </Link>
          <AuthNavLinks />
        </div>
        {/* Section Title */}
        <FloatingLogos />
        {/* Section Description */}
        <p className="text-center text-[#4A5568] text-[26px] md:text-[32px] leading-[1.3] font-light tracking-tight mb-12 font-[family-name:var(--font-lato)]">
          Encuentra el{" "}
          <span className="font-bold italic text-[#4686E8]">
            regalo perfecto
          </span>{" "}
          para esa persona especial.
        </p>
        <br />
        {/* <p className="text-[#676767] text-[19px] leading-[36px] mb-12">
          Todos los productos incluyen costo de envío gratis por correos de
          México.
        </p> */}
        {/* Category Tabs + Product Grid (filtered by category) */}
        <ProductCatalog products={productsWithImages} />
        {/* Wishlist Icon */}
        <div className="absolute right-[118px] top-[445px] w-[35px] h-[35px] bg-[#DBE1E6] rounded-full flex items-center justify-center">
          <svg
            width="26"
            height="14"
            viewBox="0 0 26 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 14C12.7348 14 12.4783 13.8946 12.2929 13.7071L0.292893 1.70711C-0.0976311 1.31658 -0.0976311 0.683417 0.292893 0.292893C0.683417 -0.0976311 1.31658 -0.0976311 1.70711 0.292893L13 11.5858L24.2929 0.292893C24.6834 -0.0976311 25.3166 -0.0976311 25.7071 0.292893C26.0976 0.683417 26.0976 1.31658 25.7071 1.70711L13.7071 13.7071C13.5217 13.8946 13.2652 14 13 14Z"
              fill="#212B36"
            />
          </svg>
        </div>
      </section>
    </div>
  );
}
