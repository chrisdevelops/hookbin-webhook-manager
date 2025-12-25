import express from "express";
import cors from "cors";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import createSqliteStore from "better-sqlite3-session-store";
import { eq } from "drizzle-orm";
import webhooksRouter from "./routes/webhooks.js";
import requestsRouter from "./routes/requests.js";
import ingestionRouter from "./routes/ingestion.js";
import authRouter from "./routes/auth.js";
import { sseManager } from "./lib/sse-manager.js";
import { db, sqlite } from "./db/index.js";
import { users } from "./db/schema.js";
import { hashPassword } from "./lib/crypto.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Session store configuration
const SqliteStore = createSqliteStore(session);
const isProduction = process.env.NODE_ENV === "production";

// Validate SESSION_SECRET when auth is enabled
if (process.env.AUTH_ENABLED === "true" && !process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is required when AUTH_ENABLED=true");
  process.exit(1);
}

/**
 * Create initial admin user on startup if AUTH_ENABLED and INITIAL_PASSWORD are set.
 * Only creates the user if no admin user already exists.
 */
async function createInitialAdminUser(): Promise<void> {
  // Only run when auth is enabled and INITIAL_PASSWORD is set
  if (process.env.AUTH_ENABLED !== "true" || !process.env.INITIAL_PASSWORD) {
    return;
  }

  const username = process.env.INITIAL_USERNAME || "admin";

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existingUser) {
    return; // User already exists, nothing to do
  }

  // Create the initial admin user
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(process.env.INITIAL_PASSWORD);

  await db.insert(users).values({
    id: uuidv4(),
    username,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Initial admin user "${username}" created successfully`);
}

// Middleware
app.use(cors({
  origin: isProduction ? undefined : true,
  credentials: true, // Allow cookies to be sent with requests
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.text({ limit: "10mb" }));
app.use(express.raw({ limit: "10mb", type: "*/*" }));

// Session middleware (always enabled for consistent behavior)
app.use(
  session({
    store: new SqliteStore({
      client: sqlite,
      expired: {
        clear: true,
        intervalMs: 900000, // Clear expired sessions every 15 minutes
      },
    }),
    secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
    name: "hookbin.sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

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
app.use("/api/auth", authRouter);
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

// Initialize and start server
(async () => {
  try {
    // Create initial admin user if configured
    await createInitialAdminUser();

    app.listen(PORT, () => {
      console.log(`Hookbin backend running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`Webhooks: http://localhost:${PORT}/webhook/{id}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

export default app;
