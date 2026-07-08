import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { getCurrentWindow, availableMonitors, PhysicalPosition } from "@tauri-apps/api/window";
import { useCapyStore, resetIdleWatcher } from "@/store/capyStore";
import { CapySprite } from "@/components/CapySprite";
import { SpeechBubble } from "@/components/SpeechBubble";
import { ChatPanel } from "@/components/ChatPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { installCapyBridge } from "@/lib/bridge";
import { runMigrations } from "@/db/migrate";
import { DevMoodMenu } from "@/components/DevMoodMenu";
import { getPreference, setPreference } from "@/db/repo";

type Panel = "chat" | "settings" | null;

const WINDOW_POSITION_PREF_KEY = "windowPosition";
const MOVE_SAVE_DEBOUNCE_MS = 250;

// Keeps a restored window position from ever landing fully off every
// connected monitor (e.g. the user unplugs a second monitor between
// launches). Falls back to the primary monitor's bounds if the saved
// point doesn't land on any currently-connected monitor at all.
async function clampToVisibleMonitor(x: number, y: number, width: number, height: number) {
  const monitors = await availableMonitors();
  if (monitors.length === 0) return { x, y };

  const containing = monitors.find(
    (m) =>
      x >= m.position.x &&
      x < m.position.x + m.size.width &&
      y >= m.position.y &&
      y < m.position.y + m.size.height,
  );
  const target = containing ?? monitors[0];

  const maxX = target.position.x + target.size.width - width;
  const maxY = target.position.y + target.size.height - height;
  return {
    x: Math.min(Math.max(x, target.position.x), Math.max(maxX, target.position.x)),
    y: Math.min(Math.max(y, target.position.y), Math.max(maxY, target.position.y)),
  };
}

export default function App() {
  const { mood, lastLine, dispatch, hydrateFromDb } = useCapyStore();
  const [panel, setPanel] = useState<Panel>(null);

  useEffect(() => {
   
    if ("__TAURI_INTERNALS__" in window) {
      installCapyBridge();
      runMigrations()
        .then(() => hydrateFromDb())
        .catch((err) => console.error("CapyCode: migration failed", err));
    } else {
      hydrateFromDb();
    }
    dispatch({ type: "CONVERSATION_STARTED" });
    resetIdleWatcher();

   
    const onActivity = () => resetIdleWatcher();
    window.addEventListener("keydown", onActivity);
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("mousedown", onActivity);
    return () => {
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("mousedown", onActivity);
    };
  }, []);

  
  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;

    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const saved = await getPreference(WINDOW_POSITION_PREF_KEY);
        if (saved) {
          const { x, y } = JSON.parse(saved) as { x: number; y: number };
          const size = await appWindow.outerSize();
          const clamped = await clampToVisibleMonitor(x, y, size.width, size.height);
          if (!cancelled) {
            await appWindow.setPosition(new PhysicalPosition(clamped.x, clamped.y));
          }
        }
      } catch (err) {
        console.error("CapyCode: failed to restore window position", err);
      } finally {
        // Always show the window, even if restoring the position failed —
        // it launches hidden, so this must never be skipped.
        if (!cancelled) await appWindow.show();
      }
    })();

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    appWindow
      .onMoved(({ payload: position }) => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          setPreference(WINDOW_POSITION_PREF_KEY, JSON.stringify({ x: position.x, y: position.y })).catch((err) =>
            console.error("CapyCode: failed to save window position", err),
          );
        }, MOVE_SAVE_DEBOUNCE_MS);
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      cancelled = true;
      if (saveTimer) clearTimeout(saveTimer);
      if (unlisten) unlisten();
    };
  }, []);

  return (
    <div
      
      className="relative flex h-screen w-screen flex-col items-center justify-end gap-3 bg-transparent p-4"
    >
      <button
        onClick={() => setPanel((p) => (p === "settings" ? null : "settings"))}
        aria-label="Settings"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-capy-outline/60 shadow-cozy transition hover:bg-white hover:text-capy-outline"
      >
        <Settings size={15} />
      </button>

      {panel && (
        <div className="h-[380px] w-full max-w-sm">
          {panel === "chat" ? <ChatPanel /> : <SettingsPanel onClose={() => setPanel(null)} />}
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <SpeechBubble text={lastLine} />
        <CapySprite mood={mood} onClick={() => setPanel((p) => (p === "chat" ? null : "chat"))} />
      </div>

      <DevMoodMenu />
    </div>
  );
}
