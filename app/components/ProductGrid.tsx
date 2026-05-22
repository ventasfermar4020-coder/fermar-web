"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import CheckoutModal from "./CheckoutModal";
import CartDrawer from "./CartDrawer";
import { useCart } from "../context/CartContext";
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
  listingPrice: string | null;
  salePrice: string | null;
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

  const validImages = images.filter((_, i) => !brokenImages.has(i));

  if (validImages.length === 0) {
    return (
      <div
        className="h-[360px] flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-center justify-center text-gray-400">
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

  const safeIndex = current >= images.length ? 0 : current;

  return (
    <div
      className="h-[360px] flex items-center justify-center relative group"
      style={{ backgroundColor: bgColor }}
    >
      <div className="relative w-full h-full">
        <Image
          src={normalizeImageUrl(images[safeIndex])}
          alt={`${productName} - ${safeIndex + 1}`}
          fill
          className="object-contain p-6"
          onError={() => handleImageError(safeIndex)}
        />
      </div>

      {/* Brand wordmark (top-left of image) */}
      <div
        className="absolute top-3 left-4 italic text-[#212B36] text-lg select-none"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        Fermar
      </div>

      {/* Navigation — only show if more than 1 image */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((c) => (c - 1 + images.length) % images.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Imagen anterior"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((c) => (c + 1) % images.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Siguiente imagen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                className={`rounded-full transition-all duration-200 ${i === safeIndex
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
      className={`absolute top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg z-20 transition-all duration-300 ${visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
    >
      ✓ Agregado al carrito
    </div>
  );
}

/* ──────────────────────────────────────────────
   Product Grid — Marketplace-bold card layout
   ────────────────────────────────────────────── */
export default function ProductGrid({ products }: { products: Product[] }) {
  const { addToCart, isInCart, items } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

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
          // Use real sale/listing prices from DB when available
          const salePriceNumber = product.salePrice ? parseFloat(product.salePrice) : null;
          const listingPriceNumber = product.listingPrice ? parseFloat(product.listingPrice) : null;
          // Displayed price is salePrice if set, otherwise price
          const displayPrice = salePriceNumber ?? priceNumber;
          const formattedDisplayPrice = `$${displayPrice.toFixed(2)}`;
          // Crossed-out reference price (listingPrice if set)
          const formattedListingPrice = listingPriceNumber ? `$${listingPriceNumber.toFixed(2)}` : null;
          // Discount percentage (only show if listingPrice > displayPrice)
          const discountPct = listingPriceNumber && listingPriceNumber > displayPrice
            ? Math.round((1 - displayPrice / listingPriceNumber) * 100)
            : null;
          const bgColor = bgColors[index % bgColors.length];
          const inCart = isInCart(product.id);
          const outOfStock = product.stock === 0 || !product.isActive;

          const carouselImages =
            product.images && product.images.length > 0
              ? product.images.map((img) => img.url)
              : product.image
                ? [product.image]
                : [];

          return (
            <div
              key={product.id}
              className="bg-white rounded-xl overflow-hidden relative shadow-[0_1px_0_#ececec,0_8px_24px_-16px_rgba(0,0,0,0.15)] hover:shadow-[0_1px_0_#ececec,0_12px_32px_-12px_rgba(0,0,0,0.18)] transition-shadow duration-200 flex flex-col"
            >
              {/* "Added" toast */}
              <AddedToast visible={addedProductId === product.id} />

              {/* "In Cart" badge (top-right of image) */}
              {inCart && (
                <div className="absolute top-3 right-3 bg-[#EC2A2A] text-white text-[11px] font-bold px-2 py-1 rounded-full z-10 tracking-wide">
                  En tu carrito
                </div>
              )}

              {/* Product Image Carousel */}
              <ProductImageCarousel
                images={carouselImages}
                productName={product.name}
                bgColor={bgColor}
              />

              {/* ── Stacked promo ribbons row ── */}
              <div className="flex items-stretch">
                <div
                  className="flex items-center gap-1.5 px-3 pr-5 py-2 text-white text-xs font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, #EC2A2A 0%, #B32030 100%)",
                    clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)",
                  }}
                >
                  <span aria-hidden>🔥</span>
                  <span>Mega Ofertas</span>
                </div>
                <div className="bg-[#FFF3E0] text-[#7A3C00] px-2.5 py-2 text-[11px] font-semibold flex items-center">
                  No te lo pierdas
                </div>
              </div>

              {/* ── Feature strip (envío gratis) ── */}
              <div className="bg-[#FFF8EB] text-[#7A3C00] px-4 py-2 text-[13px] font-semibold flex items-center gap-2 border-b border-[#F3E8D0]">
                <span
                  className="w-[18px] h-[18px] rounded-full bg-[#FFD58A] grid place-items-center text-[11px]"
                  aria-hidden
                >
                  ✈
                </span>
                Envío gratis a todo México
              </div>

              {/* ── Body ── */}
              <div className="p-4 flex-1 flex flex-col">
                {/* Category badge + brand row */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="bg-[#EAF3FF] text-[#1A4C8F] px-2 py-0.5 rounded-full text-[11px] font-bold italic">
                    destacado
                  </span>
                  <span className="text-[11px] text-[#637381]">
                    · Fermar ›
                  </span>
                </div>

                {/* Product title */}
                <h3 className="text-[14px] leading-[1.4] text-[#212B36] mb-2 line-clamp-2 min-h-[40px]">
                  {product.name}
                </h3>

                {/* Description (compact, single line) */}
                <p className="text-[12px] text-[#637381] leading-[1.45] mb-3 line-clamp-2 min-h-[34px]">
                  {product.description}
                </p>

                {/* Price + stock + cart button (push to bottom) */}
                <div className="mt-auto flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    {/* Discounted price row */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[22px] font-bold text-[#EC2A2A] leading-none tracking-[-0.3px]">
                        {formattedDisplayPrice}
                      </span>
                      {discountPct && (
                        <span className="bg-[#EC2A2A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>
                    {/* Original (crossed-out) listing price */}
                    {formattedListingPrice && (
                      <div className="text-[13px] text-[#9EA8B3] line-through leading-none">
                        {formattedListingPrice}
                      </div>
                    )}
                    <div className="text-[11px] text-[#637381] mt-1">
                      {outOfStock ? (
                        <span className="text-[#EC2A2A] font-semibold">
                          Sin stock
                        </span>
                      ) : (
                        <>
                          {product.stock} disponible
                          {product.stock > 1 ? "s" : ""}
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={outOfStock}
                    aria-label={
                      inCart ? "Agregar otro al carrito" : "Agregar al carrito"
                    }
                    className={`shrink-0 w-10 h-10 rounded-full grid place-items-center transition-all duration-150 ${outOfStock
                        ? "bg-gray-100 border border-gray-200 text-gray-300 cursor-not-allowed"
                        : inCart
                          ? "bg-[#212B36] border border-[#212B36] text-white hover:bg-[#1a2230]"
                          : "bg-white border-[1.5px] border-[#212B36] text-[#212B36] hover:bg-[#212B36] hover:text-white"
                      }`}
                  >
                    {/* Cart icon */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Checkout Modal */}
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
