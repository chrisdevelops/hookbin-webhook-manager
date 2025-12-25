import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const webhooks = sqliteTable("webhooks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  lastViewedAt: text("last_viewed_at"), // Track when webhook was last viewed for unread status
});

export const requests = sqliteTable("requests", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  headers: text("headers").notNull(), // JSON string
  body: text("body").notNull(),
  contentType: text("content_type").notNull(),
  sourceIp: text("source_ip").notNull(),
  createdAt: text("created_at").notNull(),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
}, (table) => ({
  // Indexes for search and filter performance
  webhookIdIdx: index("requests_webhook_id_idx").on(table.webhookId),
  methodIdx: index("requests_method_idx").on(table.method),
  createdAtIdx: index("requests_created_at_idx").on(table.createdAt),
  // Composite index for common query: filter by webhook and sort by date
  webhookIdCreatedAtIdx: index("requests_webhook_id_created_at_idx").on(table.webhookId, table.createdAt),
}));

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
