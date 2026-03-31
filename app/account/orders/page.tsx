import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/src/auth";
import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function OrderHistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id);

  const userOrders = await database
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  // Fetch items for all orders
  const orderIds = userOrders.map((o) => o.id);
  let allItems: {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    priceAtPurchase: string;
    productNameSnapshot: string;
    productImage: string | null;
  }[] = [];

  if (orderIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    const rawItems = await database
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        productNameSnapshot: orderItems.productNameSnapshot,
        productImage: products.image,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orderItems.orderId, orderIds));
    allItems = rawItems;
  }

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    processing: "En proceso",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#212B36]">
              Mis Pedidos
            </h1>
            <p className="text-sm text-[#637381] mt-1">
              Hola, {session.user.name}
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-[#EC2A2A] hover:underline font-medium"
          >
            ← Volver a la tienda
          </Link>
        </div>

        {userOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-[#637381] text-lg mb-4">
              Aún no tienes pedidos
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-[#EC2A2A] text-white rounded-md hover:bg-[#D32424] transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => {
              const items = allItems.filter((i) => i.orderId === order.id);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-[#212B36]">
                        Pedido #{order.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <span className="text-sm text-[#637381]">
                      {new Date(order.createdAt).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productNameSnapshot}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#212B36]">
                              {item.productNameSnapshot}
                            </p>
                            <p className="text-xs text-[#637381]">
                              Cantidad: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-[#212B36]">
                          ${parseFloat(item.priceAtPurchase).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
                    <span className="text-sm text-[#637381]">Total</span>
                    <span className="text-lg font-bold text-[#EC2A2A]">
                      ${parseFloat(order.totalAmount).toFixed(2)} MXN
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
