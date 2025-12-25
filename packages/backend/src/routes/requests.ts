import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, sql, and, or, like, gte, lte } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { sseManager } from "../lib/sse-manager.js";

const router = Router();

const PAGE_SIZE = 50;

// SSE endpoint for real-time webhook request updates
router.get("/webhooks/:webhookId/events", async (req, res) => {
  const { webhookId } = req.params;

  // Verify webhook exists
  try {
    const webhook = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, webhookId))
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
  res.setHeader("X-Accel-Buffering", "no");

  // Generate client ID
  const clientId = uuidv4();

  // Add client to SSE manager
  sseManager.addClient(webhookId, clientId, res);

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  // Handle client disconnect
  req.on("close", () => {
    sseManager.removeClient(webhookId, clientId);
  });
});

// Get requests for a webhook with pagination, search, and filters
router.get("/webhooks/:webhookId/requests", async (req, res) => {
  try {
    const { webhookId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    // Parse search and filter query parameters
    const search = (req.query.search as string)?.trim() || "";
    const method = (req.query.method as string)?.toUpperCase() || "";
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";

    // Verify webhook exists
    const webhook = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, webhookId))
      .limit(1);

    if (webhook.length === 0) {
      res.status(404).json({ error: "not_found", message: "Webhook not found" });
      return;
    }

    // Build filter conditions
    const conditions = [eq(schema.requests.webhookId, webhookId)];

    // Full-text search on headers and body (case-insensitive via SQLite LIKE)
    if (search) {
      // Limit search query length to prevent abuse
      const searchTerm = search.slice(0, 500);
      const searchPattern = `%${searchTerm}%`;
      conditions.push(
        or(
          like(schema.requests.headers, searchPattern),
          like(schema.requests.body, searchPattern)
        )!
      );
    }

    // HTTP method filter
    if (method) {
      conditions.push(eq(schema.requests.method, method));
    }

    // Date range filters (createdAt is stored as ISO string)
    if (startDate) {
      conditions.push(gte(schema.requests.createdAt, startDate));
    }
    if (endDate) {
      // Add time component to include the entire end date
      const endDateWithTime = endDate.includes("T") ? endDate : `${endDate}T23:59:59.999Z`;
      conditions.push(lte(schema.requests.createdAt, endDateWithTime));
    }

    const whereClause = and(...conditions);

    // Get total count with filters applied
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.requests)
      .where(whereClause);

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
    const offset = (page - 1) * PAGE_SIZE;

    // Get paginated requests with filters applied
    const requests = await db
      .select()
      .from(schema.requests)
      .where(whereClause)
      .orderBy(desc(schema.requests.isFavorite), desc(schema.requests.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    // Parse headers JSON for each request
    const parsedRequests = requests.map((r) => ({
      ...r,
      headers: JSON.parse(r.headers),
    }));

    res.json({
      requests: parsedRequests,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch requests" });
  }
});

// Get single request
router.get("/requests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await db
      .select()
      .from(schema.requests)
      .where(eq(schema.requests.id, requestId))
      .limit(1);

    if (request.length === 0) {
      res.status(404).json({ error: "not_found", message: "Request not found" });
      return;
    }

    res.json({
      ...request[0],
      headers: JSON.parse(request[0].headers),
    });
  } catch (error) {
    console.error("Failed to fetch request:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch request" });
  }
});

// Toggle favorite status of a request
router.patch("/requests/:requestId/favorite", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { isFavorite } = req.body;

    if (typeof isFavorite !== "boolean") {
      res.status(400).json({
        error: "validation_error",
        message: "isFavorite must be a boolean"
      });
      return;
    }

    // Check if request exists
    const request = await db
      .select()
      .from(schema.requests)
      .where(eq(schema.requests.id, requestId))
      .limit(1);

    if (request.length === 0) {
      res.status(404).json({ error: "not_found", message: "Request not found" });
      return;
    }

    // Update favorite status
    await db
      .update(schema.requests)
      .set({ isFavorite })
      .where(eq(schema.requests.id, requestId));

    // Return updated request
    const updated = await db
      .select()
      .from(schema.requests)
      .where(eq(schema.requests.id, requestId))
      .limit(1);

    res.json({
      ...updated[0],
      headers: JSON.parse(updated[0].headers),
    });
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to toggle favorite status"
    });
  }
});

// Export single request as JSON
router.get("/requests/:requestId/export", async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await db
      .select()
      .from(schema.requests)
      .where(eq(schema.requests.id, requestId))
      .limit(1);

    if (request.length === 0) {
      res.status(404).json({ error: "not_found", message: "Request not found" });
      return;
    }

    const r = request[0];

    // Parse body as JSON for JSON content types, with fallback to raw string
    let parsedBody: unknown = r.body;
    if (r.contentType === "application/json" && r.body) {
      try {
        parsedBody = JSON.parse(r.body);
      } catch {
        // Keep as raw string if JSON parsing fails
        parsedBody = r.body;
      }
    }

    const exportData = {
      id: r.id,
      webhookId: r.webhookId,
      method: r.method,
      statusCode: r.statusCode,
      headers: JSON.parse(r.headers),
      body: parsedBody,
      contentType: r.contentType,
      sourceIp: r.sourceIp,
      timestamp: r.createdAt,
      exportedAt: new Date().toISOString(),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="request-${requestId}.json"`
    );
    res.json(exportData);
  } catch (error) {
    console.error("Failed to export request:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to export request" });
  }
});

export default router;
