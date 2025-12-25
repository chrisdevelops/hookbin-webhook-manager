import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import {
  verifyPassword,
  generateApiKey,
  hashApiKey,
} from "../lib/crypto.js";
import { requireAuth, requireAuthEnabled, isAuthEnabled } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/auth/status
 * Check authentication status and whether auth is enabled.
 * Public endpoint - always accessible.
 */
router.get("/status", async (req, res) => {
  try {
    const authEnabled = isAuthEnabled();
    const isAuthenticated = authEnabled && !!req.session?.userId;

    let user = null;
    if (isAuthenticated && req.session?.userId) {
      const users = await db
        .select({ id: schema.users.id, username: schema.users.username })
        .from(schema.users)
        .where(eq(schema.users.id, req.session.userId))
        .limit(1);

      if (users.length > 0) {
        user = { id: users[0].id, username: users[0].username };
      }
    }

    res.json({
      authEnabled,
      isAuthenticated,
      user,
    });
  } catch (error) {
    console.error("Failed to get auth status:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to get auth status" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with username and password.
 * Returns user info on success, sets session cookie.
 */
router.post("/login", requireAuthEnabled, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || typeof username !== "string") {
      res.status(400).json({ error: "validation_error", message: "Username is required" });
      return;
    }

    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "validation_error", message: "Password is required" });
      return;
    }

    // Find user by username
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (users.length === 0) {
      // Use generic message to prevent username enumeration
      res.status(401).json({ error: "unauthorized", message: "Invalid username or password" });
      return;
    }

    const user = users[0];

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "unauthorized", message: "Invalid username or password" });
      return;
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error("Failed to regenerate session:", err);
        res.status(500).json({ error: "internal_error", message: "Failed to create session" });
        return;
      }

      // Set user ID in session
      req.session.userId = user.id;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Failed to save session:", saveErr);
          res.status(500).json({ error: "internal_error", message: "Failed to save session" });
          return;
        }

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
          },
        });
      });
    });
  } catch (error) {
    console.error("Failed to login:", error);
    res.status(500).json({ error: "internal_error", message: "Login failed" });
  }
});

/**
 * POST /api/auth/logout
 * Destroy the current session.
 */
router.post("/logout", requireAuthEnabled, async (req, res) => {
  try {
    if (!req.session) {
      res.json({ message: "Already logged out" });
      return;
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Failed to destroy session:", err);
        res.status(500).json({ error: "internal_error", message: "Failed to logout" });
        return;
      }

      // Clear the session cookie
      res.clearCookie("connect.sid");
      res.json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error("Failed to logout:", error);
    res.status(500).json({ error: "internal_error", message: "Logout failed" });
  }
});

/**
 * GET /api/auth/api-keys
 * List all API keys for the current user.
 * Does not return the actual key values (only hashes are stored).
 */
router.get("/api-keys", requireAuthEnabled, requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
      return;
    }

    const apiKeys = await db
      .select({
        id: schema.apiKeys.id,
        name: schema.apiKeys.name,
        createdAt: schema.apiKeys.createdAt,
        lastUsedAt: schema.apiKeys.lastUsedAt,
      })
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, userId));

    res.json(apiKeys);
  } catch (error) {
    console.error("Failed to list API keys:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to list API keys" });
  }
});

/**
 * POST /api/auth/api-keys
 * Create a new API key for the current user.
 * Returns the plaintext key ONCE - it cannot be retrieved later.
 */
router.post("/api-keys", requireAuthEnabled, requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
      return;
    }

    const { name } = req.body;

    // Validate name
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "validation_error", message: "Name is required" });
      return;
    }

    if (name.length < 1 || name.length > 128) {
      res.status(400).json({
        error: "validation_error",
        message: "Name must be between 1 and 128 characters",
      });
      return;
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.insert(schema.apiKeys).values({
      id,
      userId,
      keyHash,
      name,
      createdAt: now,
    });

    // Return the plaintext key - this is the only time it will be available
    res.status(201).json({
      id,
      name,
      key: apiKey, // Only returned once at creation
      createdAt: now,
      warning: "Save this API key now. It cannot be retrieved later.",
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to create API key" });
  }
});

/**
 * DELETE /api/auth/api-keys/:id
 * Revoke/delete an API key.
 * Only the owner can delete their own keys.
 */
router.delete("/api-keys/:id", requireAuthEnabled, requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
      return;
    }

    const { id } = req.params;

    // Verify the API key belongs to the current user
    const existingKeys = await db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.id, id))
      .limit(1);

    if (existingKeys.length === 0) {
      res.status(404).json({ error: "not_found", message: "API key not found" });
      return;
    }

    if (existingKeys[0].userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Cannot delete another user's API key" });
      return;
    }

    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id));

    res.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to delete API key" });
  }
});

/**
 * PATCH /api/auth/api-keys/:id
 * Update an API key's name.
 * Only the owner can update their own keys.
 */
router.patch("/api-keys/:id", requireAuthEnabled, requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
      return;
    }

    const { id } = req.params;
    const { name } = req.body;

    // Validate name
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "validation_error", message: "Name is required" });
      return;
    }

    if (name.length < 1 || name.length > 128) {
      res.status(400).json({
        error: "validation_error",
        message: "Name must be between 1 and 128 characters",
      });
      return;
    }

    // Verify the API key belongs to the current user
    const existingKeys = await db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.id, id))
      .limit(1);

    if (existingKeys.length === 0) {
      res.status(404).json({ error: "not_found", message: "API key not found" });
      return;
    }

    if (existingKeys[0].userId !== userId) {
      res.status(403).json({ error: "forbidden", message: "Cannot update another user's API key" });
      return;
    }

    await db
      .update(schema.apiKeys)
      .set({ name })
      .where(eq(schema.apiKeys.id, id));

    res.json({
      id,
      name,
      createdAt: existingKeys[0].createdAt,
      lastUsedAt: existingKeys[0].lastUsedAt,
    });
  } catch (error) {
    console.error("Failed to update API key:", error);
    res.status(500).json({ error: "internal_error", message: "Failed to update API key" });
  }
});

export default router;
