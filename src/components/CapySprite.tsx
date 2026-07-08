import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mood, SPRITE_FOR_MOOD } from "@/lib/moodMachine";
import { getCurrentWindow } from "@tauri-apps/api/window";


const sprites = import.meta.glob<{ default: string }>("../assets/capy/*.png", { eager: true });

function spriteSrc(name: string): string {
  const match = Object.entries(sprites).find(([path]) => path.endsWith(`${name}.png`));
  return match?.[1].default ?? "";
}


const BLINK_ELIGIBLE: Mood[] = ["idle", "happy", "builder", "concerned"];

const moodVariants: Record<Mood, Variants> = {
  idle: {
   
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      y: [0, -3, 0, -3, 0, -2, 0],
      scale: [1, 1.015, 1, 1, 1.01, 1, 1],
      rotate: [0, 0, 0, -2, 0, 0, 2, 0],
      x: [0, 0, 0, 0, -2, 0, 2, 0],
      transition: { duration: 9, repeat: Infinity, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
  happy: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      y: [0, -8, 0, -3, 0],
      rotate: [0, -3, 3, 0],
      transition: { duration: 0.9, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
  thinking: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      rotate: [0, -5, 0, 5, 0],
      scale: [1, 1.03, 1],
      transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
  detective: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      rotate: [0, -4, 0, 2, 0],
      x: [0, -2, 2, 0],
      transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
  builder: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      y: [0, -4, 0],
      scale: [1, 1.02, 1],
      transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
  celebration: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      y: [0, -16, 0],
      rotate: [0, -7, 7, 0],
      transition: { duration: 0.55, repeat: 4, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
  sleepy: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      y: [0, 3, 0],
      scale: [1, 1.02, 1],
      transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
  cheerleader: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      y: [0, -10, 0],
      rotate: [0, 4, -4, 0],
      transition: { duration: 0.7, repeat: Infinity, repeatDelay: 0.3, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
  concerned: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: 1,
      y: [0, 1.5, 0],
      scale: [1, 0.99, 1],
      transition: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
    },
    exit: { opacity: 1, scale: 1 },
  },
};

interface CapySpriteProps {
  mood: Mood;
  size?: number;
  onClick?: () => void;
}

export function CapySprite({ mood, size = 140, onClick }: CapySpriteProps) {
  const [blinking, setBlinking] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; dragging: boolean } | null>(null);
  const [happyBurst, setHappyBurst] = useState(false);
  const prevMood = useState<{ current: Mood }>(() => ({ current: mood }))[0];

 
  useEffect(() => {
    if (mood === "happy" && prevMood.current !== "happy") {
      setHappyBurst(true);
      const t = setTimeout(() => setHappyBurst(false), 1100);
      prevMood.current = mood;
      return () => clearTimeout(t);
    }
    prevMood.current = mood;
  }, [mood, prevMood]);

  const happyBurstParticles = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        angle: (360 / 6) * i + 30,
        color: ["#F2A65A", "#7FB08F", "#E8846B", "#6BA3C5"][i % 4],
      })),
    [happyBurst],
  );

  useEffect(() => {
    if (!BLINK_ELIGIBLE.includes(mood)) return;
    let closeEyesTimeout: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setBlinking(true);
      closeEyesTimeout = setTimeout(() => setBlinking(false), 120);
    }, 4000 + Math.random() * 4000); // irregular timing within 4-8s reads more natural than a fixed beat
    return () => {
      clearInterval(interval);
      clearTimeout(closeEyesTimeout);
    };
  }, [mood]);

  const spriteName = blinking && BLINK_ELIGIBLE.includes(mood) ? "blink" : SPRITE_FOR_MOOD[mood];
  const src = spriteSrc(spriteName);

  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        angle: (360 / 8) * i,
        color: ["#F2A65A", "#7FB08F", "#E8846B", "#6BA3C5"][i % 4],
      })),
    [mood === "celebration" || mood === "cheerleader"],
  );

  
  const sparkleParticles = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        id: i,
        angle: (360 / 5) * i + 18,
      })),
    [mood === "cheerleader"],
  );

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <motion.img
        key={mood}
        src={src}
        alt={`Capy is feeling ${mood}`}
        className="pixelated cursor-pointer drop-shadow-cozy"
        style={{ width: size, height: size }}
        variants={moodVariants[mood]}
        initial="initial"
        animate="animate"
        onMouseDown={(e) => {
          if (e.button !== 0) return; // left-click only
          dragState.current = { startX: e.clientX, startY: e.clientY, dragging: false };
        }}
        onMouseMove={(e) => {
          const state = dragState.current;
          if (!state || state.dragging) return;
          const dx = e.clientX - state.startX;
          const dy = e.clientY - state.startY;
          if (Math.hypot(dx, dy) > 4) {
            state.dragging = true;
            if ("__TAURI_INTERNALS__" in window) {
              getCurrentWindow().startDragging();
            }
          }
        }}
        onMouseUp={() => {
          dragState.current = null;
        }}
        onClick={() => {
          if (dragState.current?.dragging) {
            dragState.current = null;
            return;
          }
          onClick?.();
        }}
        draggable={false}
      />
      {(mood === "celebration" || mood === "cheerleader") && (
        <div className="pointer-events-none absolute inset-0">
          {confettiParticles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const dist = size * 0.55;
            return (
              <motion.span
                key={p.id}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: p.color }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                  scale: [0.5, 1, 0.5],
                }}
                transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.4, delay: p.id * 0.04 }}
              />
            );
          })}
        </div>
      )}

      {mood === "cheerleader" && (
        <div className="pointer-events-none absolute inset-0">
          {sparkleParticles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const dist = size * 0.4;
            return (
              <motion.span
                key={p.id}
                className="absolute left-1/2 top-1/2 select-none text-sm"
                style={{ color: "#F2A65A" }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist - 6,
                  scale: [0.4, 1.1, 0.4],
                  rotate: [0, 90],
                }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.35, delay: p.id * 0.05 }}
              >
                ✦
              </motion.span>
            );
          })}
        </div>
      )}

      {/* One-shot burst (confetti + hop + wiggle) fired exactly once when
          mood transitions into happy — distinct from celebration's
          continuous loop above. */}
      <AnimatePresence>
        {happyBurst && (
          <motion.div
            key="happy-burst"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {happyBurstParticles.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const dist = size * 0.45;
              return (
                <motion.span
                  key={p.id}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                  animate={{ opacity: [0, 1, 0], x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, scale: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, delay: p.id * 0.03, ease: "easeOut" }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {mood === "thinking" && (
        <motion.span
          className="pointer-events-none absolute right-1 top-1 font-cozy text-lg text-capy-outline/70"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: [0, 1, 1, 0], y: [4, -4, -8, -14] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          ...
        </motion.span>
      )}

      {mood === "sleepy" && (
        <motion.span
          className="pointer-events-none absolute right-2 top-2 font-cozy text-lg text-capy-outline/70"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: [0, 1, 0], y: [4, -6, -14] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          Zzz
        </motion.span>
      )}
    </div>
  );
}
