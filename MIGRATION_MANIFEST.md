# Migration Manifest

## Target
- `../rust-notes-vector-search`

## Removed Electron Files
- `electron.vite.config.ts`
- `electron-builder.yml`

## Removed Electron Dependencies
- `electron`
- `electron-builder`
- `electron-devtools-installer`
- `electron-vite`
- `@electron-toolkit/preload`
- `@electron-toolkit/utils`
- `@electron-toolkit/eslint-config-prettier`
- `@electron-toolkit/eslint-config-ts`
- `@electron-toolkit/tsconfig`
- `cross-env`

## Added Tauri Files
- `src-tauri/**`
- `vite.config.ts`

## Added Tauri Dependencies
- `@tauri-apps/api`
- `@tauri-apps/cli`

## Behavior Decisions
- Kept frontend structure unchanged (`app/**`, `lib/**`).
- Kept settings persistence on React/client side with `localStorage`.
- No Rust-side event/command implementation added for settings.

## Validation
- `npm run web:build` ✅
- `cargo check` ✅
- `cargo build` ✅
- `npm run tauri:build` ⚠️ partial: app built, `.deb` and `.rpm` bundled, AppImage bundling failed (`linuxdeploy`).
