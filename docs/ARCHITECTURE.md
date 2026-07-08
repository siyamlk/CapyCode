# Architecture Overview

## High level

```
┌─────────────────────────────┐
│           React UI           │
│  CapySprite / ChatPanel /... │
└──────────────┬────────────────┘
               │ zustand store (capyStore.ts)
               │ dispatch(MoodEvent) -> nextMood()
┌──────────────▼────────────────┐
│        Mood FSM (pure fn)      │
│        lib/moodMachine.ts      │
└──────────────┬────────────────┘
               │ AI replies via provider abstraction
┌──────────────▼────────────────┐
│     lib/ai/provider.ts         │
│  OpenAI now; Anthropic/Gemini/ │
│  Ollama pluggable later        │
└──────────────┬────────────────┘
               │ Tauri invoke() for secrets/SQLite
┌──────────────▼────────────────┐
│         Rust backend           │
│   secrets.rs (OS keychain)     │
│   tauri-plugin-sql (SQLite)    │
└─────────────────────────────────┘
```

## Why a pure-function FSM

`nextMood(current, event) -> Mood` in `moodMachine.ts` has zero
dependencies on React or Tauri. That means:
- It's trivially unit-testable
- Any future surface (VS Code extension, CLI) can reuse the exact same
  personality logic without re-implementing it
- Adding a new mood or transition never risks breaking the UI

## Why secrets live in Rust, not SQLite

API keys are stored via the OS keychain (`keyring` crate) rather than in
the SQLite database, so they never end up in a plaintext file or an
accidentally-committed `.db`.

## Extending with a new AI provider

1. Implement the `AIProvider` interface in `src/lib/ai/provider.ts`
2. Register it in the `providers` map
3. No other file needs to change — `ChatPanel.tsx` only calls
   `getProvider(id)`
