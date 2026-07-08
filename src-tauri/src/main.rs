// CapyCode desktop shell.
// Keeps the Rust side thin: window chrome, OS keychain access for API keys,
// and the SQLite plugin. All app logic lives in the React frontend.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod secrets;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            secrets::get_secret,
            secrets::set_secret,
        ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            println!("CapyCode waking up... *stretches* good morning!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running CapyCode");
}
