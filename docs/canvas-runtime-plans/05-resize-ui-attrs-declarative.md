# 05 - Declarative Resize UI Metadata

## Goal
Remove imperative DOM queries for resize attributes and drive resize UI metadata declaratively from runtime state.

## Current Problem
Runtime currently uses DOM query selectors for `data-resizing` / `data-resize-heading`, which is brittle and bypasses React data flow.

## Target Architecture/Behavior
- Runtime stores `resizeUiState` keyed by `elementId`.
- Element wrappers receive resize metadata from a selector/hook.
- No `document.querySelector` in runtime executor.

## Implementation Steps
1. Add runtime-managed `resizeUiState` structure.
2. Change `ui.setResizeAttrs` executor to update runtime state only.
3. Expose metadata through `useCanvasRuntime` snapshot or dedicated hook.
4. Update `CanvasElementBase` to apply data attributes from runtime metadata.
5. Remove old querySelector code paths.

## Type/API Changes
- Add `ResizeUiState` and `ResizeHeading` types.
- Extend runtime snapshot with `resizeUiById` (or equivalent selector contract).

## Edge Cases/Failure Modes
- Metadata not cleared on cancel/blur/unmount.
- Multiple notes resizing concurrently.
- Missing note wrapper at render time.

## Test Cases + Acceptance Criteria
- Resize attrs update through React render cycle only.
- Cancel/blur always clears attrs.
- No DOM query usage remains in runtime/plugins.

## Migration Notes
- Keep same data attribute names for CSS compatibility.
- Migrate one attribute at a time if needed.

## Risks + Mitigations
- Risk: extra rerenders from metadata updates.
- Mitigation: per-element selector memoization.

## Definition of Done
- Runtime has zero imperative DOM queries for resize attrs.
- Element wrapper attrs are fully declarative and tested.
