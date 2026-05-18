import Link from "next/link";
import { database } from "@/src/db";
import { products } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import ProductsTable from "./ProductsTable";

// Force dynamic rendering to prevent build-time database queries
export const dynamic = 'force-dynamic';

export default async function ProductsListPage() {
  const allProducts = await database
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
            <Link
              href="/admin/products/new"
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
            >
              Agregar Producto
            </Link>
          </div>

          {allProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay productos registrados</p>
              <Link
                href="/admin/products/new"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                Agregar el primer producto
              </Link>
            </div>
          ) : (
            <ProductsTable products={allProducts} />
          )}
        </div>
      </div>
    </div>
  );
}
