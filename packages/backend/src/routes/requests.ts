import { Router } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";

const router = Router();

const PAGE_SIZE = 50;

// Get requests for a webhook with pagination
router.get("/webhooks/:webhookId/requests", async (req, res) => {
  try {
    const { webhookId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

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

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.requests)
      .where(eq(schema.requests.webhookId, webhookId));

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
    const offset = (page - 1) * PAGE_SIZE;

    // Get paginated requests
    const requests = await db
      .select()
      .from(schema.requests)
      .where(eq(schema.requests.webhookId, webhookId))
      .orderBy(desc(schema.requests.createdAt))
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

    const exportData = {
      id: r.id,
      webhookId: r.webhookId,
      method: r.method,
      statusCode: r.statusCode,
      headers: JSON.parse(r.headers),
      body: r.body,
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
