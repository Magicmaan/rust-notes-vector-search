# 08 - Legacy Interaction Cleanup

## Goal
Remove dead, commented, and transitional interaction code so ownership is unambiguous and readability improves.

## Current Problem
Legacy blocks and duplicate paths remain in marquee/note/element layers, making it unclear which logic is live.

## Target Architecture/Behavior
- Single live owner for each behavior.
- No commented-out legacy interaction implementations in runtime plugin files.
- No duplicate element-level interaction handlers for note selection/move/resize.

## Implementation Steps
1. Delete commented legacy interaction blocks in `marquee-plugin.ts` and note paths.
2. Remove unused types and helpers no longer referenced.
3. Remove stale operation aliases and branch leftovers.
4. Add lint/static rule or script to prevent large commented legacy logic blocks.

## Type/API Changes
- Remove dead types from plugin/runtime type files.
- Tighten exported surface to used symbols only.

## Edge Cases/Failure Modes
- Accidentally deleting still-used helper.
- Hidden usage through dynamic import.

## Test Cases + Acceptance Criteria
- Typecheck + tests pass after cleanup.
- File-level grep confirms no dead legacy blocks remain in runtime plugin files.
- Behavior parity with regression matrix maintained.

## Migration Notes
- Cleanup should happen after test matrix is in place.
- Prefer incremental cleanup by subsystem.

## Risks + Mitigations
- Risk: accidental behavior removal.
- Mitigation: cleanup in small PRs gated by interaction tests.

## Definition of Done
- Runtime interaction files are concise and live-only.
- No duplicate behavior owners remain.
