import type { Order, OrderItem, Product } from '@/src/db/schema';

interface CustomerEmailProps {
  order: Order;
  items: Array<OrderItem & { product: Product | null }>;
}

export function generateCustomerOrderConfirmationEmail({ order, items }: CustomerEmailProps): string {
  const itemsHtml = items
    .map((item) => {
      const productName = item.productNameSnapshot || item.product?.name || 'Producto desconocido';
      const isDigital = item.product?.isDigital || false;

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${productName}${isDigital ? ' <span style="color: #3b82f6; font-size: 12px;">(Digital)</span>' : ''}
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
  const hasDigitalProducts = items.some(item => item.product?.isDigital);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Orden</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

      <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 8px; margin-top: 0;">
        ¡Gracias por tu compra! 🎉
      </h1>

      <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">
        Hemos recibido tu orden exitosamente. A continuación encontrarás los detalles de tu compra.
      </p>

      <!-- Order Summary -->
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #065f46; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          Resumen de tu Orden
        </h2>
        <p style="color: #047857; margin: 4px 0;">
          <strong>Número de Orden:</strong> #${order.id}
        </p>
        <p style="color: #047857; margin: 4px 0;">
          <strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString('es-MX', {
            dateStyle: 'long',
            timeStyle: 'short'
          })}
        </p>
        <p style="color: #047857; margin: 4px 0;">
          <strong>Total Pagado:</strong> <span style="font-size: 20px; font-weight: bold;">$${Number(order.totalAmount).toFixed(2)} MXN</span>
        </p>
      </div>

      ${hasPhysicalProducts ? `
      <!-- Shipping Info -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #1e40af; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          📦 Información de Envío
        </h2>
        <p style="color: #1e40af; margin: 8px 0; line-height: 1.6;">
          Tu orden será enviada a la siguiente dirección:
        </p>
        <div style="background-color: #ffffff; padding: 12px; border-radius: 4px; margin-top: 8px;">
          <p style="color: #4b5563; margin: 4px 0;">
            ${order.shippingAddress}
          </p>
          <p style="color: #4b5563; margin: 4px 0;">
            ${order.shippingCity}, ${order.shippingState} ${order.shippingZipCode}
          </p>
          <p style="color: #4b5563; margin: 4px 0;">
            ${order.shippingCountry}
          </p>
        </div>
        <p style="color: #1e40af; margin: 16px 0 4px 0; font-weight: 600;">
          📮 Te enviaremos el número de guía de rastreo tan pronto como el paquete sea recibido por el servicio de envío.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">
          Recibirás una notificación por correo electrónico con la información de rastreo para que puedas seguir tu pedido.
        </p>
      </div>
      ` : ''}

      ${hasDigitalProducts ? `
      <!-- Digital Products Info -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #92400e; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          💾 Productos Digitales
        </h2>
        <p style="color: #92400e; margin: 8px 0; line-height: 1.6;">
          Tus productos digitales ya están disponibles. Puedes acceder a ellos en cualquier momento desde la página de confirmación de tu compra.
        </p>
        <p style="color: #78350f; font-size: 14px; margin: 8px 0;">
          <strong>Nota:</strong> Guarda este correo para referencia futura.
        </p>
      </div>
      ` : ''}

      <!-- Order Items -->
      <div style="margin-bottom: 24px;">
        <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          Detalle de Productos
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
            <tr style="background-color: #e5e7eb;">
              <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">
                Total:
              </td>
              <td style="padding: 12px; text-align: right; font-weight: bold; color: #059669; font-size: 18px;">
                $${Number(order.totalAmount).toFixed(2)} MXN
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Contact Information -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">
          Datos de Contacto
        </h2>
        <p style="color: #4b5563; margin: 4px 0;">
          <strong>Email:</strong> ${order.contactEmail}
        </p>
        <p style="color: #4b5563; margin: 4px 0;">
          <strong>Teléfono:</strong> ${order.contactPhone}
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">
          Nos pondremos en contacto contigo a través de estos medios si necesitamos alguna información adicional.
        </p>
      </div>

      <!-- Support -->
      <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
          ¿Tienes alguna pregunta sobre tu orden?
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Contáctanos a <a href="mailto:${order.contactEmail}" style="color: #3b82f6;">${order.contactEmail}</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 24px; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; margin: 4px 0;">
          Gracias por confiar en nosotros
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 4px 0;">
          Este correo es una confirmación automática de tu compra
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
