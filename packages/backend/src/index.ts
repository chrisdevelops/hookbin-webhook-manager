import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import webhooksRouter from "./routes/webhooks.js";
import requestsRouter from "./routes/requests.js";
import ingestionRouter from "./routes/ingestion.js";
import { sseManager } from "./lib/sse-manager.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.text({ limit: "10mb" }));
app.use(express.raw({ limit: "10mb", type: "*/*" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global SSE endpoint for all webhook events
app.get("/api/events", (req, res) => {
  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const clientId = uuidv4();

  // Add client to global SSE stream (using special ID "__global__")
  sseManager.addClient("__global__", clientId, res);

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  // Handle client disconnect
  req.on("close", () => {
    sseManager.removeClient("__global__", clientId);
  });
});

// API routes
app.use("/api/webhooks", webhooksRouter);
app.use("/api", requestsRouter);

// Webhook ingestion endpoint
app.use("/webhook", ingestionRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "not_found", message: "Endpoint not found" });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "internal_error", message: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Hookbin backend running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Webhooks: http://localhost:${PORT}/webhook/{id}`);
});

export default app;
