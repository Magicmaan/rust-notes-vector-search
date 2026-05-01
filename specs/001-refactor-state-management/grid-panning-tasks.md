# Grid Panning Tasks — Space + Drag

Purpose: Implement canvas panning when holding Space and dragging. While panning, all page pointer interactions must be disabled (mirror `inert` behavior) and note/preview drag interactions must be blocked. Use CSS variables for transform and avoid React rerenders while dragging.

## Checklist (execution-ordered)

- [ ] T001 Design pan-mode API & state in app/providers/editor/slices/viewportSlice.ts
- [ ] T002 Add `isPanning`, `panX`, `panY` to app/providers/editor/slices/viewportSlice.ts
- [ ] T003 Add `startPan` / `updatePan` / `endPan` actions and `selectIsPanning` selector in app/providers/editor/slices/viewportSlice.ts
- [ ] T004 Add CSS variables `--grid-offset-x` and `--grid-offset-y` with defaults in app/styles/globals.css
- [ ] T005 [P] Apply `transform: translate3d(var(--grid-offset-x), var(--grid-offset-y), 0)` to the grid container in app/components/canvas/grid.tsx
- [ ] T006 [P] Implement a DOM pan controller (rAF) that updates CSS variables directly (no React rerenders) in app/components/canvas/panController.ts
- [ ] T007 Implement spacebar hold listener (keydown/keyup/blur) to toggle pan mode in app/components/canvas/background.tsx
- [ ] T008 Implement `pointerdown` / `pointermove` / `pointerup` with pointer capture on the canvas background and forward deltas to the pan controller in app/components/canvas/background.tsx
- [ ] T009 Toggle `inert` (and fallback `pointer-events: none` / `aria-hidden`) on the app root (`#app`) while panning in app/components/canvas/background.tsx
- [ ] T010 [P] Early-return / disable note and preview drag start logic when `isPanning` is true in app/components/note/preview.tsx and app/components/note/editor.tsx
- [ ] T011 [P] Ensure all preview-drag interactions are disabled during grid pan (tight checks in app/components/note/preview.tsx)
- [ ] T012 Throttle pointer updates: accumulate deltas and flush via rAF in app/components/canvas/panController.ts to avoid React rerenders
- [ ] T013 Add manual QA checklist and smoke scenarios to specs/001-refactor-state-management/quickstart.md (start/stop pan, note edit while panning, preview drag blocked)
- [ ] T014 Document changes and usage in CHANGELOG.md and README.md

## Notes

- Use `requestAnimationFrame` in the pan controller and set CSS variables on the grid container's style (`element.style.setProperty('--grid-offset-x', '12px')`) to avoid re-rendering the grid on every pointer move.
- Use pointer capture so pan gestures survive fast moves and leaving the element.
- When toggling `inert` on `#app`, also set `aria-hidden` or `pointer-events` fallback for environments without inert support.
- Ensure note drag/preview handlers check `selectIsPanning()` and bail out early to prevent collision.
