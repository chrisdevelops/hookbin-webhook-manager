import Database, { type Database as DatabaseType } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.DATABASE_PATH || "./data/hookbin.db";

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const sqlite: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_viewed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    status_code INTEGER,
    headers TEXT NOT NULL,
    body TEXT NOT NULL,
    content_type TEXT NOT NULL,
    source_ip TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_requests_webhook_id ON requests(webhook_id);
  CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
`);

// Migration: Add last_viewed_at column if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE webhooks ADD COLUMN last_viewed_at TEXT;`);
  console.log("Migration: Added last_viewed_at column to webhooks table");
} catch (error: any) {
  // Column might already exist, which is fine
  if (!error.message?.includes("duplicate column name")) {
    console.error("Migration error:", error);
  }
}

// Migration: Add is_favorite column to requests
try {
  sqlite.exec(`ALTER TABLE requests ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;`);
  console.log("Migration: Added is_favorite column to requests table");
} catch (error: any) {
  if (!error.message?.includes("duplicate column name")) {
    console.error("Migration error:", error);
  }
}

// Create composite index for efficient favorite-first sorting
try {
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_requests_favorite_created
               ON requests(webhook_id, is_favorite DESC, created_at DESC);`);
  console.log("Migration: Added composite index for favorite sorting");
} catch (error: any) {
  console.error("Index creation error:", error);
}

export const db = drizzle(sqlite, { schema });
export { schema };

// Export the raw sqlite instance for session store
export { sqlite };
