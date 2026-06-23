import { and, eq, isNull } from "drizzle-orm";
import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { env } from "@/src/env";
import { getResendClient } from "@/src/lib/email";
import { generateOwnerOrderEmail } from "@/src/emails/owner-new-order";
import { generateCustomerOrderConfirmationEmail } from "@/src/emails/customer-order-confirmation";

type SendResult =
  | { sent: true }
  | { sent: false; reason: "not-configured" | "already-sent" | "order-not-found" | "error" };

/**
 * Send the owner notification + customer confirmation emails for an order,
 * exactly once, regardless of which code path created the order.
 *
 * Both the Stripe webhook and the verify-payment fallback call this. Delivery
 * is guarded by an atomic claim on `orders.confirmationEmailSentAt`: whichever
 * caller flips it from NULL first wins and actually sends; everyone else
 * short-circuits. If sending fails after claiming, the claim is released so a
 * later retry (e.g. the webhook arriving after the fallback) can try again.
 *
 * This function never throws — order creation must not be rolled back because
 * an email failed. Call it AFTER the order-creation transaction has committed.
 */
export async function sendOrderConfirmationEmails(orderId: number): Promise<SendResult> {
  // Emails are optional: if Resend isn't configured we silently no-op.
  if (!env.RESEND_API_KEY || !env.OWNER_EMAIL) {
    console.log(
      "⚠️ Email not configured (RESEND_API_KEY / OWNER_EMAIL) - skipping order emails"
    );
    return { sent: false, reason: "not-configured" };
  }

  // Atomically claim the right to send. Only the row update that transitions
  // confirmationEmailSentAt from NULL -> now() returns a row.
  const claimed = await database
    .update(orders)
    .set({ confirmationEmailSentAt: new Date() })
    .where(and(eq(orders.id, orderId), isNull(orders.confirmationEmailSentAt)))
    .returning({ id: orders.id });

  if (claimed.length === 0) {
    // Either the order doesn't exist or another caller already sent the emails.
    console.log(`ℹ️ Order #${orderId} emails already sent or order missing - skipping`);
    return { sent: false, reason: "already-sent" };
  }

  try {
    const [order] = await database
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      // Should not happen given the claim succeeded, but guard anyway.
      return { sent: false, reason: "order-not-found" };
    }

    const items = await database
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        productNameSnapshot: orderItems.productNameSnapshot,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    const resend = getResendClient();

    // NOTE: the Resend SDK (v6) does NOT throw on API errors — it resolves to
    // { data, error }. We must inspect `error` explicitly, otherwise failures
    // (e.g. test-mode "you can only send to your own address", unverified
    // domain) are silently dropped and the email never arrives.

    // Owner notification
    const ownerResult = await resend.emails.send({
      from: "Notificaciones <onboarding@resend.dev>",
      to: env.OWNER_EMAIL,
      subject: `Nueva Orden #${order.id} - $${Number(order.totalAmount).toFixed(2)} MXN`,
      html: generateOwnerOrderEmail({ order, items }),
    });
    if (ownerResult.error) {
      throw new Error(
        `Resend rejected owner email to ${env.OWNER_EMAIL}: ${JSON.stringify(ownerResult.error)}`
      );
    }
    console.log(`📧 Owner notification email sent to ${env.OWNER_EMAIL} for order #${order.id} (id: ${ownerResult.data?.id})`);

    // Customer confirmation (the proof-of-purchase email)
    const customerResult = await resend.emails.send({
      from: "Fermar <onboarding@resend.dev>",
      to: order.contactEmail,
      subject: `Confirmación de Orden #${order.id}`,
      html: generateCustomerOrderConfirmationEmail({ order, items }),
    });
    if (customerResult.error) {
      throw new Error(
        `Resend rejected customer email to ${order.contactEmail}: ${JSON.stringify(customerResult.error)}`
      );
    }
    console.log(`📧 Customer confirmation email sent to ${order.contactEmail} for order #${order.id} (id: ${customerResult.data?.id})`);

    return { sent: true };
  } catch (error) {
    // Release the claim so a later retry can attempt delivery again.
    console.error(`⚠️ Failed to send order emails for #${orderId} (releasing claim):`, error);
    await database
      .update(orders)
      .set({ confirmationEmailSentAt: null })
      .where(eq(orders.id, orderId));
    return { sent: false, reason: "error" };
  }
}
