import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

// ============================================================================
// E-COMMERCE TABLES
// ============================================================================

export const products = pgTable("ec_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stripePriceId: text("stripePriceId"), // Stripe Price ID (e.g., price_1ABC...)
  imageId: text("imageId"),
  image: text("image"),
  stock: integer("stock").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  // Digital product fields (for WordPress plugins)
  isDigital: boolean("isDigital").notNull().default(false),
  downloadUrl: text("downloadUrl"), // Path to RAR file (e.g., /downloads/my-plugin.rar)
  activationCode: text("activationCode"), // Fixed activation code for RAR password (set manually)
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const orders = pgTable(
  "ec_orders",
  {
    id: serial("id").primaryKey(),
    // Contact information (required for guest checkout)
    contactEmail: text("contactEmail").notNull(),
    contactPhone: text("contactPhone").notNull(),
    // Shipping address (required for delivery)
    shippingAddress: text("shippingAddress").notNull(),
    shippingCity: text("shippingCity").notNull(),
    shippingState: text("shippingState").notNull(),
    shippingZipCode: text("shippingZipCode").notNull(),
    shippingCountry: text("shippingCountry").notNull(),
    shippingReferencia: text("shippingReferencia"), // Additional reference for delivery (e.g., house color, nearby buildings)
    // Order details
    status: orderStatusEnum("status").notNull().default("pending"),
    totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
    // Payment information
    stripePaymentIntentId: text("stripePaymentIntentId"),
    // Timestamps
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    deliveredAt: timestamp("deliveredAt", { mode: "date" }),
  },
  (table) => ({
    statusIdx: index("orders_status_idx").on(table.status),
    contactEmailIdx: index("orders_contact_email_idx").on(table.contactEmail),
  })
);

export const orderItems = pgTable(
  "ec_order_items",
  {
    id: serial("id").primaryKey(),
    orderId: serial("orderId")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: serial("productId")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    priceAtPurchase: numeric("priceAtPurchase", {
      precision: 10,
      scale: 2,
    }).notNull(),
    productNameSnapshot: text("productNameSnapshot").notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
  })
);

// ============================================================================
// RELATIONSHIPS
// ============================================================================

export const orderRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
