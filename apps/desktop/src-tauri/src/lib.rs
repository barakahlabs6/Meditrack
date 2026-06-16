use std::fs;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn export_patient_record(
    app: tauri::AppHandle,
    patient_name: String,
    data: String,
) -> Result<String, String> {
    let (tx, rx) = std::sync::mpsc::channel::<Option<std::path::PathBuf>>();

    app.dialog()
        .file()
        .set_title("Export Patient Record")
        .set_file_name(format!("{}-record.json", patient_name.replace(' ', "-")))
        .add_filter("JSON", &["json"])
        .save_file(move |path| {
            tx.send(path.map(|p| p.as_path().unwrap().to_path_buf())).unwrap();
        });

    match rx.recv().map_err(|e| e.to_string())? {
        Some(path) => {
            fs::write(&path, data).map_err(|e| e.to_string())?;
            Ok(format!("Saved to {}", path.display()))
        }
        None => Err("Export cancelled".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![export_patient_record])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
