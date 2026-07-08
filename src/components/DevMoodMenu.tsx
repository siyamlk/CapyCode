import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCapyStore } from "@/store/capyStore";
import { Mood } from "@/lib/moodMachine";

const ALL_MOODS: Mood[] = ["idle", "happy", "thinking", "detective", "concerned", "sleepy", "builder", "celebration", "cheerleader"];


export function DevMoodMenu() {
  const [open, setOpen] = useState(false);
  const { mood, setMood } = useCapyStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && (e.key === "M" || e.key === "m")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute left-4 top-4 z-50 w-52 rounded-cozy border border-capy-mainfur/20 bg-capy-cream/95 p-3 shadow-cozy"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="font-cozy text-xs font-semibold text-capy-outline">Mood tester</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close mood tester"
              className="text-capy-outline/50 hover:text-capy-outline"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`rounded-full px-2 py-1 text-[11px] font-cozy capitalize transition ${
                  mood === m
                    ? "bg-capy-scarf text-white"
                    : "bg-white/70 text-capy-outline/70 hover:bg-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="mt-2 font-cozy text-[10px] text-capy-outline/40">Ctrl+Shift+M to close</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
