# Research: Electron → Tauri v2 Migration

## Decision 1: Use Tauri v2 (`@tauri-apps/cli` + `@tauri-apps/api` 2.10.1)
- **Decision**: Standardize migration on Tauri v2 toolchain.
- **Rationale**: Current published npm versions resolve to 2.10.1 for both CLI and API, giving a modern baseline.
- **Alternatives considered**:
  - Stay on Electron (rejected: does not meet migration goal)
  - Use older Tauri versions (rejected: outdated)

## Decision 2: Initialize Tauri in migrated directory and wire existing Vite app
- **Decision**: Create `../rust-notes-vector-search`, copy app code, then run Tauri init in that directory.
- **Rationale**: `tauri init` supports existing directories and explicitly configures `dev-url`, `frontend-dist`, and pre-dev/build commands.
- **Alternatives considered**:
  - Greenfield Tauri template then copy files later (higher merge risk)
  - In-place conversion of this repo (rejected by user constraint)

## Decision 3: Keep frontend structure unchanged; replace only runtime shell
- **Decision**: Preserve `app/` and feature module directories; remove Electron bootstrapping files and add `src-tauri/`.
- **Rationale**: Satisfies requirement to keep directories and behavior while minimizing regressions.
- **Alternatives considered**:
  - Large frontend refactor during migration (rejected: out of scope)

## Decision 4: Use Tauri command lifecycle for dev/build
- **Decision**: Use scripts based on `tauri dev` and `tauri build`, with Vite commands as `before-dev-command` and `before-build-command`.
- **Rationale**: Matches current Tauri CLI workflow and keeps existing frontend build pipeline.
- **Alternatives considered**:
  - Custom ad-hoc shell wrappers (rejected: unnecessary complexity)

## Decision 5: Minimal permissions/capabilities first
- **Decision**: Start with minimal Tauri capabilities and add only what existing app needs.
- **Rationale**: Tauri security model favors least privilege and reduces attack surface.
- **Alternatives considered**:
  - Broad permissions upfront (rejected: weaker security posture)
