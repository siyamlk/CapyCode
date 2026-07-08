import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useCapyStore, ProviderId } from "@/store/capyStore";
import { AVAILABLE_PROVIDERS } from "@/lib/ai/provider";

type SaveState = "idle" | "saving" | "saved" | "error";


// lib/ai/provider.ts) only means adding one entry to this array — no new
// component needed.
const KEYS: { id: string; label: string; helpUrl: string }[] = [
  { id: "GROQ_API_KEY", label: "Groq API Key", helpUrl: "https://console.groq.com/keys" },
  { id: "GEMINI_API_KEY", label: "Gemini API Key", helpUrl: "https://aistudio.google.com/apikey" },
];

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col rounded-cozy bg-capy-cream/95 shadow-cozy"
    >
      <div className="flex items-center justify-between border-b border-capy-mainfur/20 p-4">
        <h2 className="font-cozy text-sm font-semibold text-capy-outline">Settings</h2>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="flex h-7 w-7 items-center justify-center rounded-full text-capy-outline/60 transition hover:bg-capy-mainfur/10 hover:text-capy-outline"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <ProviderSelector />
        {KEYS.map((k) => (
          <ApiKeyField key={k.id} keyId={k.id} label={k.label} helpUrl={k.helpUrl} />
        ))}
        <p className="font-cozy text-xs leading-relaxed text-capy-outline/50">
          Keys are stored in your OS keychain, never in a plaintext file or the app's database.
        </p>
      </div>
    </motion.div>
  );
}
function ProviderSelector() {
  const selectedProvider = useCapyStore((s) => s.selectedProvider);
  const setSelectedProvider = useCapyStore((s) => s.setSelectedProvider);

  return (
    <div className="space-y-1.5">
      <label className="font-cozy text-xs font-medium text-capy-outline/80">AI Provider</label>
      <div className="flex gap-2">
        {AVAILABLE_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedProvider(p.id as ProviderId)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-cozy font-medium transition ${
              selectedProvider === p.id
                ? "bg-capy-scarf text-white"
                : "bg-white/80 text-capy-outline/70 hover:bg-white"
            }`}
          >
            {p.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
function ApiKeyField({ keyId, label, helpUrl }: { keyId: string; label: string; helpUrl: string }) {
  const [value, setValue] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await window.capyBridge?.getSecret(keyId);
        if (!cancelled && existing) {
          setValue(existing);
          setHasStoredKey(true);
        }
      } catch (err) {
        console.error(`CapyCode: failed to load ${keyId} from keychain`, err);
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [keyId]);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSaveState("saving");
    try {
      await window.capyBridge?.setSecret(keyId, trimmed);
      setHasStoredKey(true);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch (err) {
      console.error(`CapyCode: failed to save ${keyId} to keychain`, err);
      setSaveState("error");
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-cozy text-xs font-medium text-capy-outline/80">{label}</label>
        <a
          href={helpUrl}
          target="_blank"
          rel="noreferrer"
          className="font-cozy text-xs text-capy-scarfshade underline decoration-dotted hover:text-capy-scarf"
        >
          Get a key
        </a>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={reveal ? "text" : "password"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (saveState !== "idle") setSaveState("idle");
            }}
            placeholder={loadError ? "Couldn't reach keychain" : "sk-..."}
            className="w-full rounded-full bg-white/80 px-4 py-2 pr-9 text-sm font-cozy text-capy-outline placeholder:text-capy-outline/40 outline-none focus:ring-2 focus:ring-capy-scarf/50"
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide key" : "Show key"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-capy-outline/40 hover:text-capy-outline/70"
          >
            {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={!value.trim() || saveState === "saving"}
          className="flex h-9 min-w-[64px] items-center justify-center rounded-full bg-capy-scarf px-3 text-xs font-cozy font-medium text-white transition hover:bg-capy-scarfshade disabled:opacity-50 disabled:hover:bg-capy-scarf"
        >
          <AnimatePresence mode="wait" initial={false}>
            {saveState === "saved" ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <Check size={13} /> Saved
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                {saveState === "saving" ? "Saving..." : "Save"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {saveState === "error" && (
        <p className="font-cozy text-xs text-red-500/80">Couldn't save that — is a keychain available on this system?</p>
      )}
      {hasStoredKey && saveState === "idle" && (
        <p className="font-cozy text-xs text-capy-outline/40">A key is currently saved.</p>
      )}
    </div>
  );
}
