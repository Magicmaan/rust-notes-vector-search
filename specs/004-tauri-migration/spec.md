# Feature Specification: Electron-to-Tauri Migration

**Feature Branch**: `004-tauri-migration`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "Convert this Electron React app into a modern Tauri app, keep behavior the same, and place migrated project in `../rust-notes-vector-search`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run app in Tauri dev mode (Priority: P1)

As a developer, I can run the migrated app with Tauri commands and see the same UI behavior as the Electron app.

**Why this priority**: The migration is not useful unless the app can start and function in Tauri.

**Independent Test**: Run Tauri dev command from the migrated directory and verify main note UI loads with core interactions.

**Acceptance Scenarios**:

1. **Given** the migrated project in `../rust-notes-vector-search`, **When** I run the Tauri dev command, **Then** the app window opens and renders the React app.
2. **Given** the app is running in Tauri, **When** I perform existing core note interactions, **Then** behavior matches current Electron build.

---

### User Story 2 - Preserve project layout and frontend code continuity (Priority: P1)

As a maintainer, I can find the same app directories and frontend code organization in the migrated project.

**Why this priority**: User explicitly requested keeping directories and overall structure consistent.

**Independent Test**: Compare source tree roots and confirm existing directories are retained or mapped one-to-one, with minimal framework-specific additions.

**Acceptance Scenarios**:

1. **Given** the source repository structure, **When** migration completes, **Then** frontend directories remain intact in the new Tauri project.
2. **Given** Electron-only files, **When** migration completes, **Then** they are removed or replaced by Tauri equivalents without changing feature modules.

---

### User Story 3 - Build distributable binaries with modern Tauri tooling (Priority: P2)

As a developer, I can build desktop bundles using current Tauri v2 workflows.

**Why this priority**: Production readiness requires modern packaging.

**Independent Test**: Run Tauri build command and confirm platform bundle artifacts are produced.

**Acceptance Scenarios**:

1. **Given** Rust and Node dependencies are installed, **When** I run the Tauri build command, **Then** a desktop bundle is generated.

### Edge Cases

- Rust toolchain is missing locally.
- Existing Electron-specific APIs have no direct Tauri equivalent.
- Path assumptions break when moving project to `../rust-notes-vector-search`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a migrated project at `../rust-notes-vector-search`.
- **FR-002**: System MUST preserve existing React/Tailwind/Zustand application behavior and modules.
- **FR-003**: System MUST replace Electron runtime/bootstrap with Tauri v2 runtime/bootstrap.
- **FR-004**: System MUST update scripts so development and build use Tauri commands.
- **FR-005**: System MUST remove Electron-only dependencies/configs from migrated project.
- **FR-006**: System MUST include minimal required Tauri Rust backend and configuration files.
- **FR-007**: System MUST keep directory organization for existing app code substantially unchanged.
- **FR-008**: System MUST document migration steps and run/build commands in a quickstart.

### Key Entities *(include if feature involves data)*

- **MigrationManifest**: Mapping of Electron files/dependencies to Tauri replacements or removals.
- **TauriRuntimeConfig**: `src-tauri` config and capabilities governing app lifecycle and permissions.
- **FrontendEntrypointContract**: Agreed dev/build integration between Vite frontend and Tauri runtime.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Migrated project starts successfully with Tauri dev command on first run.
- **SC-002**: 100% of existing core user flows validated in smoke test behave the same as Electron baseline.
- **SC-003**: Directory comparison shows existing feature directories retained (except runtime-specific Electron files).
- **SC-004**: Tauri build command completes and emits target platform artifact(s).

## Assumptions

- No net-new features are added during migration.
- Existing frontend code remains TypeScript + React + Vite.
- Current OS-level integrations are minimal and can be mapped to default Tauri capabilities.
- Migration output is a sibling directory (`../rust-notes-vector-search`) and does not rewrite this repository in place.
