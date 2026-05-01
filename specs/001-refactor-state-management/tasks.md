# Tasks: Note Drag and Snap Redesign

**Input**: Design documents from `/specs/001-refactor-state-management/`
**Prerequisites**: `spec.md` (required), `plan.md` (required), `research.md`, `data-model.md`, `contracts/note-drag-interactions.md`, `quickstart.md`

**Tests**: No test-first automation tasks are included because TDD/automated tests were not explicitly requested.

**Organization**: Tasks are grouped by user-story-like slices so each behavior increment is independently verifiable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare safe scaffolding for drag lifecycle redesign without changing behavior yet.

- [ ] T001 Add temporary drag lifecycle debug logger helper in app/components/note/preview.tsx
- [ ] T002 [P] Add drag-owner debug signal fields in app/providers/editor/slices/uiStateSlice.ts
- [ ] T003 [P] Expose drag-owner debug signal selectors in app/providers/editor/hooks/useUIStateSlice.ts
- [ ] T004 Document redesign scope and rollback criteria in specs/001-refactor-state-management/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish a single authoritative state machine for note drag lifecycle and cleanup guarantees.

**CRITICAL**: User-story phases must not start before this phase is complete.

- [X] T005 Define note drag lifecycle states (`idle`, `pressed`, `dragging`, `finalizing`) in app/components/note/preview.tsx
- [X] T006 Implement a single `finalizeDrag` function with idempotent guard in app/components/note/preview.tsx
- [X] T007 Implement centralized cleanup utility (RAF, listeners, pointer refs, UI flags) in app/components/note/preview.tsx
- [X] T008 [P] Add unmount safeguard to force `finalizeDrag(cancel)` in app/components/note/preview.tsx
- [X] T009 [P] Normalize movement threshold evaluation into one place in app/components/note/preview.tsx

**Checkpoint**: Only one release path can commit/reset drag, and cleanup is guaranteed exactly once.

---

## Phase 3: User Story 1 - Note Drag Commits and Snaps Reliably (Priority: P1) MVP

**Goal**: Dragging a note always finalizes on release and either commits snapped coordinates or resets cleanly.

**Independent Test**: Drag any note and release once; note must snap/commit immediately or revert immediately, never wait for a second click.

- [X] T010 [US1] Rework pointer-down transition to `pressed` with deterministic capture ownership in app/components/note/preview.tsx
- [X] T011 [US1] Rework pointer-move transition to `dragging` and visual preview-only updates in app/components/note/preview.tsx
- [X] T012 [US1] Route element pointer-up to `finalizeDrag(commit)` only in app/components/note/preview.tsx
- [X] T013 [US1] Route element pointer-cancel/lost-capture to `finalizeDrag(cancel)` only in app/components/note/preview.tsx
- [X] T014 [US1] Route window pointer-up/pointer-cancel fallbacks to same finalize path in app/components/note/preview.tsx
- [X] T015 [US1] Ensure no stale inline transform is reapplied after successful store commit in app/components/note/preview.tsx
- [X] T016 [US1] Keep snap calculation and occupancy validation strictly in commit step in app/components/note/preview.tsx

**Checkpoint**: Note drag no longer enters stuck tracking mode and no delayed snapback occurs.

---

## Phase 4: User Story 2 - Prevent Note Drag and Canvas Pan Collisions (Priority: P1)

**Goal**: Note drag and canvas pan are mutually exclusive, with deterministic ownership per pointer interaction.

**Independent Test**: Starting drag from a note never pans canvas; starting drag from empty canvas never drags a note.

- [X] T017 [US2] Enforce note wrapper target classification (`.note`) for arbitration in app/components/note/preview.tsx
- [X] T018 [US2] Enforce pointer event isolation from note drag handlers in app/components/note/preview.tsx
- [X] T019 [US2] Tighten canvas pan start guard to ignore note-origin targets in app/components/canvas/grid.tsx
- [X] T020 [US2] Block canvas pan updates while UI note-drag flag is active in app/components/canvas/grid.tsx
- [X] T021 [US2] Add release/cancel cleanup for canvas pan ownership in app/components/canvas/grid.tsx

**Checkpoint**: No dual movement of note and canvas for the same pointer gesture.

---

## Phase 5: User Story 3 - Preserve Existing Placement Semantics (Priority: P2)

