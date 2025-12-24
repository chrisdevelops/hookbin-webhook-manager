import { Router, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { sseManager } from "../lib/sse-manager.js";

const router = Router();

// Retention limit per webhook
const RETENTION_LIMIT = 1000;

// Handle all HTTP methods for webhook ingestion
router.all("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Look up the webhook
    const webhook = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, id))
      .limit(1);

    // 404 if not found
    if (webhook.length === 0) {
      res.status(404).json({
        error: "not_found",
        message: "Webhook not found",
      });
      return;
    }

    // 410 Gone if inactive
    if (!webhook[0].isActive) {
      res.status(410).json({
        error: "webhook_inactive",
        message: "This webhook is currently inactive.",
      });
      return;
    }

    // Extract request data
    const method = req.method;
    const headers = req.headers as Record<string, string>;
    const contentType = req.get("content-type") || "text/plain";
    const sourceIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    // Get body as string
    let body = "";
    if (typeof req.body === "string") {
      body = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      body = req.body.toString("utf-8");
    } else if (req.body && typeof req.body === "object") {
      body = JSON.stringify(req.body);
    }

    // Create request record
    const requestId = uuidv4();
    const now = new Date().toISOString();

    const newRequest = {
      id: requestId,
      webhookId: id,
      method,
      statusCode: 200, // Client-side status - we return 200
      headers: JSON.stringify(headers),
      body,
      contentType,
      sourceIp,
      createdAt: now,
    };

    await db.insert(schema.requests).values(newRequest);

    // Emit SSE event to all connected clients for this webhook
    sseManager.emit(id, "new-request", newRequest);

    // Enforce retention limit - delete oldest requests if over limit
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.requests)
      .where(eq(schema.requests.webhookId, id));

    const count = countResult[0]?.count || 0;

    if (count > RETENTION_LIMIT) {
      const toDelete = count - RETENTION_LIMIT;
      const oldestRequests = await db
        .select({ id: schema.requests.id })
        .from(schema.requests)
        .where(eq(schema.requests.webhookId, id))
        .orderBy(schema.requests.createdAt)
        .limit(toDelete);

      for (const oldest of oldestRequests) {
        await db.delete(schema.requests).where(eq(schema.requests.id, oldest.id));
      }
    }

    // Return success
    res.status(200).json({
      received: true,
      requestId,
      timestamp: now,
    });
  } catch (error) {
    console.error("Failed to process webhook request:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to process request",
    });
  }
});

export default router;
