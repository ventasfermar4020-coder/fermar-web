import Image from "next/image";
import Link from "next/link";
import { database } from "@/src/db";
import { products } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import ProductGrid from "./components/ProductGrid";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch active products from database
  const activeProducts = await database
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  const categories = [
    { name: "Todos", active: true },
    { name: "Juguetes", active: false },
    { name: "Regalos", active: false },
    { name: "Perfumes", active: false },
    { name: "Cremas", active: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Our Products Section */}
      <section className="max-w-[1170px] mx-auto px-6 py-12">
        {/* Navigation Labels */}
        <div className="flex gap-8 mb-6">
          <p className="text-[#676767] text-sm font-medium tracking-[0.5em]">
            PRODUCTOS
          </p>
          <Link
            href="/conocenos"
            className="text-[#676767] text-sm font-medium tracking-[0.5em] hover:text-[#212B36] transition-colors cursor-pointer"
          >
            CONÓCENOS
          </Link>
        </div>

        {/* Section Title */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/fermar-logo.png"
            alt="Our Products"
            width={300}
            height={70}
            className="object-contain"
          />
        </div>

        {/* Section Description */}
        <p className="text-[#676767] text-[19px] leading-[36px] mb-12">
          Encuentra el regalo perfecto para esa persona especial.
        </p>

        {/* Category Tabs */}
        <div className="flex gap-12 mb-16">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`text-lg leading-[22px] ${
                category.active
                  ? "font-bold text-black"
                  : "font-medium text-[#676767]"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <ProductGrid products={activeProducts} />

        {/* Navigation Dots */}
        <div className="flex items-center justify-center gap-4">
          {/* Left Arrow */}
          <button className="text-[#212B36] opacity-50">
            <svg
              width="17"
              height="2"
              viewBox="0 0 17 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 1H17" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex items-center gap-4">
            {[0, 1, 2, 3, 4].map((dot) => (
              <div
                key={dot}
                className={`rounded-full ${
                  dot === 0
                    ? "w-5 h-5 bg-[#D9D9D9] border border-[#212B36]"
                    : "w-[5px] h-[5px] bg-[#212B36]"
                }`}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button className="text-[#212B36] opacity-50">
            <svg
              width="17"
              height="2"
              viewBox="0 0 17 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 1H17" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>

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
