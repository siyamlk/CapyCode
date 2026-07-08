import { db } from "./client";
import { conversations, messages as messagesTable, preferences } from "./schema";
import { desc, eq } from "drizzle-orm";
import { CONVERSATION_INACTIVITY_MS, MAX_CONVERSATION_MESSAGES } from "@/lib/ai/contextConfig";

export interface PersistedMessage {
  id: string;
  role: "user" | "capy";
  content: string;
  mood: string | null;
  createdAt: number;
}

interface ConversationRow {
  id: string;
  updatedAt: number;
}

let activeConversationInFlight: Promise<string> | null = null;

async function countMessages(conversationId: string): Promise<number> {
  const rows = await db
    .select({ id: messagesTable.id })
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId));
  return rows.length;
}

async function findLatestConversation(): Promise<ConversationRow | null> {
  const rows = await db.select().from(conversations).orderBy(desc(conversations.updatedAt)).limit(1);
  if (rows.length === 0) return null;
  return { id: rows[0].id, updatedAt: rows[0].updatedAt };
}

async function createConversation(now: number): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .insert(conversations)
    .values({ id, title: "New chat", createdAt: now, updatedAt: now })
    .onConflictDoNothing();
  return id;
}

async function resolveActiveConversationId(): Promise<string> {
  const now = Date.now();
  const latest = await findLatestConversation();
  if (!latest) return createConversation(now);

  const isStale = now - latest.updatedAt >= CONVERSATION_INACTIVITY_MS;
  if (isStale) return createConversation(now);

  const isFull = (await countMessages(latest.id)) >= MAX_CONVERSATION_MESSAGES;
  if (isFull) return createConversation(now);

  return latest.id;
}

export function getActiveConversationId(): Promise<string> {
  if (!activeConversationInFlight) {
    activeConversationInFlight = resolveActiveConversationId().finally(() => {
      activeConversationInFlight = null;
    });
  }
  return activeConversationInFlight;
}

export async function loadMessages(conversationId: string): Promise<PersistedMessage[]> {
  const rows = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId));
  return rows
    .map((r) => ({ id: r.id, role: r.role, content: r.content, mood: r.mood, createdAt: r.createdAt }))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveMessage(
  conversationId: string,
  message: { id: string; role: "user" | "capy"; content: string; mood: string | null; createdAt: number },
): Promise<void> {
  await db
    .insert(messagesTable)
    .values({ conversationId, ...message })
    .onConflictDoNothing();
  await db
    .update(conversations)
    .set({ updatedAt: message.createdAt })
    .where(eq(conversations.id, conversationId));
}

export async function getPreference(key: string): Promise<string | null> {
  const rows = await db.select().from(preferences).where(eq(preferences.key, key));
  return rows[0]?.value ?? null;
}

export async function setPreference(key: string, value: string): Promise<void> {
  await db
    .insert(preferences)
    .values({ key, value })
    .onConflictDoUpdate({ target: preferences.key, set: { value } });
}