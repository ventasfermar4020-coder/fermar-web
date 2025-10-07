"use client";

import Image from "next/image";
import { useState } from "react";
import CheckoutModal from "./CheckoutModal";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string | null;
  stock: number;
  isActive: boolean;
};

export default function ProductGrid({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    price: string;
    image: string;
  } | null>(null);

  const bgColors = ["#ECE5D8", "#F4ECDD", "#F9F1E3", "#FFFCF8"];

  return (
    <>
      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mb-16">
        {products.map((product, index) => {
          const priceNumber = parseFloat(product.price);
          const formattedPrice = `$${priceNumber.toFixed(2)}`;
          const bgColor = bgColors[index % bgColors.length];

          return (
            <div
              key={product.id}
              className="bg-white rounded-[3px] shadow-[0_54px_80px_-16px_rgba(219,222,229,0.8)] overflow-hidden"
            >
              {/* Product Image */}
              <div
                className="h-64 flex items-center justify-center"
                style={{ backgroundColor: bgColor }}
              >
                <Image
                  src={product.image || "/products/placeholder.png"}
                  alt={product.name}
                  width={200}
                  height={200}
                  className="object-contain max-h-[240px] w-auto"
                />
              </div>

              {/* Product Info */}
              <div className="p-5">
                <h3 className="text-[#212B36] text-2xl font-semibold leading-9 mb-4 min-h-[72px]">
                  {product.name}
                </h3>

                <p className="text-[#637381] text-base leading-6 tracking-[0.03125em] mb-6 min-h-[96px]">
                  {product.description}
                </p>

                {/* Decorative Line */}
                <div className="w-[31px] h-[2px] bg-[#D8D8D8] mx-auto mb-4" />

                {/* Price */}
                <p className="text-[#EC2A2A] text-2xl font-semibold text-center">
                  {formattedPrice}
                </p>

                {/* Buy Button */}
                <button
                  onClick={() =>
                    setSelectedProduct({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image || "/products/placeholder.png",
                    })
                  }
                  className="w-full mt-4 bg-[#EC2A2A] hover:bg-[#D32424] text-white font-semibold text-lg py-3 px-6 rounded-[3px] transition-colors duration-200"
                  disabled={product.stock === 0 || !product.isActive}
                >
                  {product.stock === 0 ? "Agotado" : "Comprar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      {selectedProduct && (
        <CheckoutModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </>
  );
}
