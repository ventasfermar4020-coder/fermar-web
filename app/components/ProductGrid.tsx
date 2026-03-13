"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import CheckoutModal from "./CheckoutModal";
import CartDrawer from "./CartDrawer";
import { useCart, type CartItem } from "../context/CartContext";
import { normalizeImageUrl } from "@/src/lib/image-utils";

type ProductImageData = {
  url: string;
  sortOrder: number;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string | null;
  images: ProductImageData[];
  stock: number;
  isActive: boolean;
  isDigital?: boolean;
};

/* ──────────────────────────────────────────────
   Image Carousel (per product card)
   ────────────────────────────────────────────── */
function ProductImageCarousel({
  images,
  productName,
  bgColor,
}: {
  images: string[];
  productName: string;
  bgColor: string;
}) {
  const [current, setCurrent] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((index: number) => {
    setBrokenImages((prev) => new Set(prev).add(index));
  }, []);

  // Filter out broken images for display logic
  const validImages = images.filter((_, i) => !brokenImages.has(i));

  if (validImages.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <div className="h-[240px] w-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm">Sin imagen</p>
          </div>
        </div>
      </div>
    );
  }

  // Clamp current index to valid range (in case an image broke)
  const safeIndex = current >= images.length ? 0 : current;

  return (
    <div
      className="h-64 flex items-center justify-center relative group"
      style={{ backgroundColor: bgColor }}
    >
      <div className="relative w-full h-[240px]">
        <Image
          src={normalizeImageUrl(images[safeIndex])}
          alt={`${productName} - ${safeIndex + 1}`}
          fill
          className="object-contain p-4"
          onError={() => handleImageError(safeIndex)}
        />
      </div>

      {/* Navigation — only show if more than 1 image */}
      {images.length > 1 && (
        <>
          {/* Left arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((c) => (c - 1 + images.length) % images.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Imagen anterior"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Right arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((c) => (c + 1) % images.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Siguiente imagen"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                className={`rounded-full transition-all duration-200 ${
                  i === safeIndex
                    ? "w-2.5 h-2.5 bg-[#EC2A2A]"
                    : "w-2 h-2 bg-gray-400/60 hover:bg-gray-500"
                }`}
                aria-label={`Ir a imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   "Added to Cart" toast notification
   ────────────────────────────────────────────── */
function AddedToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg z-10 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      ✓ Agregado al carrito
    </div>
  );
}

/* ──────────────────────────────────────────────
   Product Grid
   ────────────────────────────────────────────── */
export default function ProductGrid({ products }: { products: Product[] }) {
  const { addToCart, isInCart, items, setIsCartOpen } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  // Listen for "open-checkout" custom event from CartDrawer
  useEffect(() => {
    const handler = () => setShowCheckout(true);
    window.addEventListener("open-checkout", handler);
    return () => window.removeEventListener("open-checkout", handler);
  }, []);

  const handleAddToCart = (product: Product) => {
    const primaryImage =
      product.images && product.images.length > 0
        ? product.images[0].url
        : product.image || "";

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: primaryImage,
      stock: product.stock,
      isDigital: product.isDigital,
    });

    // Show toast
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const bgColors = ["#ECE5D8", "#F4ECDD", "#F9F1E3", "#FFFCF8"];

  return (
    <>
      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mb-16">
        {products.map((product, index) => {
          const priceNumber = parseFloat(product.price);
          const formattedPrice = `$${priceNumber.toFixed(2)}`;
          const bgColor = bgColors[index % bgColors.length];
          const inCart = isInCart(product.id);

          // Build the list of carousel images:
          // Prefer the new `images` array; fall back to the legacy `image` field
          const carouselImages =
            product.images && product.images.length > 0
              ? product.images.map((img) => img.url)
              : product.image
                ? [product.image]
                : [];

          return (
            <div
              key={product.id}
              className="bg-white rounded-[3px] shadow-[0_54px_80px_-16px_rgba(219,222,229,0.8)] overflow-hidden relative"
            >
              {/* "Added" toast */}
              <AddedToast visible={addedProductId === product.id} />

              {/* "In Cart" badge */}
              {inCart && (
                <div className="absolute top-3 right-3 bg-[#EC2A2A] text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                  En tu carrito
                </div>
              )}

              {/* Product Image Carousel */}
              <ProductImageCarousel
                images={carouselImages}
                productName={product.name}
                bgColor={bgColor}
              />

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

                {/* Stock Display */}
                <div className="text-center mt-2">
                  {product.stock > 0 ? (
                    <p className="text-[#637381] text-sm">
                      {product.stock} disponible{product.stock > 1 ? "s" : ""}
                    </p>
                  ) : (
                    <p className="text-[#EC2A2A] text-sm font-semibold">
                      Sin stock
                    </p>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`w-full mt-4 font-semibold text-lg py-3 px-6 rounded-[3px] transition-colors duration-200 ${
                    inCart
                      ? "bg-[#212B36] hover:bg-[#1a2230] text-white"
                      : "bg-[#EC2A2A] hover:bg-[#D32424] text-white"
                  }`}
                  disabled={product.stock === 0 || !product.isActive}
                >
                  {product.stock === 0
                    ? "Agotado"
                    : inCart
                      ? "Agregar otro"
                      : "Agregar al carrito"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Checkout Modal — now receives cart items */}
      {showCheckout && items.length > 0 && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          cartItems={items}
        />
      )}
    </>
  );
}
