"use client";

import Image from "next/image";
import { useCart } from "../context/CartContext";
import { normalizeImageUrl } from "@/src/lib/image-utils";

export default function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const total = getCartTotal();
  const count = getCartCount();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isCartOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#212B36]">
            Tu Carrito{" "}
            {count > 0 && (
              <span className="text-sm font-normal text-[#637381]">
                ({count} {count === 1 ? "artículo" : "artículos"})
              </span>
            )}
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Cerrar carrito"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                className="w-20 h-20 text-gray-200 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-[#637381] text-lg mb-2">
                Tu carrito está vacío
              </p>
              <p className="text-[#637381] text-sm mb-6">
                Agrega productos para comenzar
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-[#EC2A2A] font-semibold hover:underline"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const unitPrice = parseFloat(item.price);
                const subtotal = unitPrice * item.quantity;

                return (
                  <div
                    key={item.productId}
                    className="flex gap-4 py-4 border-b border-gray-100 last:border-0"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-[#F4ECDD] rounded-lg overflow-hidden flex-shrink-0 relative">
                      {item.image ? (
                        <Image
                          src={normalizeImageUrl(item.image)}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg
                            className="w-8 h-8"
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
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[#212B36] truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-[#637381] mt-0.5">
                        ${unitPrice.toFixed(2)} c/u
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm"
                          aria-label="Reducir cantidad"
                        >
                          −
                        </button>
                        <span className="text-sm font-medium text-[#212B36] w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={
                            !item.isDigital && item.quantity >= item.stock
                          }
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>

                        {!item.isDigital && item.quantity >= item.stock && (
                          <span className="text-xs text-orange-500 ml-1">
                            Máx. stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subtotal & Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <p className="text-sm font-bold text-[#EC2A2A]">
                        ${subtotal.toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 space-y-4">
            {/* Clear Cart */}
            <div className="flex justify-between items-center">
              <button
                onClick={clearCart}
                className="text-sm text-[#637381] hover:text-red-500 transition-colors underline"
              >
                Vaciar carrito
              </button>
              <div className="text-right">
                <p className="text-sm text-[#637381]">Total</p>
                <p className="text-2xl font-bold text-[#212B36]">
                  ${total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                // Dispatch custom event for CheckoutModal to listen to
                window.dispatchEvent(new CustomEvent("open-checkout"));
              }}
              className="w-full bg-[#EC2A2A] hover:bg-[#D32424] text-white font-semibold text-lg py-3 px-6 rounded-[3px] transition-colors duration-200"
            >
              Finalizar Compra
            </button>

            {/* Continue Shopping */}
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-full text-center text-sm text-[#637381] hover:text-[#212B36] transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
