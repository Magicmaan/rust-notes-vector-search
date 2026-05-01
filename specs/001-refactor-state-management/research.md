# Research: Note Drag and Snap Redesign

## Decision 1: Use an explicit drag lifecycle state machine
- Decision: Model note drag lifecycle as `idle -> pressed -> dragging -> finalizing -> idle`.
- Rationale: Eliminates fragmented event logic and makes finalization deterministic.
- Alternatives considered:
  - Multiple ad-hoc flags and scattered handlers: rejected due to race conditions.

## Decision 2: Use one finalize function for all release paths
- Decision: Route pointer up, cancel, and lost capture through one idempotent finalize path.
- Rationale: Prevents duplicate or missing cleanup and commit calls.
- Alternatives considered:
  - Separate business logic in each handler: rejected due to inconsistent outcomes.

## Decision 3: Separate preview movement from persisted state
- Decision: Keep in-flight drag preview transient and commit only at finalize.
- Rationale: Avoids store churn and stale transform artifacts during interaction.
- Alternatives considered:
  - Persist every move: rejected due to unnecessary state churn.

## Decision 4: Enforce drag ownership arbitration with canvas pan
- Decision: Note drag and canvas pan are mutually exclusive ownership modes.
- Rationale: Avoids gesture collision introduced during optimization.
- Alternatives considered:
  - Best-effort filtering by target only: rejected as insufficiently robust.

## Decision 5: Preserve existing grid semantics and occupancy checks
- Decision: Keep current snap rounding, occupancy validation, and negative-coordinate rejection semantics.
- Rationale: Fix interaction reliability without changing domain behavior.
- Alternatives considered:
  - Redesign grid model simultaneously: rejected as unnecessary scope expansion.
