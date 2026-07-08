//! Stores provider API keys (Groq, OpenAI, Gemini, ...) in the OS keychain
//! (Keychain on macOS, Credential Manager on Windows, Secret Service on
//! Linux) rather than in a plaintext config file or SQLite.

use keyring::Entry;

const SERVICE: &str = "dev.capycode.app";

#[tauri::command]
pub fn get_secret(key: String) -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_secret(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}
