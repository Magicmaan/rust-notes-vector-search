# Feature Specification: Note Drag and Snap Reliability

**Feature Branch**: `001-refactor-state-management`  
**Created**: April 11, 2026  
**Status**: Draft  
**Input**: User description: "note dragging remains active after release and snap/commit is unreliable after drag optimization"

## Clarifications

### Session 2026-04-11

- Q: What movement threshold should separate click from drag start? -> A: Use a `4px` screen-space movement threshold.

## User Scenarios and Testing

### User Story 1 - Reliable Drag Finalization (Priority: P1)

Users can drag a note and release once to immediately finalize movement without lingering pointer tracking.

**Why this priority**: This is the core bug and directly blocks normal editing.

**Independent Test**: Drag any note and release once. The note must stop tracking the pointer immediately.

**Acceptance Scenarios**:

1. **Given** a note is dragged and released, **When** release occurs, **Then** exactly one finalize action runs
2. **Given** release occurs outside the note bounds, **When** drag ends, **Then** tracking still ends immediately
3. **Given** pointer capture is interrupted, **When** drag lifecycle ends, **Then** drag state resets and tracking stops

---

### User Story 2 - Deterministic Snap and Commit (Priority: P1)

Users can drag notes to valid cells and reliably commit snapped grid coordinates on release.

**Why this priority**: Finalization without correct commit still produces visible regressions.

**Independent Test**: Drag to a free cell and release once; note snaps and persists on first release.

**Acceptance Scenarios**:

1. **Given** a free destination cell, **When** drag ends, **Then** note snaps to nearest integer cell and persists
2. **Given** an occupied destination cell, **When** drag ends, **Then** note returns to original coordinates
3. **Given** a negative destination coordinate, **When** drag ends, **Then** note returns to original coordinates

---

### User Story 3 - No Note/Canvas Drag Collision (Priority: P2)

Note drag and canvas pan remain mutually exclusive so one gesture cannot move both.

**Why this priority**: Input collision is the major regression source introduced during optimization.

**Independent Test**: Start interaction on note and confirm canvas does not pan; start on empty canvas and confirm note does not drag.

**Acceptance Scenarios**:

1. **Given** pointer down on a note, **When** dragging, **Then** only note drag updates occur
2. **Given** pointer down on empty canvas, **When** dragging, **Then** only canvas pan updates occur
3. **Given** note drag is active, **When** canvas pan handlers receive pointer events, **Then** they perform no state updates

---

### Edge Cases

- Pointer release outside viewport must still finalize drag exactly once.
- Lost pointer capture must route through finalize logic and clear drag state.
- Very small movement below `4px` screen-space threshold should be treated as click-like interaction and not commit a move.
- Rapid consecutive drags must not leak listeners or carry stale offsets.

## Requirements

### Functional Requirements

- **FR-001**: System MUST use a single authoritative note-drag finalization path for commit and cancel outcomes.
- **FR-002**: System MUST terminate note tracking immediately on pointer up, pointer cancel, or lost capture, and MUST guarantee that cleanup (pointer refs, listeners, RAF, drag flags) is performed exactly once per interaction (idempotent cleanup).
- **FR-003**: System MUST snap committed note positions to nearest integer grid coordinates on release.
- **FR-004**: System MUST commit snapped coordinates only when destination area is valid and unoccupied.
- **FR-005**: System MUST reject invalid destinations (negative or occupied) and restore original note position.
- **FR-006**: System MUST prevent simultaneous note drag and canvas pan for a single pointer gesture.
- **FR-007**: System MUST keep drag-preview updates transient and separate from persisted store coordinates until commit.
- **FR-008**: System MUST avoid stale visual transforms after successful commit.
- **FR-009**: System MUST preserve existing grid semantics (`x`, `y`, `width`, `height` as grid units/spans).
- **FR-010**: System MUST treat drag start as active only after at least `4px` screen-space pointer movement from press origin.

### Non-Functional Requirements

- **NFR-001 (Performance — interactive responsiveness)**: During drag interactions with up to **200** notes (representative workload), the application SHOULD maintain **60 FPS** rendering (p95 frame time ≤ 16ms, p99 frame time ≤ 30ms) on a mid-range desktop (e.g., 4-core CPU class). Drag-preview update latency (time from pointer move to visual preview) SHOULD have p95 ≤ 16ms.
- **NFR-002 (Graceful degradation)**: Under heavier workloads (e.g., **500** notes), the application SHOULD degrade gracefully and maintain at least **30 FPS** (p95 frame time ≤ 33ms).
- **NFR-003 (Background sync latency)**: Background tiling/sync (dot-grid alignment) SHOULD update within p95 ≤ 8ms from scheduled frame to applied CSS properties to avoid visual tearing during pan/zoom.



### Key Entities

- **NoteDragSession**: Active interaction state containing pointer id, start coordinates, transient offsets, and lifecycle phase.
- **DragFinalizeIntent**: Finalization decision payload indicating commit vs cancel.
- **SnapCandidate**: Computed target grid coordinate pair derived from drag deltas and grid size.
- **DragOwnership**: Input ownership state indicating whether note drag or canvas pan currently owns the pointer stream.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In 50 manual drag-release attempts, 100% of interactions terminate tracking immediately on first release.
- **SC-002**: In 30 valid-drop attempts, 100% commit to snapped grid coordinates on first release.
- **SC-003**: In 30 invalid-drop attempts (occupied or negative), 100% revert to original coordinates without residual offset.
- **SC-004**: In mixed note/canvas drag arbitration checks (20 attempts), 0 interactions move both note and canvas.
- **SC-005**: No stale transform artifacts remain after drag completion in repeated interactions.

- **SC-006**: Performance: Using the performance harness (T033), p95 frame time during interactive drag with 200 notes must be ≤ 16ms and p99 ≤ 30ms; heavier workloads (500 notes) should maintain p95 ≤ 33ms.

## Assumptions

- Existing element storage and occupancy checks remain the source of truth.
- Redesign is scoped to interaction lifecycle and does not introduce persistence changes.
- Manual QA is acceptable for this iteration.
- Existing viewport zoom behavior remains in place and must continue to work with note drag.
