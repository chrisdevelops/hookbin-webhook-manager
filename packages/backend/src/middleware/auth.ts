import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { verifyApiKey, isValidApiKeyFormat } from "../lib/crypto.js";

// Extend Express session type to include userId
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

/**
 * Check if authentication is enabled via environment variable.
 * Returns true only when AUTH_ENABLED is explicitly set to "true".
 */
export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED === "true";
}

/**
 * Validate API key from request header against the database.
 * Updates last_used_at timestamp on successful validation.
 *
 * @param apiKey - The API key from the X-API-Key header
 * @returns The user ID if valid, null otherwise
 */
async function validateApiKeyFromHeader(apiKey: string): Promise<string | null> {
  // Validate format before database lookup
  if (!isValidApiKeyFormat(apiKey)) {
    return null;
  }

  try {
    // Get all API keys and check each one (timing-safe comparison)
    const apiKeys = await db.select().from(schema.apiKeys);

    for (const storedKey of apiKeys) {
      if (verifyApiKey(apiKey, storedKey.keyHash)) {
        // Update last_used_at timestamp
        await db
          .update(schema.apiKeys)
          .set({ lastUsedAt: new Date().toISOString() })
          .where(eq(schema.apiKeys.id, storedKey.id));

        return storedKey.userId;
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to validate API key:", error);
    return null;
  }
}

/**
 * Authentication middleware that protects routes.
 * Checks session-based authentication first, then API key authentication.
 *
 * When AUTH_ENABLED is false or not set, this middleware passes through
 * without any authentication checks (backward compatibility).
 *
 * Authentication methods (checked in order):
 * 1. Session: req.session.userId must be set (from login)
 * 2. API Key: X-API-Key header with valid key
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip authentication if not enabled
  if (!isAuthEnabled()) {
    next();
    return;
  }

  // Check session authentication first
  if (req.session?.userId) {
    next();
    return;
  }

  // Check API key authentication
  const apiKeyHeader = req.headers["x-api-key"];
  if (apiKeyHeader) {
    // Handle both string and string[] cases
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

    if (apiKey) {
      const userId = await validateApiKeyFromHeader(apiKey);
      if (userId) {
        // Optionally attach user info to request for downstream use
        // (req as any).userId = userId;
        next();
        return;
      }
    }
  }

  // Neither session nor valid API key found
  res.status(401).json({
    error: "unauthorized",
    message: "Authentication required",
  });
}

/**
 * Optional authentication middleware that attaches user info if authenticated,
 * but doesn't block unauthenticated requests.
 * Useful for routes that behave differently based on auth status.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip if auth not enabled
  if (!isAuthEnabled()) {
    next();
    return;
  }

  // Check session authentication
  if (req.session?.userId) {
    next();
    return;
  }

  // Check API key authentication
  const apiKeyHeader = req.headers["x-api-key"];
  if (apiKeyHeader) {
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

    if (apiKey) {
      await validateApiKeyFromHeader(apiKey);
      // Continue regardless of result for optional auth
    }
  }

  next();
}

/**
 * Middleware that requires auth to be enabled.
 * Returns 404 if authentication is not enabled (hides auth endpoints).
 */
export function requireAuthEnabled(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isAuthEnabled()) {
    res.status(404).json({
      error: "not_found",
      message: "Endpoint not found",
    });
    return;
  }

  next();
}
