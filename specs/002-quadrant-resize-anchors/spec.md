# Feature Specification: Quadrant-Based Note Resize Anchors

**Feature Branch**: `002-quadrant-resize-anchors`  
**Created**: April 25, 2026  
**Status**: Draft  
**Input**: User description: "modify the resizing mechanics to work off of quadrants. if user starts a resize from the left, then it will resize along the left, top will resize from the top, etc. keep minimal changes because current logic works"

## User Scenarios and Testing

### User Story 1 - Edge-Aware Resize Direction (Priority: P1)

Users can start resizing from a specific side/corner and have that side/corner move while the opposite edge remains anchored.

**Why this priority**: This is the requested behavior change and the core functional outcome.

**Independent Test**: Start a resize near each side/corner and verify movement occurs from that side/corner only.

**Acceptance Scenarios**:

1. **Given** resize starts from left edge, **When** pointer moves horizontally, **Then** left edge moves and right edge remains anchored.
2. **Given** resize starts from top edge, **When** pointer moves vertically, **Then** top edge moves and bottom edge remains anchored.
3. **Given** resize starts from top-left corner, **When** pointer moves diagonally, **Then** both top and left edges move while bottom-right remains anchored.

---

### User Story 2 - Preserve Existing Working Resize Lifecycle (Priority: P1)

Users continue to get reliable thresholding, pointer capture, snapping, and finalize behavior while gaining directional anchor control.

**Why this priority**: Existing resize behavior is already stable; regression risk must be minimized.

**Independent Test**: Existing resize flows (right-click start, drag, release) still commit once and snap correctly.

**Acceptance Scenarios**:

1. **Given** pointer movement below threshold, **When** releasing, **Then** no resize commit occurs.
2. **Given** a valid resize movement, **When** releasing once, **Then** finalize runs once and commits snapped dimensions.
3. **Given** pointer exits note bounds during resize, **When** releasing, **Then** interaction still finalizes correctly.

---

### User Story 3 - Minimal Interaction Surface Changes (Priority: P2)

Users do not need new controls; direction is inferred from where resize starts on the note.

**Why this priority**: Keeps UX and code changes small.

**Independent Test**: No new toolbar/mode is required and existing right-click resize entry point remains.

**Acceptance Scenarios**:

1. **Given** a resize starts near an edge/corner zone, **When** drag begins, **Then** direction is selected from the start zone.
2. **Given** an ambiguous start near center, **When** drag begins, **Then** default behavior remains the current bottom-right (SE) behavior.

---

### Edge Cases

- Start near exact center should fall back deterministically to current SE behavior.
- Left/top anchored resizing may require position (`x`, `y`) updates along with size updates; snapping must still be grid-aligned.
- Rapid sequential resizes from different edges must not leak listeners or reuse stale direction state.
- Resize behavior under zoom must preserve directional intent and grid snapping.

## Requirements

### Functional Requirements

- **FR-001**: System MUST infer resize direction from pointer-down location relative to note bounds (left/right/top/bottom zones and corners).
- **FR-002**: System MUST support at minimum the four edges and four corners as resize start zones.
- **FR-003**: System MUST preserve the existing right-click resize activation and pointer lifecycle semantics.
- **FR-004**: System MUST keep existing movement threshold, pointer capture, RAF visual updates, and single finalize/commit behavior.
- **FR-005**: System MUST update dimensions from the active edges only; inactive edges MUST remain anchored.
- **FR-006**: System MUST update note position (`x`, `y`) when resizing from left and/or top anchors.
- **FR-007**: System MUST continue snapping final dimensions and positions to grid units on commit.
- **FR-008**: System MUST preserve minimum size constraints.
- **FR-009**: System MUST keep grid-unit semantics for `x`, `y`, `width`, `height`.
- **FR-010**: System MUST default to current SE resize behavior when start zone cannot be determined confidently.

### Non-Functional Requirements

- **NFR-001 (Regression safety)**: Existing resize workflows should remain behaviorally unchanged except for edge-aware anchoring.
- **NFR-002 (Performance)**: Resize interaction should remain visually smooth with existing RAF approach (no additional jank introduced).
- **NFR-003 (Maintainability)**: Implementation should be localized primarily to `useResizeInteraction.ts` with minimal adjacent file changes.

### Key Entities

- **ResizeAnchor**: Directional metadata (`left`, `right`, `top`, `bottom`) resolved at pointer down.
- **ResizeSessionState**: Active pointer session, including start metrics, deltas, and selected `ResizeAnchor`.
- **ResizeCandidate**: Candidate pixel/grid geometry derived from anchor, deltas, and constraints.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In manual tests across 8 start zones (4 edges + 4 corners), 100% of resizes move from the intended anchored edge(s).
- **SC-002**: Existing SE-resize path remains available as fallback and behaves identically in center/ambiguous starts.
- **SC-003**: In 30 repeated resize interactions, finalize executes once per interaction with no lingering active state.
- **SC-004**: No regressions in drag vs resize routing (left-click drag and right-click resize remain isolated).

## Assumptions

- Right-click remains the resize activation gesture.
- Current snapping and minimum-size behavior are correct and should be reused.
- Collision/overlap semantics for resizing remain unchanged from current behavior.
