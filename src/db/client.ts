
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
