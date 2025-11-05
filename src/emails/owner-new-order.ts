import type { Order, OrderItem, Product } from '@/src/db/schema';

interface OwnerEmailProps {
  order: Order;
  items: Array<OrderItem & { product: Product | null }>;
}

export function generateOwnerOrderEmail({ order, items }: OwnerEmailProps): string {
  const itemsHtml = items
    .map((item) => {
      const productName = item.productNameSnapshot || item.product?.name || 'Producto desconocido';
      const isDigital = item.product?.isDigital || false;
      const productType = isDigital ? '<span style="color: #3b82f6;">(Digital)</span>' : '<span style="color: #10b981;">(Físico)</span>';

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${productName} ${productType}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            $${Number(item.priceAtPurchase).toFixed(2)} MXN
          </td>
        </tr>
      `;
    })
    .join('');

  const hasPhysicalProducts = items.some(item => !item.product?.isDigital);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Orden Recibida</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

      <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 8px; margin-top: 0;">
        🎉 Nueva Orden Recibida
      </h1>

      <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">
        Se ha recibido una nueva orden en tu tienda. Los detalles se muestran a continuación.
      </p>

      <!-- Order Summary -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          Resumen de la Orden
        </h2>
        <p style="color: #4b5563; margin: 4px 0;">
          <strong>ID de Orden:</strong> #${order.id}
        </p>
        <p style="color: #4b5563; margin: 4px 0;">
          <strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString('es-MX', {
            dateStyle: 'long',
            timeStyle: 'short'
          })}
        </p>
        <p style="color: #4b5563; margin: 4px 0;">
          <strong>Total:</strong> <span style="font-size: 20px; font-weight: bold; color: #059669;">$${Number(order.totalAmount).toFixed(2)} MXN</span>
        </p>
      </div>

      <!-- Customer Information -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          Información del Cliente
        </h2>
        <p style="color: #4b5563; margin: 4px 0;">
          <strong>Email:</strong> <a href="mailto:${order.contactEmail}" style="color: #3b82f6;">${order.contactEmail}</a>
        </p>
        <p style="color: #4b5563; margin: 4px 0;">
          <strong>Teléfono:</strong> <a href="tel:${order.contactPhone}" style="color: #3b82f6;">${order.contactPhone}</a>
        </p>
      </div>

      ${hasPhysicalProducts ? `
      <!-- Shipping Address -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          Dirección de Envío
        </h2>
        <p style="color: #4b5563; margin: 4px 0;">
          ${order.shippingAddress}
        </p>
        <p style="color: #4b5563; margin: 4px 0;">
          ${order.shippingCity}, ${order.shippingState} ${order.shippingZipCode}
        </p>
        <p style="color: #4b5563; margin: 4px 0;">
          ${order.shippingCountry}
        </p>
        ${order.shippingReferencia ? `
        <p style="color: #4b5563; margin: 4px 0;">
          <strong>Referencias:</strong> ${order.shippingReferencia}
        </p>
        ` : ''}
      </div>
      ` : ''}

      <!-- Order Items -->
      <div style="margin-bottom: 24px;">
        <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          Productos Ordenados
        </h2>
        <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #e5e7eb;">
              <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Producto</th>
              <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Cantidad</th>
              <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Action Button -->
      ${hasPhysicalProducts ? `
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #6b7280; margin-bottom: 16px;">
          No olvides actualizar la orden con el número de guía cuando el paquete sea recibido por el servicio de envío.
        </p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/orders/${order.id}"
           style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Ver Orden en Panel de Admin
        </a>
      </div>
      ` : `
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #6b7280; margin-bottom: 16px;">
          Esta es una orden de productos digitales. El cliente ya tiene acceso a sus descargas.
        </p>
      </div>
      `}

      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0;">
          Este es un correo automático de notificación de nueva orden.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
