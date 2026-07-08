import { create } from "zustand";
import {
  DIALOGUE_FOR_MOOD,
  Mood,
  MoodEvent,
  OVERLAY_DURATION_MS,
  API_ERROR_OVERLAY_MS,
  pickLine,
} from "@/lib/moodMachine";
import {
  getActiveConversationId,
  loadMessages,
  saveMessage,
  getPreference,
  setPreference,
} from "@/db/repo";

interface ChatMessage {
  id: string;
  role: "user" | "capy";
  content: string;
  createdAt: number;
}
export type ProviderId = "groq" | "gemini";
const SELECTED_PROVIDER_KEY = "selectedProvider";
const DEFAULT_PROVIDER: ProviderId = "groq";

interface CapyState {

  mood: Mood;

  context: Mood;

  contextBeforeInterrupt: Mood | null;
  lastLine: string;
  messages: ChatMessage[];
  streak: number;
  conversationId: string | null;
  hydrated: boolean;
  dispatch: (event: MoodEvent) => void;

  selectedProvider: ProviderId;
  setSelectedProvider: (provider: ProviderId) => void;

  setMood: (mood: Mood) => void;
  addMessage: (m: Omit<ChatMessage, "id" | "createdAt">) => void;
  hydrateFromDb: () => Promise<void>;
  ensureFreshConversation: () => Promise<void>;
}


const persistenceAvailable = () => "__TAURI_INTERNALS__" in window;


let overlayTimer: ReturnType<typeof setTimeout> | null = null;
function clearOverlayTimer() {
  if (overlayTimer) {
    clearTimeout(overlayTimer);
    overlayTimer = null;
  }
}

