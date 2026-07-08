/**
 * Real DB connection for the frontend.
 *
 * IMPORTANT: this app runs inside a Tauri *webview* (browser JS), not
 * Node.js. `better-sqlite3` (a native Node addon) cannot run here — an
 * earlier version of this file assumed it could, which was a bug that
 * would have crashed on first import. The actual path to SQLite from the
 * frontend is: JS -> @tauri-apps/plugin-sql -> IPC -> Rust -> SQLite.
 *
 * Drizzle's `sqlite-proxy` driver lets us keep writing normal Drizzle
 * queries while it forwards the actual SQL execution over that IPC bridge.
 */
import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

let sqlite: Database | null = null;

async function getConnection(): Promise<Database> {
  if (!sqlite) {
    sqlite = await Database.load("sqlite:capycode.db");
  }
  return sqlite;
}

export const db = drizzle(
  async (sql, params, method) => {
    const conn = await getConnection();
    if (method === "run" || method === "all") {
      const rows = await conn.select<Record<string, unknown>[]>(sql, params);
      return { rows: rows.map((r) => Object.values(r)) };
    }
    const result = await conn.execute(sql, params);
    return { rows: [], rowsAffected: result.rowsAffected } as never;
  },
  { schema }
);
