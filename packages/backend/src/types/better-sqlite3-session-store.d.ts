declare module "better-sqlite3-session-store" {
  import type { SessionOptions, Store } from "express-session";
  import type Database from "better-sqlite3";

  interface SqliteStoreOptions {
    client: Database.Database;
    expired?: {
      clear?: boolean;
      intervalMs?: number;
    };
  }

  interface SqliteStoreClass {
    new (options: SqliteStoreOptions): Store;
  }

  function createSqliteStore(session: {
    Store: typeof Store;
  }): SqliteStoreClass;

  export = createSqliteStore;
}
