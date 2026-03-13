"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCart, type CartItem } from "../context/CartContext";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutFormData {
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  referencia?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
}

function CheckoutForm({
  onClose,
  cartItems,
}: {
  onClose: () => void;
  cartItems: CartItem[];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const { clearCart } = useCart();

  const total = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>();

  const onSubmit = async (data: CheckoutFormData) => {
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Create payment intent with all cart items
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          email: data.email,
          phone: data.phone,
          shippingAddress: {
            line1: data.address,
            city: data.city,
            state: data.state,
            postal_code: data.zipCode,
            country: data.country,
          },
          referencia: data.referencia,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error: ${result.error}`);
        setProcessing(false);
        return;
      }

      const { clientSecret } = result;

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: data.email,
              phone: data.phone,
              address: {
                line1: data.address,
                city: data.city,
                state: data.state,
                postal_code: data.zipCode,
                country: data.country,
              },
            },
          },
        }
      );

      if (error) {
        alert(`Error: ${error.message}`);
      } else if (paymentIntent?.status === "succeeded") {
        clearCart();
        window.location.href = `/success?payment_intent=${paymentIntent.id}`;
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            Email *
          </label>
          <input
            {...register("email", {
              required: "El email es requerido",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido",
              },
            })}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC2A2A]"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            Teléfono *
          </label>
          <input
            {...register("phone", { required: "El teléfono es requerido" })}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC2A2A]"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            Dirección *
          </label>
          <input
            {...register("address", { required: "La dirección es requerida" })}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC2A2A]"
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">
              {errors.address.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            Ciudad *
          </label>
          <input
            {...register("city", { required: "La ciudad es requerida" })}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC2A2A]"
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            Estado *
          </label>
          <input
            {...register("state", { required: "El estado es requerido" })}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC2A2A]"
          />
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            Código Postal *
          </label>
          <input
            {...register("zipCode", {
              required: "El código postal es requerido",
            })}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC2A2A]"
          />
          {errors.zipCode && (
            <p className="text-red-500 text-xs mt-1">
              {errors.zipCode.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            País *
          </label>
          <select
            {...register("country", { required: "El país es requerido" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC2A2A]"
          >
            <option value="">Selecciona un país</option>
            <option value="MX">México</option>
            <option value="US">Estados Unidos</option>
            <option value="CA">Canadá</option>
          </select>
          {errors.country && (
            <p className="text-red-500 text-xs mt-1">
              {errors.country.message}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            Referencias de Entrega
          </label>
          <textarea
            {...register("referencia")}
            placeholder="Ej: Casa de color azul, cerca del parque..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC2A2A] resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Opcional: Proporciona detalles adicionales para facilitar la entrega
            (color de la casa, edificios cercanos, etc.)
          </p>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#212B36] mb-1">
            Información de Pago *
          </label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-[#212B36] hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={processing || !stripe}
          className="flex-1 px-4 py-2 bg-[#EC2A2A] text-white rounded-md hover:bg-[#D32424] disabled:opacity-50"
        >
          {processing ? "Procesando..." : `Pagar $${total.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
}: CheckoutModalProps) {
  if (!isOpen) return null;

  const total = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#212B36]">
            Finalizar Compra
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Order Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-[#212B36] mb-3">
            Resumen del pedido
          </h3>
          <div className="space-y-2">
            {cartItems.map((item) => {
              const subtotal = parseFloat(item.price) * item.quantity;
              return (
                <div
                  key={item.productId}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex-1">
                    <span className="text-[#212B36] font-medium">
                      {item.name}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[#637381] ml-1">
                        × {item.quantity}
                      </span>
                    )}
                  </div>
                  <span className="text-[#212B36] font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
            <span className="text-base font-bold text-[#212B36]">Total</span>
            <span className="text-xl font-bold text-[#EC2A2A]">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm onClose={onClose} cartItems={cartItems} />
        </Elements>
      </div>
    </div>
  );
}
