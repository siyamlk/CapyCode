

export interface CapyMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIProvider {
  id: string;
  displayName: string;
  streamReply(messages: CapyMessage[]): AsyncGenerator<string, boolean, unknown>;
}


export const CAPY_SYSTEM_PROMPT = `
You are Capy, a calm, patient, curious desktop companion who helps people
learn to code. You are not a chatbot and you never sound like one.

Rules:
- Never say "Certainly", "As an AI", or "Here is the optimal solution".
- When asked a programming question: understand the goal, ask one thoughtful
  question, give one small hint, encourage exploration. Only reveal a full
  solution if the user explicitly asks for it or has clearly already tried.
- Keep responses short, warm, and conversational. Occasionally include a
  tiny action in asterisks, e.g. *tilts head*, but never overuse them.
- If uncertain, say so honestly: "Eep... I'm not completely sure. Want to
  investigate together?" Never fabricate an answer.
- Celebrate small wins genuinely. Never be sarcastic, robotic, or condescending.
`.trim();

class GroqProvider implements AIProvider {
  id = "groq";
  displayName = "Groq";

  async *streamReply(messages: CapyMessage[]): AsyncGenerator<string, boolean, unknown> {
    let apiKey: string | null = null;
    try {
      apiKey = (await window.capyBridge?.getSecret("GROQ_API_KEY")) ?? null;
    } catch (err) {
      
      console.error("CapyCode: failed to read secret from OS keychain", err);
      yield "Eep... I couldn't reach the keychain to check for an API key. Is a keychain/secret-service running on your system?";
      return true;
    }
    if (!apiKey) {
      yield "Eep... I don't have a Groq key yet. Add one in Settings and I'll be right here.";
      return true;
    }

    let res: Response;
    try {
      
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // llama-3.3-70b-versatile: Groq's current recommended
          // general-purpose production chat model (strong quality,
          // large context, fast inference on Groq's LPUs).
          model: "llama-3.3-70b-versatile",
          stream: true,
          messages: [{ role: "system", content: CAPY_SYSTEM_PROMPT }, ...messages],
        }),
      });
    } catch (err) {
      console.error("CapyCode: network error talking to Groq", err);
      yield "Hmm, I couldn't reach the AI just now — want to check your connection and try again?";
      return true;
    }

    if (!res.ok) {
      const status = res.status;
      console.error(`CapyCode: Groq returned ${status}`);
      if (status === 401) {
        yield "Eep... that API key doesn't seem to work. Want to double-check it in Settings?";
      } else if (status === 429) {
        yield "I think we're being asked to slow down a little (rate limited). Want to try again in a moment?";
      } else {
        yield "Hmm, something went wrong on the AI's end. Want to try again?";
      }
      return true;
    }

    if (!res.body) {
      yield "Hmm, I couldn't reach the AI just now. Want to try again?";
      return true;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return false;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta as string;
        } catch {
          
        }
      }
    }
    return false;
  }
}
class GeminiProvider implements AIProvider {
  id = "gemini";
  displayName = "Gemini";

  async *streamReply(messages: CapyMessage[]): AsyncGenerator<string, boolean, unknown> {
    let apiKey: string | null = null;
    try {
      apiKey = (await window.capyBridge?.getSecret("GEMINI_API_KEY")) ?? null;
    } catch (err) {
      console.error("CapyCode: failed to read secret from OS keychain", err);
      yield "Eep... I couldn't reach the keychain to check for an API key. Is a keychain/secret-service running on your system?";
      return true;
    }
    if (!apiKey) {
      yield "Eep... I don't have a Gemini key yet. Add one in Settings and I'll be right here.";
      return true;
    }

   
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const model = "gemini-2.0-flash-lite";
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CAPY_SYSTEM_PROMPT }] },
            contents,
          }),
        },
      );
    } catch (err) {
      console.error("CapyCode: network error talking to Gemini", err);
      yield "Hmm, I couldn't reach the AI just now — want to check your connection and try again?";
      return true;
    }

    if (!res.ok) {
      const status = res.status;
      console.error(`CapyCode: Gemini returned ${status}`);
      if (status === 401 || status === 403) {
        yield "Eep... that API key doesn't seem to work. Want to double-check it in Settings?";
      } else if (status === 429) {
        yield "I think we're being asked to slow down a little (rate limited). Want to try again in a moment?";
      } else {
        yield "Hmm, something went wrong on the AI's end. Want to try again?";
      }
      return true;
    }

    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawAnyDelta = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload) continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (delta) {
              sawAnyDelta = true;
              yield delta as string;
            }
          } catch {
            
          }
        }
      }
      if (sawAnyDelta) return false;
      yield "Hmm, I didn't get a reply back. Want to try again?";
      return true;
    }


    try {
      const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CAPY_SYSTEM_PROMPT }] },
            contents,
          }),
        },
      );
      if (!fallbackRes.ok) {
        yield "Hmm, something went wrong on the AI's end. Want to try again?";
        return true;
      }
      const data = await fallbackRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        yield "Hmm, I didn't get a reply back. Want to try again?";
        return true;
      }
      yield text as string;
      return false;
    } catch (err) {
      console.error("CapyCode: error on Gemini non-streaming fallback", err);
      yield "Hmm, I couldn't reach the AI just now — want to check your connection and try again?";
      return true;
    }
  }
}
const providers: Record<string, AIProvider> = {
  groq: new GroqProvider(),
  gemini: new GeminiProvider(),
};

export function getProvider(id: string = "groq"): AIProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Unknown AI provider: ${id}`);
  return provider;
}
export const AVAILABLE_PROVIDERS: { id: string; displayName: string }[] = Object.values(providers).map((p) => ({
  id: p.id,
  displayName: p.displayName,
}));

declare global {
  interface Window {
    capyBridge?: {
      getSecret: (key: string) => Promise<string | null>;
      setSecret: (key: string, value: string) => Promise<void>;
    };
  }
}
