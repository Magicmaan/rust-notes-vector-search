# Tasks: Electron-to-Tauri Migration

**Input**: Design docs from `specs/004-tauri-migration/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [ ] T001 Create target directory `../rust-notes-vector-search` and copy project files excluding `.git`, `node_modules`, build outputs (`dist`, `out`).
- [ ] T002 Verify target project boots as a copied baseline (`npm install` succeeds).
- [ ] T003 Update/verify ignore files in target (`.gitignore`, `.prettierignore`, eslint ignore coverage).

## Phase 2: Tests First (Smoke Contracts)

- [ ] T004 Define migration validation checklist doc in target (`MIGRATION_CHECKLIST.md`) covering run, core flows, and build.
- [ ] T005 Add script-level smoke validation commands in target package scripts for `tauri:dev` and `tauri:build` placeholders.

## Phase 3: Core Migration

- [ ] T006 Remove Electron runtime dependencies and Electron-specific scripts from target `package.json`.
- [ ] T007 Add Tauri v2 dependencies/devDependencies and scripts in target `package.json`.
- [ ] T008 Remove Electron config files in target (`electron.vite.config.ts`, `electron-builder.yml`).
- [ ] T009 Initialize Tauri v2 in target and generate `src-tauri/` scaffold.
- [ ] T010 Configure `src-tauri/tauri.conf.json` build hooks (`beforeDevCommand`, `beforeBuildCommand`, `devUrl`, `frontendDist`) to current Vite flow.
- [ ] T011 Update TypeScript ambient references that are Electron-specific (`app/index.d.ts`, `lib/main/index.d.ts`).
- [ ] T012 Replace or disable Electron-only main/preload runtime code paths while keeping frontend app directory structure unchanged.

## Phase 4: Integration

- [ ] T013 Install target dependencies and run `npm run tauri:dev` smoke launch.
- [ ] T014 Run `npm run tauri:build` to verify bundle generation.
- [ ] T015 Update target README with Tauri run/build commands and migration notes.

## Phase 5: Polish

- [ ] T016 Run lint/typecheck/build checks in target and fix critical issues introduced by migration.
- [ ] T017 Produce migration manifest document in target (`MIGRATION_MANIFEST.md`) listing removed Electron files/deps and added Tauri files/deps.
- [ ] T018 Final pass against `specs/004-tauri-migration/contracts/migration-contract.md` and mark completion summary.