**Goal**: Redesign does not regress grid snapping, occupancy checks, or invalid-drop behavior.

**Independent Test**: Free-cell drops commit; occupied/negative drops revert; repeated drags remain stable.

- [X] T022 [US3] Verify snapped grid coordinate commit uses current zoom-adjusted deltas in app/components/note/preview.tsx
- [X] T023 [US3] Verify occupied destination rejection path resets preview state in app/components/note/preview.tsx
- [X] T024 [US3] Verify negative coordinate rejection path resets preview state in app/components/note/preview.tsx
- [X] T025 [P] [US3] Verify `updateElement` path preserves element identity and triggers rerender in app/providers/editor/slices/elementsSlice.ts
- [X] T026 [P] [US3] Verify note component receives updated element after commit in app/components/note/index.tsx

**Checkpoint**: Existing grid behavior is preserved after drag architecture rewrite.

---

## Phase 6: Polish and Verification

**Purpose**: Remove temporary diagnostics and lock in manual verification evidence.

- [X] T027 [P] Remove temporary drag debug logs and instrumentation from app/components/note/preview.tsx
- [X] T028 [P] Remove temporary drag-owner debug signals if not needed from app/providers/editor/slices/uiStateSlice.ts
- [ ] T029 Run manual interaction matrix (A-H scenarios) and record outcomes in specs/001-refactor-state-management/quickstart.md
- [X] T030 Capture final redesign decisions and bug root-cause notes in specs/001-refactor-state-management/plan.md

---

## Automated Tests and Performance Tasks

Purpose: Add automated verification and performance measurement tasks to ensure repeatable validation of success criteria and non-functional targets.

- [ ] T031 Add unit tests for `finalizeDrag`/`finalizeSession` idempotency and cleanup (app/components/note/preview.test.tsx). Verify listeners, RAF cancel, pointer refs cleared.
- [ ] T032 Add integration tests for snap/commit/revert scenarios (valid drop, occupied drop, negative drop) using Playwright or React Testing Library + DOM emulation (tests/integration/snap-commit.spec.ts).
- [ ] T033 Add performance benchmark harness to measure frame update latency and FPS during drag with synthetic note counts (100/200/500). Capture p50/p95/p99 frame times and record results (tools/perf/drag-bench/).
- [ ] T034 Add DPR/resize automated checks to validate background coverage and zoom/pan behavior across devicePixelRatio values (tests/integration/dpr-resize.spec.ts).

---

## Dependencies and Execution Order

### Phase Dependencies

- Phase 1: no dependencies.
- Phase 2: depends on Phase 1 and blocks all story work.
- Phase 3: depends on Phase 2.
- Phase 4: depends on Phase 2, can run after Phase 3 starts.
- Phase 5: depends on Phases 3 and 4.
- Phase 6: depends on all implementation phases.

### Story Dependencies

- US1 (P1): first deliverable; required before reliable QA.
- US2 (P1): required to prevent drag ownership collisions.
- US3 (P2): hardening and regression prevention after core rewrite.

### Within Each Story

- Route handlers to finalize path before tuning visual preview.
- Validate commit semantics before deleting instrumentation.
- Complete cleanup invariants before final verification.

---

## Parallel Opportunities

- T002 and T003 in setup can run in parallel.
- T008 and T009 in foundational can run in parallel after T006.
- T025 and T026 in US3 can run in parallel.
- T027 and T028 in polish can run in parallel.

---

## Parallel Example: US2

```bash
Task: "T018 [US2] Enforce pointer event isolation from note drag handlers in app/components/note/preview.tsx"
Task: "T019 [US2] Tighten canvas pan start guard to ignore note-origin targets in app/components/canvas/grid.tsx"
Task: "T020 [US2] Block canvas pan updates while UI note-drag flag is active in app/components/canvas/grid.tsx"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete US1 to restore immediate snap/commit correctness.
3. Validate against the original bug report before continuing.

### Incremental Delivery

1. Add US2 to remove note/canvas collisions.
2. Add US3 to preserve occupancy and bounds behavior.
3. Complete polish and manual matrix validation.

### Suggested Team Split

1. Engineer A: note state machine and finalize path (T005-T016).
2. Engineer B: canvas drag arbitration (T017-T021).
3. Engineer C: regression hardening and verification docs (T022-T030).
