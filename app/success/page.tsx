"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<{
    success: boolean;
    orderId?: number;
    error?: string;
    product?: {
      id: number;
      name: string;
      isDigital: boolean;
      downloadUrl: string | null;
      activationCode: string | null;
    } | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paymentIntent) {
      // Verify the payment and create order if webhook hasn't processed it yet
      fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Verification result:", data);
          setVerificationStatus(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error verifying payment:", error);
          setVerificationStatus({
            success: false,
            error: "No se pudo verificar el pago",
          });
          setLoading(false);
        });
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

  if (verificationStatus && !verificationStatus.success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-yellow-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#212B36] mb-2">
              Verificando Pago
            </h1>
            <p className="text-[#637381] mb-6">
              Tu pago fue procesado pero estamos verificando los detalles. Por
              favor contacta al soporte si no recibes confirmación en 10
              minutos.
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
          {verificationStatus?.orderId && (
            <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
              <p className="text-sm text-green-800 mb-1">Número de Orden:</p>
              <p className="text-lg font-bold text-green-900">
                #{verificationStatus.orderId}
              </p>
            </div>
          )}

          {/* Digital Product Download Section */}
          {verificationStatus?.product?.isDigital && (
            <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
              <h2 className="text-lg font-bold text-[#212B36] mb-4">
                📦 Descarga tu Plugin de WordPress
              </h2>

              {/* Activation Code */}
              {verificationStatus.product.activationCode && (
                <div className="mb-4">
                  <p className="text-sm text-[#637381] mb-2 font-semibold">
                    Código de Activación (Contraseña del RAR):
                  </p>
                  <div className="bg-white rounded-lg p-4 border-2 border-blue-300 flex items-center justify-between">
                    <code className="text-xl font-bold text-[#212B36] tracking-wider break-all">
                      {verificationStatus.product.activationCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          verificationStatus.product?.activationCode || ""
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="ml-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      title="Copiar código"
                    >
                      {copied ? "✓ Copiado" : "Copiar"}
                    </button>
                  </div>
                  <p className="text-xs text-[#637381] mt-2">
                    💡 Usa este código cuando WinRAR te pida la contraseña al
                    descomprimir el archivo.
                  </p>
                </div>
              )}

              {/* Download Button */}
              {verificationStatus.product.downloadUrl && (
                <a
                  href={`/api/download?productId=${verificationStatus.product.id}&orderId=${verificationStatus.orderId}`}
                  className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-3 px-6 rounded-[3px] transition-colors duration-200 text-center mb-3"
                  download
                >
                  ⬇️ Descargar Plugin
                </a>
              )}

              <p className="text-xs text-[#637381] text-center">
                También te enviaremos el código de activación por correo
                electrónico
              </p>
            </div>
          )}

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

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EC2A2A] mx-auto mb-4"></div>
            <p className="text-[#637381]">Cargando...</p>
          </div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
