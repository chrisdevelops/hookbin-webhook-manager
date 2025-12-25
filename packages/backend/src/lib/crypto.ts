import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Number of bcrypt salt rounds for password hashing.
 * 10 rounds provides a good balance between security and performance.
 */
const BCRYPT_ROUNDS = 10;

/**
 * Hash a password using bcrypt.
 * Always use async method to avoid blocking the event loop.
 *
 * @param password - The plaintext password to hash
 * @returns The bcrypt hash string (starts with $2b$)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 * Uses bcrypt's built-in timing-safe comparison.
 *
 * @param password - The plaintext password to verify
 * @param hash - The stored bcrypt hash to compare against
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure API key.
 * Returns a 64-character hexadecimal string (32 bytes).
 *
 * @returns A new random API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash an API key using SHA-256 for storage.
 * API keys should never be stored in plaintext.
 *
 * @param apiKey - The plaintext API key to hash
 * @returns The SHA-256 hash as a hex string
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Verify an API key against a stored hash using timing-safe comparison.
 * This prevents timing attacks by ensuring comparison time is constant.
 *
 * @param providedKey - The API key provided in the request
 * @param storedHash - The SHA-256 hash stored in the database
 * @returns True if the key matches, false otherwise
 */
export function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const providedHash = hashApiKey(providedKey);

  // Ensure both buffers are the same length for timingSafeEqual
  const providedBuffer = Buffer.from(providedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (providedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, storedBuffer);
}

/**
 * Generate a cryptographically secure session secret.
 * Returns a 64-character hexadecimal string (32 bytes).
 * Useful for generating SESSION_SECRET environment variable.
 *
 * @returns A new random session secret
 */
export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate API key format before database lookup.
 * API keys should be 64-character hexadecimal strings.
 *
 * @param apiKey - The API key to validate
 * @returns True if the format is valid, false otherwise
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // API key should be 64-character hex string (32 bytes)
  return /^[a-f0-9]{64}$/i.test(apiKey);
}
