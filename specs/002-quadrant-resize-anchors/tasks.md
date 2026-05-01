# Tasks: Quadrant-Based Note Resize Anchors

## Phase 1: Setup

- [x] T001 Add resize-anchor model to `useResizeInteraction.ts` session state.
- [x] T002 Add anchor resolution helper (quadrant-based from pointer start location).

## Phase 2: Core Resize Logic

- [x] T003 Implement anchor-aware candidate geometry calculation (x/y/width/height in pixels).
- [x] T004 Update live RAF visual rendering to include offset updates for left/top anchored resizes.
- [x] T005 Update finalize commit logic to snap and commit `x/y/width/height` based on anchor.
- [x] T006 Preserve minimum size constraints without reintroducing max-size regressions.

## Phase 3: Validation

- [x] T007 Run lint/type checks for touched files.
- [x] T008 Verify no additional file changes are required for routing/UI to preserve current behavior.
