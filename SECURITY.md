# Security

## API keys

CapyCode never stores provider API keys in a plaintext file, SQLite
database, or environment file. Keys are stored via the OS keychain
(macOS Keychain, Windows Credential Manager, Linux Secret Service) through
the `keyring` crate — see `src-tauri/src/secrets.rs`.

On Linux, this requires a running secret-service daemon (e.g.
`gnome-keyring`, `kwallet`). On minimal/headless setups without one,
CapyCode degrades gracefully with an in-chat error rather than crashing —
see the try/catch in `src/lib/ai/provider.ts`.

## Content Security Policy

The Tauri window runs under an explicit CSP (`src-tauri/tauri.conf.json`)
that only permits network requests to the app itself and
`api.openai.com`. If you add a new AI provider, add its API host to
`connect-src` in that policy — don't disable the CSP to make it work.

## Capabilities

Tauri v2 gates plugin commands (SQL, filesystem, etc.) behind an explicit
capabilities file (`src-tauri/capabilities/default.json`). If you add a
new plugin, you must add its permission identifiers there or the command
will silently fail at runtime.

## Reporting a vulnerability

Open a private security advisory on GitHub rather than a public issue.
