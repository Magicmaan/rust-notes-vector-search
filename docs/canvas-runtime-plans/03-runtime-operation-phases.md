# 03 - Runtime Operation Phases

## Goal
Enforce strict runtime operation phases so all interaction writes execute in deterministic order.

## Current Problem
Operation ordering is partially implicit and can mix interaction flags, preview updates, commit updates, and UI effects unpredictably.

## Target Architecture/Behavior
- Phase buckets: `interaction`, `preview`, `commit`, `ui`.
- Every `CanvasOperation` maps to exactly one phase.
- Runtime execution pipeline: `collect -> normalize -> validate -> phase sort -> execute`.
- Invalid phase/op combinations fail in development with actionable error; production no-op + warn.

## Implementation Steps
1. Add phase mapper: `getOperationPhase(op)`.
2. Add runtime validator to reject unknown op types and illegal sequence patterns.
3. Replace numeric order with phase-based order + stable insertion within phase.
4. Emit execution trace with phase annotations.

## Type/API Changes
- Add `CanvasOperationPhase` type union.
- Add `RuntimeValidationResult` and debug warnings structure.
- Extend `RuntimeExecutionTrace` with `phase` and validation diagnostics.

## Edge Cases/Failure Modes
- Plugin returns commit op before preview op in same event.
- Multiple commit ops for same element in one frame.
- UI op depending on commit result emitted too early.

## Test Cases + Acceptance Criteria
- Deterministic sorting across mixed op sets.
- Validator catches illegal order in dev.
- Existing pan/zoom/note/marquee interactions remain behaviorally stable.

## Migration Notes
- Keep current op names; phase model is additive.
- Gradually tighten validator from warning to error in dev.

## Risks + Mitigations
- Risk: strict validation may break legacy plugin paths.
- Mitigation: staged rollout with warning mode first.

## Definition of Done
- All runtime ops have explicit phase mapping.
- Executor uses phase model only.
- Phase/order tests pass.
