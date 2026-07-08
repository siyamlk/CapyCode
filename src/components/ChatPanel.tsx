import { useState, useRef, useEffect } from "react";
import { useCapyStore } from "@/store/capyStore";
import { getProvider } from "@/lib/ai/provider";
import { buildContextWindow } from "@/lib/ai/context";
import { Send } from "lucide-react";



const BUG_WORDS = [
  "bug",
  "error",
  "exception",
  "stack trace",
  "debug",
  "compiler",
  "doesn't work",
  "does not work",
  "crash",
  "broken",
];

const BUG_RESOLVED_WORDS = ["fixed it", "fixed the bug", "that fixed it", "resolved", "works now", "it works now", "solved it"];


const FRUSTRATION_WORDS = [
  "i'm sad",
  "im sad",
  "i'm stressed",
  "im stressed",
  "i'm overwhelmed",
  "im overwhelmed",
  "i'm frustrated",
  "im frustrated",
  "i'm anxious",
  "im anxious",
  "i'm tired",
  "im tired",
  "i'm burnt out",
  "im burnt out",
  "burnt out",
  "burning out",
  "overwhelmed",
  "frustrated",
  "stressed",
  "stuck",
  "can't",
  "cant",
  "not working",
];

const LIGHTENED_WORDS = ["thanks", "thank you", "feeling better", "that helped", "i'm ok now", "im ok now", "better now"];


const BUILDER_WORDS = [
  "build",
  "project",
  "create",
  "implement",
  "architecture",
  "design",
  "develop",
  "feature",
  "code",
  "make",
];

const FINISHED_WORDS = ["that's finished", "we're done here", "i'm done with this", "different topic", "let's move on", "moving on"];


const ACHIEVEMENT_WORDS = [
  "finally works",
  "got it working",
  "figured it out",
  "that makes sense",
  "i understand now",
  "makes sense now",
  "understood",
  "finished the feature",
  "finished a feature",
  "we did it",
  "did it",
  "nailed it",
  "it works",
  "yes it works",
  "yay",
  "yes!!",
  "yes!",
  "woo",
  "woohoo",
  "yesss",
  "awesome",
  "amazing",
  "perfect",
  "let's go",
  "lets go",
];

const MILESTONE_WORDS = [
  "all tests pass",
  "tests all pass",
  "tests passed",
  "tests are passing",
  "deployed",
  "shipped",
  "project is finished",
  "finished the project",
  "project finished",
  "it's done",
  "completed the project",
  "first project",
];

export function ChatPanel() {
  const { messages, addMessage, dispatch, selectedProvider } = useCapyStore();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function handleSend() {
    const text = input.trim();
   
    if (!text || isSending) return;
    setIsSending(true);
    setInput("");
    

    try {
      await useCapyStore.getState().ensureFreshConversation();
      addMessage({ role: "user", content: text });
      const lower = text.toLowerCase();
      const currentContext = useCapyStore.getState().context;

      
      if (currentContext === "detective" && BUG_RESOLVED_WORDS.some((w) => lower.includes(w))) {
        dispatch({ type: "BUG_RESOLVED" });
      } else if (BUG_WORDS.some((w) => lower.includes(w))) {
        dispatch({ type: "BUG_REPORTED" });
      } else if (currentContext === "concerned" && LIGHTENED_WORDS.some((w) => lower.includes(w))) {
        dispatch({ type: "CONVERSATION_LIGHTENED" });
      } else if (FRUSTRATION_WORDS.some((w) => lower.includes(w))) {
        dispatch({ type: "USER_FRUSTRATED" });
      } else if (FINISHED_WORDS.some((w) => lower.includes(w))) {
        dispatch({ type: "TOPIC_CHANGED" });
      } else if (MILESTONE_WORDS.some((w) => lower.includes(w))) {
        dispatch({ type: "MAJOR_MILESTONE" });
      } else if (ACHIEVEMENT_WORDS.some((w) => lower.includes(w))) {
        dispatch({ type: "MEANINGFUL_ACHIEVEMENT" });
      } else if (BUILDER_WORDS.some((w) => lower.includes(w))) {
        dispatch({ type: "BUILDER_TOPIC" });
      }

 
      await new Promise((r) => setTimeout(r, 900));
      dispatch({ type: "AI_GENERATING" });

      const source = [
  ...messages,
  {
    role: "user" as const,
    content: text,
  },
];

const history = await buildContextWindow(source);

const provider = getProvider(selectedProvider);
      let full = "";
      let isError = false;
      setStreaming("");
      try {
   
        const iterator = provider.streamReply(history);
        while (true) {
          const step = await Promise.race([
            iterator.next(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("CapyCode: stream watchdog timeout")), 25000),
            ),
          ]);
          if (step.done) {
            isError = step.value;
            break;
          }
          full += step.value;
          setStreaming(full);
        }
      } catch (err) {
        console.error("CapyCode: unexpected error while streaming reply", err);
        full = full || "Eep... something went wrong on my end. Want to try that again?";
        isError = true;
      } finally {
        setStreaming("");
        addMessage({ role: "capy", content: full });
      
        dispatch({ type: isError ? "API_ERROR" : "AI_RESPONDED" });
      }
    } catch (err) {
    
      console.error("CapyCode: unexpected error before/during send", err);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-cozy bg-capy-cream/95 shadow-cozy">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-capy-outline/60 font-cozy mt-8">
            *tilts head* What are we working on today?
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-cozy px-3 py-2 text-sm font-cozy ${
              m.role === "user"
                ? "ml-auto bg-capy-scarf/30 text-capy-outline"
                : "mr-auto bg-white/90 text-capy-outline shadow-sm"
            }`}
          >
            {m.content}
          </div>
        ))}
        {streaming && (
          <div className="mr-auto max-w-[85%] rounded-cozy bg-white/90 px-3 py-2 text-sm text-capy-outline font-cozy shadow-sm">
            {streaming}
            <span className="animate-pulse">▍</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-capy-mainfur/20 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isSending && handleSend()}
          placeholder={isSending ? "Capy is thinking..." : "Ask Capy about your code..."}
          disabled={isSending}
          className="flex-1 rounded-full bg-white/80 px-4 py-2 text-sm font-cozy text-capy-outline placeholder:text-capy-outline/40 outline-none focus:ring-2 focus:ring-capy-scarf/50 disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-capy-scarf text-white transition hover:bg-capy-scarfshade disabled:opacity-50 disabled:hover:bg-capy-scarf"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
