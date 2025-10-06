"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentIntent) {
      setLoading(false);
    }
  }, [paymentIntent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EC2A2A] mx-auto mb-4"></div>
          <p className="text-[#637381]">Verificando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#212B36] mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-[#637381] mb-6">
            Tu compra ha sido procesada correctamente. Recibirás un correo de
            confirmación en breve.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#637381] mb-1">ID de Transacción:</p>
            <p className="text-xs font-mono text-[#212B36] break-all">
              {paymentIntent}
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-block w-full bg-[#EC2A2A] hover:bg-[#D32424] text-white font-semibold text-lg py-3 px-6 rounded-[3px] transition-colors duration-200"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
