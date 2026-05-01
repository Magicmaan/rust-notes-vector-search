# Migration Contract

## Scope Contract
- Preserve existing frontend directories and feature modules.
- Replace desktop runtime layer from Electron to Tauri v2.
- Deliver migrated project in `../rust-notes-vector-search`.

## Runtime Contract
- `tauri dev` must launch a desktop window and load the frontend app.
- `tauri build` must produce bundle artifacts.
- Existing core user flows must remain behaviorally equivalent.

## File-System Contract
- Keep app code layout unchanged where possible.
- Electron-only files are removed or replaced by Tauri equivalents.
- `src-tauri/` is added with standard Tauri config and Rust entrypoint.

## Script Contract
- Project scripts expose explicit Tauri dev/build commands.
- Frontend build/dev commands remain available for standalone web testing.
