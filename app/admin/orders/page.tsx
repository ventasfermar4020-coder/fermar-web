import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  // Fetch all orders with their items
  const allOrders = await database
    .select()
    .from(orders)
    .orderBy(orders.createdAt);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Volver a la tienda
          </Link>
        </div>

        {allOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No hay órdenes todavía
          </div>
        ) : (
          <div className="grid gap-6">
            {allOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Orden #{order.id}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ${parseFloat(order.totalAmount).toFixed(2)} MXN
                    </p>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "shipped"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "processing"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Información de Contacto
                    </h3>
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {order.contactEmail}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Teléfono:</strong> {order.contactPhone}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Dirección de Envío
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.shippingAddress}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.shippingCity}, {order.shippingState}{" "}
                      {order.shippingZipCode}
                    </p>
                    <p className="text-sm text-gray-600">{order.shippingCountry}</p>
                    {order.shippingReferencia && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Referencias:</strong> {order.shippingReferencia}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <Link
                    href={`/admin/orders/${order.id}/label`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    🖨️ Imprimir Etiqueta
                  </Link>
                  {order.stripePaymentIntentId && (
                    <a
                      href={`https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                    >
                      Ver en Stripe
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
