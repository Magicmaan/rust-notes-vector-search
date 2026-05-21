# Tasks: Canvas Dot Grid Background Migration

**Input**: Design documents from `/specs/005-grid-background-canvas/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated test tasks were explicitly requested in the specification; include manual validation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare background module structure for canvas rendering

- [X] T001 Create background canvas renderer module `app/components/canvas/elements/background/canvas-dot-grid.ts`
- [X] T002 Create style token parser module `app/components/canvas/elements/background/style-tokens.ts`
- [X] T003 Create canvas sizing/redraw utilities module `app/components/canvas/elements/background/canvas-runtime.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared primitives required by all user stories

- [X] T004 Implement `BackgroundCanvasState`, `DotStyleTokens`, and `BackgroundRenderMetrics` types in `app/components/canvas/elements/background/canvas-dot-grid.ts`
- [X] T005 [P] Implement CSS variable parsing + fallback logic in `app/components/canvas/elements/background/style-tokens.ts`
- [X] T006 [P] Implement DPR-aware canvas sizing helper in `app/components/canvas/elements/background/canvas-runtime.ts`
- [X] T007 Implement transform-aware metric derivation (spacing/phase/opacity) in `app/components/canvas/elements/background/canvas-dot-grid.ts`
- [X] T008 Implement rAF-throttled redraw scheduler + cleanup API in `app/components/canvas/elements/background/canvas-runtime.ts`

**Checkpoint**: Canvas drawing primitives and runtime utilities are ready.

---

## Phase 3: User Story 1 - Visual dot grid parity with current styling (Priority: P1) 🎯 MVP

**Goal**: Replace CSS dot layer with canvas-drawn dots that match theme tokens and remove visual artifacts.

**Independent Test**: Open editor and verify crisp, uniform dots at default zoom/pan and theme token parity.

### Implementation for User Story 1

- [X] T009 [US1] Implement `CanvasGridBackgroundCanvas` React component in `app/components/canvas/elements/background/canvas-grid-background-canvas.tsx`
- [X] T010 [US1] Integrate canvas draw call and token parsing in `app/components/canvas/elements/background/canvas-grid-background-canvas.tsx`
- [X] T011 [US1] Replace dot div layer with canvas component in `app/components/canvas/elements/background/index.tsx`
- [X] T012 [US1] Update `app/styles/canvas-background.css` to remove `.canvas-grid-background__dots` rendering and keep base/vignette decorative layers
- [ ] T013 [US1] Manual validation for SC-001 in `specs/005-grid-background-canvas/quickstart.md` (record visual parity/artifact check steps)

**Checkpoint**: Dot rendering is canvas-based and visually consistent.

---

## Phase 4: User Story 2 - Dot grid tracks pan/zoom exactly (Priority: P1)

**Goal**: Ensure canvas dots remain aligned during transform interactions.

**Independent Test**: Pan/zoom repeatedly and confirm no drift/jitter and stable phase alignment.

### Implementation for User Story 2

- [X] T014 [US2] Move background canvas mount into transform stack as lowest layer in `app/components/canvas/canvas-base/index.tsx`
- [X] T015 [US2] Wire viewport offset/zoom/gridSize inputs into background canvas component props in `app/components/canvas/canvas-base/index.tsx`
- [X] T016 [US2] Apply transform-aware phase math from tracked offsets in `app/components/canvas/elements/background/canvas-dot-grid.ts`
- [X] T017 [US2] Hook redraw triggers for pan/zoom/resize/DPR changes in `app/components/canvas/elements/background/canvas-grid-background-canvas.tsx`
- [ ] T018 [US2] Manual validation for SC-002 and SC-003 in `specs/005-grid-background-canvas/quickstart.md` (pan/zoom drift + DPR sharpness checks)

**Checkpoint**: Dot grid tracks transforms and remains sharp on 1x/2x displays.

---

## Phase 5: User Story 3 - Preserve note/UI interaction model (Priority: P2)

**Goal**: Keep note interactions unchanged with canvas background in place.

**Independent Test**: Drag/select/edit/resize notes with no pointer or layering regressions.

### Implementation for User Story 3

- [X] T019 [US3] Enforce non-interactive background canvas (`pointer-events: none`, layering) in `app/components/canvas/elements/background/index.tsx`
- [X] T020 [US3] Verify/adjust z-index and stacking order between background, note elements, marquee, and overlays in `app/components/canvas/canvas-base/index.tsx`
- [ ] T021 [US3] Manual regression validation for SC-004 in `specs/005-grid-background-canvas/quickstart.md` (select/drag/edit/resize checklist)

**Checkpoint**: Notes/UI remain fully DOM-based and interaction-safe.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all stories

- [ ] T022 [P] Refine in-code docs/comments for canvas background pipeline in `app/components/canvas/elements/background/canvas-dot-grid.ts`
- [ ] T023 [P] Remove dead imports/legacy background helpers if unused in `app/components/canvas/elements/background/grid-background.ts`
- [ ] T024 Run final quickstart validation pass and update notes in `specs/005-grid-background-canvas/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 and uses US1 component outputs
- **Phase 5 (US3)**: Depends on Phases 3–4 integration
- **Phase 6 (Polish)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: First deliverable (MVP)
- **US2 (P1)**: Depends on US1 canvas component existing
- **US3 (P2)**: Depends on US1/US2 layering and transform integration

### Parallel Opportunities

- T005 and T006 can run in parallel after T004
- T022 and T023 can run in parallel during Polish phase

---

## Parallel Example: User Story 2

```bash
Task: "Wire viewport offset/zoom/gridSize inputs into background canvas component props in app/components/canvas/canvas-base/index.tsx"
Task: "Apply transform-aware phase math from tracked offsets in app/components/canvas/elements/background/canvas-dot-grid.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1)
3. Validate SC-001 visual parity
4. Demo/commit MVP

### Incremental Delivery

1. US1: artifact-free canvas dots
2. US2: transform-accurate pan/zoom behavior + DPR sharpness
3. US3: interaction safety and layering guarantees
4. Polish: cleanup + final verification
