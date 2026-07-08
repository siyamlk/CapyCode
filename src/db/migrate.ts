import Database from "@tauri-apps/plugin-sql";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New chat',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    role TEXT NOT NULL CHECK (role IN ('user','capy')),
    content TEXT NOT NULL,
    mood TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)`,
  `CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('preference','project','recurring_mistake','learned_concept','misc')),
    content TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    created_at INTEGER NOT NULL,
    last_recalled_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS unlockables (
    id TEXT PRIMARY KEY,
    unlocked_at INTEGER,
    equipped INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS streaks (
    date TEXT PRIMARY KEY,
    commits INTEGER NOT NULL DEFAULT 0,
    bug_fixes INTEGER NOT NULL DEFAULT 0
  )`,
];

export async function runMigrations(): Promise<void> {
  const conn = await Database.load("sqlite:capycode.db");
  for (const statement of STATEMENTS) {
    await conn.execute(statement);
  }
}