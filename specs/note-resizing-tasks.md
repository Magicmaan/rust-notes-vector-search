# Note Resizing via Right-Click Drag - Tasks

**Feature**: Add note resizing capability triggered by right-click drag, complementing existing left-click drag positioning.

**Status**: Not Started

---

## Phase 1: Setup & Infrastructure

- [ ] T001 Create `useResizeInteraction` hook skeleton in `app/components/note/hooks/useResizeInteraction.ts`
- [ ] T002 [P] Add TypeScript interfaces for ResizeSessionState and ResizeInteraction
- [ ] T003 [P] Define constants (MIN/MAX dimensions, threshold values) at top of hook

---

## Phase 2: Session State Machine

- [ ] T004 Implement session state initialization in `handlePointerDown` (capture starting values, set data-resizing)
- [ ] T005 Implement pointer move handler with delta accumulation and zoom compensation
- [ ] T006 Implement pointer up handler with cleanup and finalization logic
- [ ] T007 Implement window event listener attachment/removal in useEffect lifecycle hooks
- [ ] T008 [P] Add pointer capture logic (setPointerCapture, releasePointerCapture)

---

## Phase 3: Core Resize Logic

- [ ] T009 Implement dimension snapping function (snap to grid multiples)
- [ ] T010 Implement dimension validation/clamping (MIN/MAX cell bounds)
- [ ] T011 Implement collision detection integration using store.isAreaFree()
- [ ] T012 Implement fallback to nearest free size logic using store.findNearestFree() if collision occurs
- [ ] T013 [P] Add element snapshot mechanism (useRef) to prevent stale closure bugs

---

## Phase 4: Rendering & Visual Feedback

- [ ] T014 Integrate with positioning.renderAtPixelPosition() for --width and --height CSS variable updates
- [ ] T015 Implement RAF scheduling via positioning callbacks for smooth render cadence
- [ ] T016 Add data-resizing attribute toggle for CSS cursor feedback
- [ ] T017 [P] Implement dimension delta calculations (clientX/Y deltas from pointer events)

---

## Phase 5: Store Integration

- [ ] T018 Integrate store.updateElement() for final dimension commit
- [ ] T019 Implement store queries (isAreaFree, findNearestFree) with correct grid unit conversions
- [ ] T020 [P] Test collision detection with overlapping notes

---

## Phase 6: Component Integration

- [ ] T021 Import useResizeInteraction hook in `app/components/note/preview.tsx`
- [ ] T022 Add resize hook initialization with required inputs (wrapperRef, element, grid, store, positioning)
- [ ] T023 Wire resize.handlePointerDown to wrapper div onPointerDown event handler
- [ ] T024 Implement button routing logic (button === 0 for drag, button === 2 for resize)
- [ ] T025 Verify preview.tsx compiles without errors

---

## Phase 7: CSS & Styling

- [ ] T026 Add resize cursor styling (data-resizing="true" → se-resize) in `app/styles/note.css`
- [ ] T027 [P] Add optional SE corner resize handle visual indicator (::before or ::after pseudo-element)
- [ ] T028 [P] Add hover state cursor hint for resize affordance
- [ ] T029 Suppress right-click context menu (preventDefault in handlePointerDown)

---

## Phase 8: Testing & Validation

- [ ] T030 Manual test: Right-click drag on SE corner of note resizes width/height
- [ ] T031 Manual test: Resize respects MIN/MAX dimension bounds
- [ ] T032 Manual test: Resize snaps to grid on pointer release
- [ ] T033 Manual test: Resize into occupied space triggers collision detection and reverts
- [ ] T034 [P] Manual test: Left-click drag still works (no interference with drag)
- [ ] T035 [P] Manual test: Resize works across multiple zoom levels
- [ ] T036 [P] Manual test: While panning (space+drag), resize is disabled
- [ ] T037 [P] Manual test: Multiple notes can be resized independently
- [ ] T038 Test resize with touch/secondary pointer device (if available)

---

## Phase 9: Polish & Edge Cases

- [ ] T039 Add safeguards for extremely small notes (< 2 cell width/height)
- [ ] T040 Add safeguards for oversized notes (> grid dimensions)
- [ ] T041 Test rapid successive resize operations (no memory leaks or event handler duplication)
- [ ] T042 [P] Implement aspect ratio locking logic (optional, for future enhancement)
- [ ] T043 [P] Add undo/redo support for resize operations (optional, defer to Phase B)

