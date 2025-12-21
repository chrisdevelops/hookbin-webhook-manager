import express from "express";
import cors from "cors";
import webhooksRouter from "./routes/webhooks.js";
import requestsRouter from "./routes/requests.js";
import ingestionRouter from "./routes/ingestion.js";

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
