import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ShippingLabelPage({
  params,
}: {
  params: { id: string };
}) {
  const orderId = parseInt(params.id);

  // Fetch order details
  const [order] = await database
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Orden no encontrada
          </h1>
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:underline"
          >
            Volver a órdenes
          </Link>
        </div>
      </div>
    );
  }

  // Fetch order items
  const items = await database
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden bg-gray-100 p-4 flex justify-between items-center border-b">
        <Link
          href="/admin/orders"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          ← Volver
        </Link>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          🖨️ Imprimir Etiqueta
        </button>
      </div>

      {/* Shipping Label - Optimized for printing */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="border-4 border-black p-6 mb-6">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold">ETIQUETA DE ENVÍO</h1>
            <p className="text-xl mt-2">Orden #{order.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-6">
            {/* From Section */}
            <div>
              <h2 className="text-xl font-bold mb-3 border-b-2 border-black pb-1">
                REMITENTE
              </h2>
              <div className="text-lg">
                <p className="font-bold">TU NEGOCIO</p>
                <p>Tu Dirección</p>
                <p>Tu Ciudad, Estado CP</p>
                <p>México</p>
                <p className="mt-2">Tel: Tu Teléfono</p>
              </div>
            </div>

            {/* To Section */}
            <div>
              <h2 className="text-xl font-bold mb-3 border-b-2 border-black pb-1">
                DESTINATARIO
              </h2>
              <div className="text-lg">
                <p className="font-bold text-xl">{order.contactEmail.split('@')[0].toUpperCase()}</p>
                <p className="font-semibold mt-2">{order.shippingAddress}</p>
                <p className="font-semibold">
                  {order.shippingCity}, {order.shippingState}
                </p>
                <p className="font-semibold">CP: {order.shippingZipCode}</p>
                <p className="font-semibold">{order.shippingCountry}</p>
                <p className="mt-2">Tel: {order.contactPhone}</p>
                <p className="mt-1">Email: {order.contactEmail}</p>
              </div>
            </div>
          </div>

          {/* Reference Information */}
          {order.shippingReferencia && (
            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-400">
              <h3 className="font-bold text-lg mb-2">📍 REFERENCIAS DE ENTREGA:</h3>
              <p className="text-lg">{order.shippingReferencia}</p>
            </div>
          )}

          {/* Package Details */}
          <div className="mt-6 pt-4 border-t-2 border-black">
            <h3 className="font-bold text-lg mb-3">CONTENIDO DEL PAQUETE:</h3>
            {items.map((item, index) => (
              <div key={index} className="text-lg mb-2">
                <p>• {item.productNameSnapshot} - Cantidad: {item.quantity}</p>
              </div>
            ))}
            <p className="text-xl font-bold mt-4">
              TOTAL: ${parseFloat(order.totalAmount).toFixed(2)} MXN
            </p>
          </div>

          {/* Barcode Placeholder */}
          <div className="mt-6 text-center p-4 border-2 border-dashed border-gray-400">
            <p className="text-sm text-gray-600 mb-2">ID de Rastreo</p>
            <p className="text-3xl font-mono font-bold tracking-widest">
              {order.id.toString().padStart(10, '0')}
            </p>
          </div>

          {/* Date */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Fecha de Orden: {new Date(order.createdAt).toLocaleDateString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Instructions for courier */}
        <div className="border-2 border-gray-300 p-4 text-sm text-gray-600">
          <p className="font-semibold mb-2">INSTRUCCIONES PARA PAQUETERÍA:</p>
          <p>• Manejar con cuidado</p>
          <p>• No doblar ni mojar</p>
          <p>• Entregar en la dirección especificada</p>
          {order.shippingReferencia && <p>• Leer referencias de entrega antes de intentar la entrega</p>}
        </div>
      </div>
    </div>
  );
}
