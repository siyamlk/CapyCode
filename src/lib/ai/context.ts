import { CapyMessage } from "./provider";
import { MAX_CONTEXT_MESSAGES } from "./contextConfig";

export interface ContextSourceMessage {
  role: "user" | "capy";
  content: string;
}

export type ContextSummarizer = (older: ContextSourceMessage[]) => Promise<string | null>;

function toCapyMessage(m: ContextSourceMessage): CapyMessage {
  return { role: m.role === "capy" ? "assistant" : "user", content: m.content };
}

export async function buildContextWindow(
  history: ContextSourceMessage[],
  summarize?: ContextSummarizer,
): Promise<CapyMessage[]> {
  if (history.length <= MAX_CONTEXT_MESSAGES) {
    return history.map(toCapyMessage);
  }

  const older = history.slice(0, history.length - MAX_CONTEXT_MESSAGES);
  const recent = history.slice(history.length - MAX_CONTEXT_MESSAGES);
  const recentMapped = recent.map(toCapyMessage);

  const summary = summarize ? await summarize(older) : null;
  if (!summary) {
    return recentMapped;
  }

  return [{ role: "user", content: `Summary of earlier conversation: ${summary}` }, ...recentMapped];
}