---

## Dependencies & Parallel Opportunities

### Dependency Graph
```
T001 → T002, T003 (setup phase)
       ↓
    T004, T005, T006, T007, T008 (session state machine)
       ↓
    T009, T010, T011, T012, T013 (core resize logic)
       ↓
    T014, T015, T016, T017 (rendering)
       ↓
    T018, T019, T020 (store integration)
       ↓
    T021 → T022 → T023 → T024 → T025 (component integration - sequential)
    
    T026, T027, T028, T029 (CSS styling - can run in parallel with integration)
    
    T030-T038 (testing - after all implementation complete)
```

### Parallel Execution Examples

**Batch 1 (Hook Setup)**:
- T001, T002, T003 can run sequentially within phase

**Batch 2 (Core Logic - Independent Concerns)**:
- T009 (snapping), T010 (validation), T013 (snapshot) are parallelizable
- T011, T012 can run in parallel (both collision-related)
- T014, T015, T016, T017 can mostly run in parallel (integrate in T024-T025)

**Batch 3 (Integration & Styling)**:
- CSS styling (T026-T029) can run in parallel with component integration (T021-T025)

**Batch 4 (Testing)**:
- Manual tests can be batched by concern:
  - Dimension/snapping tests: T030, T031, T032
  - Collision tests: T033
  - Interaction tests: T034, T035, T036, T037, T038

---

## Independent Test Criteria per Phase

**Phase 1-2 (Session State)**
- ✓ Hook exports correct types (ResizeSessionState, ResizeInteraction)
- ✓ Session state initializes on right-click (button === 2)
- ✓ Pointer capture acquired and released correctly

**Phase 3 (Resize Logic)**
- ✓ Dimension deltas calculated correctly with zoom compensation
- ✓ Snapping logic rounds dimensions to nearest grid multiple
- ✓ Clamping logic enforces MIN/MAX bounds

**Phase 4 (Rendering)**
- ✓ CSS variables (--width, --height) update during drag
- ✓ RAF scheduling prevents jank on fast drags
- ✓ data-resizing attribute toggles on/off

**Phase 5 (Store Integration)**
- ✓ Collision detection prevents overlapping notes
- ✓ Fallback to nearest free space works
- ✓ updateElement commits correct NoteDisplay object

**Phase 6 (Component Integration)**
- ✓ preview.tsx compiles without errors
- ✓ resize and drag hooks coexist (no event handler conflicts)
- ✓ Button routing works (0 → drag, 2 → resize)

**Phase 7 (Styling)**
- ✓ Cursor feedback visible (se-resize on data-resizing="true")
- ✓ Context menu suppressed on right-click
- ✓ Visual affordance clear to users

**Phase 8 (Manual Testing)**
- ✓ Right-click drag resizes note bottom-right
- ✓ Resize works across all zoom levels
- ✓ Collision detection triggered on overlap
- ✓ No interference with existing drag functionality

---

## Implementation Strategy

### MVP Scope (Recommended Phase 1 Focus)
**Core feature working end-to-end:**
1. T001-T003: Hook setup
2. T004-T008: Session state machine
3. T009-T013: Core resize logic
4. T014-T017: Rendering integration
5. T018-T020: Store integration
6. T021-T025: Component wiring
7. T026, T029: Minimal CSS (cursor + context menu suppression)
8. T030-T038: Full manual testing

**Estimated effort**: 4-6 hours

### Phase B (Enhancement - Future)
- Multi-handle resize (corners, edges)
- Aspect ratio locking
- Undo/redo support
- Animated resize handles

### Phase C (Polish - Future)
- Dimension tooltip during resize
- Keyboard shortcuts for size adjustment
- Snap-to-content sizing

---

## Notes for Implementer

1. **Right-click suppression**: Use `e.preventDefault()` in `handlePointerDown` if `button === 2` to block browser context menu
2. **Zoom compensation**: Always divide pointer deltas by `grid.safeZoom` before applying to dimensions
3. **Stale closures**: Keep element snapshot in `elementRef.current` synchronized via useEffect (see useDragInteraction pattern)
4. **RAF batching**: Reuse `positioning.renderAtPixelPosition()` - it's already RAF-scheduled
5. **Collision fallback**: If snapped position overlaps, use `store.findNearestFree()` before reverting
6. **Cleanup**: Ensure all window listeners, RAF callbacks, and pointer capture released in finalization (see T005-T008)
