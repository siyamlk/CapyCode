import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("New chat"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  role: text("role", { enum: ["user", "capy"] }).notNull(),
  content: text("content").notNull(),
  mood: text("mood"), // Capy's mood at the time of this message, for replay/animation
  createdAt: integer("created_at").notNull(),
});

// Long-term memories Capy recalls naturally ("last week we fixed an
// off-by-one error together"). Kept separate from raw chat history so
// recall stays sparing and intentional rather than a full transcript dump.
export const memories = sqliteTable("memories", {
  id: text("id").primaryKey(),
  category: text("category", {
    enum: ["preference", "project", "recurring_mistake", "learned_concept", "misc"],
  }).notNull(),
  content: text("content").notNull(),
  weight: real("weight").notNull().default(1.0), // relevance decay factor
  createdAt: integer("created_at").notNull(),
  lastRecalledAt: integer("last_recalled_at"),
});

export const preferences = sqliteTable("preferences", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const unlockables = sqliteTable("unlockables", {
  id: text("id").primaryKey(), // matches sprite/outfit name, e.g. "detective_hat"
  unlockedAt: integer("unlocked_at"),
  equipped: integer("equipped", { mode: "boolean" }).notNull().default(false),
});

export const streaks = sqliteTable("streaks", {
  date: text("date").primaryKey(), // ISO date, one row per active day
  commits: integer("commits").notNull().default(0),
  bugsFixes: integer("bug_fixes").notNull().default(0),
});
