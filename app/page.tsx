"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CheckoutModal from "./components/CheckoutModal";

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    price: string;
    image: string;
  } | null>(null);
  const products = [
    {
      id: 1,
      name: "Playmobil  City Life",
      description:
        "Juguete de construcción de la serie City Life de Playmobil, ideal para niños a partir de 4 años.",
      price: "$699.00",
      image: "/products/playmobil.png",
      bgColor: "#ECE5D8",
    },
    {
      id: 2,
      name: "Barbie 2015 B",
      description:
        "Esta Barbie de gran tamaño es perfecta para coleccionistas y fans de todas las edades.",
      price: "$503.10",
      image: "/products/barbie.png",
      bgColor: "#F4ECDD",
    },
    {
      id: 3,
      name: "Hotwheels Barbie",
      description: "Coche Hot Wheels edición Barbie de la película.",
      price: "$113.89",
      image: "/products/hotwheels.jpg",
      bgColor: "#F9F1E3",
    },
    {
      id: 4,
      name: "Perfume Avon Wild Country",
      description:
        "Un perfume masculino que combina notas frescas y especiadas.",
      price: "$237.00",
      image: "/products/avon.jpg",
      bgColor: "#FFFCF8",
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mb-16">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-[3px] shadow-[0_54px_80px_-16px_rgba(219,222,229,0.8)] overflow-hidden"
            >
              {/* Product Image */}
              <div
                className="h-64 flex items-center justify-center"
                style={{ backgroundColor: product.bgColor }}
              >
                <Image
                  src={product.image}
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
                  {product.price}
                </p>

                {/* Buy Button */}
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="w-full mt-4 bg-[#EC2A2A] hover:bg-[#D32424] text-white font-semibold text-lg py-3 px-6 rounded-[3px] transition-colors duration-200"
                >
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Modal */}
        {selectedProduct && (
          <CheckoutModal
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            product={selectedProduct}
          />
        )}

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
