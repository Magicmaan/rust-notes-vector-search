# 01 - Note Plugin State Machine

## Goal
Define a deterministic finite state machine (FSM) for note interactions so selection, drag, resize, cancel, and blur behavior are consistent and recoverable.

## Current Problem
The note plugin currently mixes session flags and branch-based flow. State transitions are implicit, so cancellations and branch exits can leave stale mode/metadata.

## Target Architecture/Behavior
- Canonical states: `idle`, `pressed`, `dragging`, `resizing`, `cancelling`.
- Single session object keyed by `pointerId` and `elementId`.
- Transitions are table-driven; illegal transitions are no-op + dev warning.
- Runtime emits operations only; plugin never mutates store or DOM directly.

### Transition Table
| From | Event | Guard | To | Emitted Ops |
|---|---|---|---|---|
| `idle` | pointerDown | target note + left button | `pressed` | `selection.*` as needed, `interaction.beginSession` |
| `idle` | pointerDown | target note + right button | `resizing` | `selection.*` as needed, `ui.setResizeAttrs(start)` |
| `pressed` | pointerMove | distance >= drag threshold | `dragging` | `element.previewBulk` |
| `pressed` | pointerUp | distance < drag threshold | `idle` | `interaction.endSession` |
| `dragging` | pointerMove | same pointer | `dragging` | `element.previewBulk` |
| `dragging` | pointerUp | same pointer | `idle` | `element.commitBulk`, `interaction.endSession` |
| `resizing` | pointerMove | same pointer + threshold passed | `resizing` | `element.previewBulk`, `ui.setResizeAttrs(active)` |
| `resizing` | pointerUp | same pointer | `idle` | `element.commitBulk`, `ui.setResizeAttrs(stop)`, `interaction.endSession` |
| `pressed|dragging|resizing` | pointerCancel/blur | session active | `cancelling` -> `idle` | `element.rollbackSession`, `ui.setResizeAttrs(none)`, `interaction.endSession` |

## Implementation Steps
1. Add `NoteInteractionState` union and `NoteInteractionSession` type.
2. Introduce `transition(session, event, context)` pure function returning `{ nextState, ops }`.
3. Refactor plugin handlers to forward events into `transition` only.
4. Centralize session reset in one `resetSession()` path used by cancel/blur/up cleanup.
5. Add dev warnings for illegal transitions and mismatched pointer ids.

## Type/API Changes
- Add `NoteInteractionState` and `NoteInteractionSession` in runtime plugin types.
- Add `interaction.beginSession|updateSession|endSession` operations to runtime operation union (if missing).
- Add optional `sessionId` on note ops for traceability.

## Edge Cases/Failure Modes
- Lost pointer capture -> `blur` or `pointerCancel` must always rollback preview.
- Pointer-up from different pointer id must not commit.
- Right-click resize should not enter drag state.
- Shift-toggle on pointerDown should not invalidate active session target.

## Test Cases + Acceptance Criteria
- Press/click note selects with no lingering session.
- Drag starts only after threshold and commits exactly once.
- Resize sets `start -> active -> stop/none` attrs in correct sequence.
- Cancel/blur always rolls back preview geometry.
- Illegal event ordering leaves state safe (`idle`) and no store corruption.

## Migration Notes
- Preserve existing gesture semantics (threshold, shift toggle, right-click resize trigger).
- Use existing geometry helpers; only control-flow ownership changes first.

## Risks + Mitigations
- Risk: behavior drift during state rewrite.
- Mitigation: lock with parity tests before and after refactor.

## Definition of Done
- FSM types + transition table implemented.
- Note plugin handlers become thin event dispatchers.
- All note interaction tests pass with no direct store/DOM writes from plugin.
