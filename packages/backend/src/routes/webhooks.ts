import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { sseManager } from "../lib/sse-manager.js";

console.log("Loading webhooks routes - VERSION 2 with SSE support");

const router = Router();

// Test route
router.get("/test", async (_req, res) => {
  console.log("TEST ROUTE HIT!");
  res.json({ message: "Test route works!" });
});

// Get all webhooks with derived fields
router.get("/", async (_req, res) => {
  try {
    const webhooks = await db.select().from(schema.webhooks);

    // Get last request and unread status for each webhook
    const webhooksWithMeta = await Promise.all(
      webhooks.map(async (webhook) => {
        const lastRequest = await db
          .select({ createdAt: schema.requests.createdAt })
          .from(schema.requests)
          .where(eq(schema.requests.webhookId, webhook.id))
          .orderBy(desc(schema.requests.createdAt))
          .limit(1);

        const requestCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.requests)
          .where(eq(schema.requests.webhookId, webhook.id));

        // Calculate hasUnread: true if there are requests newer than lastViewedAt
        let hasUnread = false;
        if (lastRequest[0]?.createdAt && webhook.lastViewedAt) {
          hasUnread = new Date(lastRequest[0].createdAt) > new Date(webhook.lastViewedAt);
        } else if (lastRequest[0]?.createdAt && !webhook.lastViewedAt) {
          // Never viewed but has requests = unread
          hasUnread = true;
        }

        return {
          ...webhook,
          lastRequestAt: lastRequest[0]?.createdAt || null,
          requestCount: requestCount[0]?.count || 0,
          hasUnread,
        };
      })
    );

    res.json(webhooksWithMeta);
  } catch (error) {
    console.error("Failed to fetch webhooks:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch webhooks" });
  }
});

// SSE endpoint for real-time webhook updates
// Use a specific path segment before the ID to avoid routing conflicts
router.get("/stream/:id", async (req, res) => {
  const { id } = req.params;
  console.log("SSE endpoint hit for webhook:", id);

  // Verify webhook exists
  try {
    const webhook = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    if (webhook.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }
  } catch (error) {
    console.error("Failed to verify webhook:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to verify webhook" });
    return;
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering in nginx

  // Generate client ID
  const clientId = uuidv4();

  // Add client to SSE manager
  sseManager.addClient(id, clientId, res);

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  // Handle client disconnect
  req.on("close", () => {
    sseManager.removeClient(id, clientId);
  });
});

// Get single webhook
router.get("/:id", async (req, res) => {
  console.log("/:id route hit with id:", req.params.id);
  try {
    const { id } = req.params;
    const webhook = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    if (webhook.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }

    const lastRequest = await db
      .select({ createdAt: schema.requests.createdAt })
      .from(schema.requests)
      .where(eq(schema.requests.webhookId, id))
      .orderBy(desc(schema.requests.createdAt))
      .limit(1);

    res.json({
      ...webhook[0],
      lastRequestAt: lastRequest[0]?.createdAt || null,
      hasUnread: false,
    });
  } catch (error) {
    console.error("Failed to fetch webhook:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch webhook" });
  }
});

// Create webhook
router.post("/", async (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "validation_error", message: "Name is required" });
      return;
    }

    if (name.length < 3 || name.length > 128) {
      res.status(400).json({
        error: "validation_error",
        message: "Name must be between 3 and 128 characters",
      });
      return;
    }

    if (description && description.length > 512) {
      res.status(400).json({
        error: "validation_error",
        message: "Description must be at most 512 characters",
      });
      return;
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.insert(schema.webhooks).values({
      id,
      name,
      description,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

    res.status(201).json({
      id,
      name,
      description,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      url: `${baseUrl}/webhook/${id}`,
    });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to create webhook" });
  }
});

// Update webhook
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }

    const updates: Partial<schema.Webhook> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 3 || name.length > 128) {
        res.status(400).json({
          error: "validation_error",
          message: "Name must be between 3 and 128 characters",
        });
        return;
      }
      updates.name = name;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.length > 512) {
        res.status(400).json({
          error: "validation_error",
          message: "Description must be at most 512 characters",
        });
        return;
      }
      updates.description = description;
    }

    await db.update(schema.webhooks).set(updates).where(eq(schema.webhooks.id, id));

    const updated = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update webhook:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to update webhook" });
  }
});

// Delete webhook
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }

    // Requests are cascade deleted via foreign key
    await db.delete(schema.webhooks).where(eq(schema.webhooks.id, id));

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to delete webhook" });
  }
});

// Enable webhook
router.post("/:id/enable", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }

    await db
      .update(schema.webhooks)
      .set({ isActive: true, updatedAt: new Date().toISOString() })
      .where(eq(schema.webhooks.id, id));

    const updated = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to enable webhook:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to enable webhook" });
  }
});

// Disable webhook
router.post("/:id/disable", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }

    await db
      .update(schema.webhooks)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(schema.webhooks.id, id));

    const updated = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to disable webhook:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to disable webhook" });
  }
});

// Clear webhook history
router.post("/:id/clear", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }

    await db.delete(schema.requests).where(eq(schema.requests.webhookId, id));

    res.status(204).send();
  } catch (error) {
    console.error("Failed to clear webhook history:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to clear history" });
  }
});

// Mark webhook as viewed (for unread tracking)
router.post("/:id/view", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }

    await db
      .update(schema.webhooks)
      .set({ lastViewedAt: new Date().toISOString() })
      .where(eq(schema.webhooks.id, id));

    res.status(204).send();
  } catch (error) {
    console.error("Failed to mark webhook as viewed:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to mark as viewed" });
  }
});

// Log all registered routes for debugging
console.log("Registered webhooks routes:");
router.stack.forEach((layer: any) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
    console.log(`  ${methods} ${layer.route.path}`);
  }
});

export default router;
