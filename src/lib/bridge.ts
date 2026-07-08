// Wires window.capyBridge (used by the AI provider layer) to real Tauri
// invoke calls. Imported once at app startup so the abstraction in
// lib/ai/provider.ts never has to know it's talking to Rust.
import { invoke } from "@tauri-apps/api/core";

export function installCapyBridge() {
  window.capyBridge = {
    getSecret: (key: string) => invoke<string | null>("get_secret", { key }),
    setSecret: (key: string, value: string) => invoke<void>("set_secret", { key, value }),
  };
}
