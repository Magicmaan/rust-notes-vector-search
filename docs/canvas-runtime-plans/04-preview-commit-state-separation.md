# 04 - Preview vs Commit State Separation

## Goal
Separate transient interaction preview state from persisted element state so rollback and commit are deterministic.

## Current Problem
Preview and commit often use the same bulk element update path, making cancel/rollback behavior fragile and causing visual/store coupling.

## Target Architecture/Behavior
- Runtime holds `previewSession` state keyed by session id.
- Preview ops update transient overlay geometry only.
- Commit ops persist to adapter store.
- Rollback clears preview session and restores baseline.

## Implementation Steps
1. Add runtime `previewSessions` map with baseline + preview payload.
2. Change `element.previewBulk` executor to write preview map (not persisted store).
3. Update renderer path to merge preview-overrides for display.
4. Keep `element.commitBulk` as sole persistent element write path.
5. Ensure `rollbackSession` clears preview and restores visible baseline.

## Type/API Changes
- Add `PreviewSessionId` and `PreviewElementOverride` types.
- Add optional `sessionId` to preview/rollback operations.
- Add runtime snapshot field for preview diagnostics.

## Edge Cases/Failure Modes
- Missing session id on preview op.
- Overlapping sessions targeting same element.
- Commit without existing preview session.

## Test Cases + Acceptance Criteria
- Preview drag/resizes render without persisted store changes.
- Cancel removes preview and keeps original store geometry.
- Commit persists exactly resolved geometry and clears preview state.

## Migration Notes
- Maintain current UX while changing persistence boundary.
- Keep one-session-per-pointer rule initially.

## Risks + Mitigations
- Risk: renderer complexity from overlay merge.
- Mitigation: isolate merge in one selector/hook.

## Definition of Done
- Preview ops are fully ephemeral.
- Commit/rollback paths are deterministic and tested.
