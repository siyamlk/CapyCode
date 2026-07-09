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
  mood: text("mood"), 
  createdAt: integer("created_at").notNull(),
});


export const memories = sqliteTable("memories", {
  id: text("id").primaryKey(),
  category: text("category", {
    enum: ["preference", "project", "recurring_mistake", "learned_concept", "misc"],
  }).notNull(),
  content: text("content").notNull(),
  weight: real("weight").notNull().default(1.0), 
  createdAt: integer("created_at").notNull(),
  lastRecalledAt: integer("last_recalled_at"),
});

export const preferences = sqliteTable("preferences", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const unlockables = sqliteTable("unlockables", {
  id: text("id").primaryKey(), 
  unlockedAt: integer("unlocked_at"),
  equipped: integer("equipped", { mode: "boolean" }).notNull().default(false),
});

export const streaks = sqliteTable("streaks", {
  date: text("date").primaryKey(), 
  commits: integer("commits").notNull().default(0),
  bugsFixes: integer("bug_fixes").notNull().default(0),
});
