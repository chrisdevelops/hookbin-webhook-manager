import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const webhooks = sqliteTable("webhooks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
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
});

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
