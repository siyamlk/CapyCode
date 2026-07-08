
import { invoke } from "@tauri-apps/api/core";

export function installCapyBridge() {
  window.capyBridge = {
    getSecret: (key: string) => invoke<string | null>("get_secret", { key }),
    setSecret: (key: string, value: string) => invoke<void>("set_secret", { key, value }),
  };
}
