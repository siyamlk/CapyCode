import { motion, AnimatePresence } from "framer-motion";

export function SpeechBubble({ text }: { text: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ opacity: 0, y: 6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="relative max-w-[240px] rounded-cozy bg-white/90 px-4 py-2.5 text-sm text-capy-outline shadow-cozy font-cozy"
      >
        {text}
        <div className="absolute -bottom-1.5 left-8 h-3 w-3 rotate-45 bg-white/90" />
      </motion.div>
    </AnimatePresence>
  );
}