export const useCapyStore = create<CapyState>((set, get) => ({
  mood: "idle",
  context: "idle",
  contextBeforeInterrupt: null,
  lastLine: "Hmm, what are we building today?",
  messages: [],
  streak: 0,
  conversationId: null,
  hydrated: false,
  selectedProvider: DEFAULT_PROVIDER,

  dispatch: (event) => {
    const state = get();
    const { mood, context, contextBeforeInterrupt } = state;

    switch (event.type) {

      case "BUG_REPORTED": {
        clearOverlayTimer();
        if (context !== "detective") {
          set({
            context: "detective",
            contextBeforeInterrupt: context === "concerned" ? contextBeforeInterrupt : context,
            mood: "detective",
            lastLine: pickLine("detective"),
          });
        }

        return;
      }

      case "BUG_RESOLVED": {
        const restored = contextBeforeInterrupt ?? "idle";
        set({ context: restored, contextBeforeInterrupt: null, mood: "happy", lastLine: pickLine("happy") });
        clearOverlayTimer();
        overlayTimer = setTimeout(() => {
          const s = get();
          set({ mood: s.context, lastLine: pickLine(s.context) });
        }, OVERLAY_DURATION_MS.happy);
        return;
      }

      case "BUILDER_TOPIC": {

        if (context === "detective" || context === "concerned") return;
        if (context !== "builder") {
          set({ context: "builder", mood: "builder", lastLine: pickLine("builder") });
        }
        return;
      }

      case "USER_FRUSTRATED": {
        clearOverlayTimer();
        if (context !== "concerned") {
          set({
            context: "concerned",
            contextBeforeInterrupt: context === "detective" ? contextBeforeInterrupt : context,
            mood: "concerned",
            lastLine: pickLine("concerned"),
          });
        }
        return;
      }

      case "CONVERSATION_LIGHTENED": {
        if (context !== "concerned") return;
        const restored = contextBeforeInterrupt ?? "idle";
        set({ context: restored, contextBeforeInterrupt: null, mood: restored, lastLine: pickLine(restored) });
        return;
      }

      case "TOPIC_CHANGED": {
        clearOverlayTimer();
        set({ context: "idle", contextBeforeInterrupt: null, mood: "idle", lastLine: pickLine("idle") });
        return;
      }

      case "MEANINGFUL_ACHIEVEMENT": {
        const isInterrupt = context === "detective" || context === "concerned";
        const restoredContext = isInterrupt ? (contextBeforeInterrupt ?? "idle") : context;
        clearOverlayTimer();
        set({
          mood: "happy",
          context: restoredContext,
          contextBeforeInterrupt: isInterrupt ? null : contextBeforeInterrupt,
          lastLine: pickLine("happy"),
        });
        overlayTimer = setTimeout(() => {
          const s = get();
          set({ mood: s.context, lastLine: pickLine(s.context) });
        }, OVERLAY_DURATION_MS.happy);
        return;
      }

      case "MAJOR_MILESTONE": {

        clearOverlayTimer();
        set({
          mood: "celebration",
          context: "idle",
          contextBeforeInterrupt: null,
          lastLine: pickLine("celebration"),
        });
        overlayTimer = setTimeout(() => {
          set({ mood: "cheerleader", lastLine: pickLine("cheerleader") });
          overlayTimer = setTimeout(() => {
            const s = get();
            set({ mood: s.context, lastLine: pickLine(s.context) });
          }, OVERLAY_DURATION_MS.cheerleader);
        }, OVERLAY_DURATION_MS.celebration);
        return;
      }

      case "AI_GENERATING": {
        clearOverlayTimer();
        set({ mood: "thinking" });
        return;
      }

      case "AI_RESPONDED": {

        set({ mood: context, lastLine: pickLine(context) });
        return;
      }

      case "API_ERROR": {

        set({ mood: "concerned", lastLine: pickLine("concerned") });
        clearOverlayTimer();
        overlayTimer = setTimeout(() => {
          const s = get();
          set({ mood: s.context, lastLine: pickLine(s.context) });
        }, API_ERROR_OVERLAY_MS);
        return;
      }

      case "USER_IDLE_LONG": {
        clearOverlayTimer();
        set({ mood: "sleepy", lastLine: pickLine("sleepy") });
        return;
      }

      case "USER_RETURNED": {
        if (mood !== "sleepy") return;
        set({ mood: context, lastLine: pickLine(context) });
        return;
      }

      case "CONVERSATION_STARTED": {
        set({ mood: "idle", context: "idle", lastLine: pickLine("idle") });
        return;
      }

      case "OVERLAY_ENDED": {
        set({ mood: context, lastLine: pickLine(context) });
        return;
      }
    }
  },

  setMood: (mood) => set({ mood, lastLine: pickLine(mood) }),
  setSelectedProvider: (provider) => {
    set({ selectedProvider: provider });
    if (persistenceAvailable()) {
      setPreference(SELECTED_PROVIDER_KEY, provider).catch((err) =>
        console.error("CapyCode: failed to persist selected provider", err),
      );
    }
  },

  addMessage: (m) => {
    const entry: ChatMessage = { ...m, id: crypto.randomUUID(), createdAt: Date.now() };
    set((state) => ({ messages: [...state.messages, entry] }));

    const { conversationId } = get();
    if (persistenceAvailable() && conversationId) {
      saveMessage(conversationId, { ...entry, mood: get().mood }).catch((err) =>
        console.error("CapyCode: failed to persist message", err),
      );
    }
  },

  hydrateFromDb: async () => {
    if (!persistenceAvailable()) {
      set({ hydrated: true });
      return;
    }
    try {
      const conversationId = await getActiveConversationId();
      const persisted = await loadMessages(conversationId);
      const storedProvider = await getPreference(SELECTED_PROVIDER_KEY);
      const selectedProvider: ProviderId =
        storedProvider === "gemini" || storedProvider === "groq" ? storedProvider : DEFAULT_PROVIDER;
      set({
        conversationId,
        hydrated: true,
        messages: persisted.map((p) => ({ id: p.id, role: p.role, content: p.content, createdAt: p.createdAt })),
        selectedProvider,
      });
    } catch (err) {
      console.error("CapyCode: failed to hydrate chat history from DB", err);
      set({ hydrated: true });
    }
  },
  ensureFreshConversation: async () => {
  if (!persistenceAvailable()) return;

  try {
    const activeId = await getActiveConversationId();

    if (activeId !== get().conversationId) {
      set({
        conversationId: activeId,
        messages: [],
      });
    }
  } catch (err) {
    console.error("CapyCode: failed to resolve active conversation", err);
  }
},
}));



let idleTimer: ReturnType<typeof setTimeout> | null = null;
const IDLE_TO_SLEEPY_MS = 3 * 60 * 1000;

export function resetIdleWatcher() {
  if (idleTimer) clearTimeout(idleTimer);
  const wasSleepy = useCapyStore.getState().mood === "sleepy";
  if (wasSleepy) useCapyStore.getState().dispatch({ type: "USER_RETURNED" });
  idleTimer = setTimeout(() => {
    useCapyStore.getState().dispatch({ type: "USER_IDLE_LONG" });
  }, IDLE_TO_SLEEPY_MS);
}


let idleChatterTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleIdleChatter() {
  if (idleChatterTimer) clearTimeout(idleChatterTimer);
  const delay = (2 + Math.random() * 3) * 60 * 1000;
  idleChatterTimer = setTimeout(() => {
    const state = useCapyStore.getState();
    if (state.mood === "idle" && state.context === "idle") {
      const lines = DIALOGUE_FOR_MOOD.idle;
      let next = pickLine("idle");
      if (lines.length > 1) {
        let attempts = 0;
        while (next === state.lastLine && attempts < 5) {
          next = pickLine("idle");
          attempts++;
        }
      }
      useCapyStore.setState({ lastLine: next });
    }
    scheduleIdleChatter();
  }, delay);
}
scheduleIdleChatter();