"use client";

import { useCart } from "../context/CartContext";

export default function CartIconButton() {
  const { getCartCount, setIsCartOpen } = useCart();
  const count = getCartCount();

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="fixed top-6 right-6 z-30 bg-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center hover:shadow-xl transition-shadow duration-200 border border-gray-200 group"
      aria-label="Abrir carrito"
    >
      <svg
        className="w-6 h-6 text-[#212B36] group-hover:text-[#EC2A2A] transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>

      {/* Badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#EC2A2A] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-bounce-once">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
