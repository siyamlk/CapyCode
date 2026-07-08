export type Mood =
  | "idle"
  | "happy"
  | "thinking"
  | "detective"
  | "builder"
  | "celebration"
  | "sleepy"
  | "cheerleader"
  | "concerned";


export const CONTEXT_MOODS: Mood[] = ["idle", "detective", "builder", "concerned"];
export function isContextMood(mood: Mood): boolean {
  return CONTEXT_MOODS.includes(mood);
}

export type MoodEvent =
  | { type: "BUG_REPORTED" }
  | { type: "BUG_RESOLVED" }
  | { type: "BUILDER_TOPIC" }
  | { type: "USER_FRUSTRATED" }
  | { type: "CONVERSATION_LIGHTENED" }
  | { type: "TOPIC_CHANGED" }
  | { type: "MEANINGFUL_ACHIEVEMENT" }
  | { type: "MAJOR_MILESTONE" }
  | { type: "AI_GENERATING" }
  | { type: "AI_RESPONDED" }
  | { type: "API_ERROR" }
  | { type: "USER_IDLE_LONG" }
  | { type: "USER_RETURNED" }
  | { type: "CONVERSATION_STARTED" }
  | { type: "OVERLAY_ENDED" };

export const SPRITE_FOR_MOOD: Record<Mood, string> = {
  idle: "default",
  happy: "happy",
  thinking: "thinking",
  detective: "detective",
  builder: "builder",
  celebration: "celebration",
  sleepy: "sleepy",
  cheerleader: "cheerleader",
  concerned: "default",
};


export const DIALOGUE_FOR_MOOD: Record<Mood, string[]> = {
  idle: [
    "*sips tea*",
    "Nice coding weather.",
    "I'm right here if you need me.",
    "*hums quietly*",
    "This is cozy.",
    "*watches the cursor peacefully*",
    "Hmm, what are we building today?",
  ],
  happy: ["We did it!", "*happy squeak*", "Nice progress!", "That was fun!"],
  thinking: ["Hmm...", "Let me think...", "*tilts head*", "Interesting..."],
  detective: [
    "Hmm... something's suspicious.",
    "*adjusts detective hat*",
    "I spotted a clue.",
    "This bug is sneaky.",
    "Let's investigate.",
  ],
  builder: [
    "Ooo... we're building something!",
    "*rolls out blueprint*",
    "I've got ideas.",
    "Let's make it sturdy.",
    "*checks the blueprint again*",
  ],
  celebration: ["WE DID IT!!", "*happy wiggle* That was clever!"],
  sleepy: [
    "*dozes off*",
    "*yawns softly*",
    "*curls up and naps*",
    "I'll be here whenever you're ready.",
    "Taking a little break?",
    "*stretches sleepily*",
    "*eyes drift shut* ...zzz...",
  ],
  cheerleader: ["YOU DID IT!", "I'm proud of you!", "Let's go!", "That deserves a celebration!"],

  concerned: [
    "I'm here.",
    "Want to take this one step at a time?",
    "*slides over a warm cup of tea*",
    "We don't have to solve everything at once.",
  ],
};


export const OVERLAY_DURATION_MS: Partial<Record<Mood, number>> = {
  happy: 2500,
  celebration: 1500,
  cheerleader: 2500,
};
const API_ERROR_OVERLAY_MS = 2500;
export { API_ERROR_OVERLAY_MS };

export function pickLine(mood: Mood): string {
  const lines = DIALOGUE_FOR_MOOD[mood];
  return lines[Math.floor(Math.random() * lines.length)];
}