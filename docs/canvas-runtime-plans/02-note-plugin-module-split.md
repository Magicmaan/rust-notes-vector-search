# 02 - Note Plugin Module Split

## Goal
Split note plugin into focused modules so interaction logic is readable, testable, and ownership boundaries are explicit.

## Current Problem
`note-plugin.ts` is oversized and intermixes target resolution, selection changes, drag math, resize solving, collision handling, and cleanup.

## Target Architecture/Behavior
- Plugin class becomes orchestration only.
- Extract modules:
  - `note-target.ts` (DOM target metadata -> note target)
  - `note-selection.ts` (single/select/toggle decisions)
  - `note-drag.ts` (preview/commit movement intent)
  - `note-resize.ts` (anchor, heading, placement solving)
  - `note-collision.ts` (shared collision helpers used by drag/resize)
  - `note-session.ts` (session lifecycle + reset)

## Implementation Steps
1. Create `runtime/plugins/note/` folder and move pure helpers first.
2. Extract selection logic with no side effects.
3. Extract drag flow (preview and commit builders).
4. Extract resize flow (anchor + constrained placement).
5. Extract session management and typed guards.
6. Keep `note-plugin.ts` as coordinator calling extracted functions.

## Type/API Changes
- Add `NoteTarget`, `NoteSelectionIntent`, `NoteDragIntent`, `NoteResizeIntent` types.
- Add `NotePluginDeps` interface receiving ports/query methods explicitly.
- No external API change for plugin registration.

## Edge Cases/Failure Modes
- Circular imports between session and movement modules.
- Hidden dependency on plugin `this.state` in extracted helpers.
- Cross-module mismatch in coordinate units.

## Test Cases + Acceptance Criteria
- Unit tests per module (selection, drag resolver, resize resolver).
- Plugin integration tests assert orchestration order only.
- Static check: each module has single concern and no runtime store import.

## Migration Notes
- Keep filenames stable at first; move one concern per commit.
- Export compatibility wrappers if needed during transition.

## Risks + Mitigations
- Risk: temporary duplication during extraction.
- Mitigation: cut-over each function immediately after extraction.

## Definition of Done
- `note-plugin.ts` reduced to orchestration.
- All logic paths covered by module tests.
- No direct cross-cutting concerns left in plugin file.
