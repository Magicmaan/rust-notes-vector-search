# Quickstart: Tauri Migration Execution

## 1) Create target project directory
- Target: `../rust-notes-vector-search`
- Copy current project files into target (excluding build outputs and `.git`).

## 2) Remove Electron runtime/tooling in target
- Remove Electron-specific config and scripts (`electron.vite.config.ts`, `electron-builder.yml`, Electron scripts/deps).

## 3) Initialize Tauri v2 in target
- Run `npx @tauri-apps/cli@latest init` in `../rust-notes-vector-search`.
- Configure:
  - `dev-url`: Vite local URL
  - `frontend-dist`: Vite build output
  - `before-dev-command`: frontend dev command
  - `before-build-command`: frontend build command

## 4) Add/update npm scripts
- Add `tauri:dev` and `tauri:build` scripts.
- Ensure existing frontend commands still work.

## 5) Run smoke checks
- Run Tauri dev and verify existing note flows.
- Run Tauri build and verify artifacts are generated.

## 6) Document migration map
- Record removed Electron files, added Tauri files, and dependency changes.
