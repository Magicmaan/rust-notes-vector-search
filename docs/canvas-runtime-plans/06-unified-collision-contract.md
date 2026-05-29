# 06 - Unified Collision Contract

## Goal
Provide one deterministic collision contract used by both note movement and resize operations.

## Current Problem
Collision behavior is split and inconsistent, causing axis cancellation, zero-dimension snap bugs, and spotty resolver output.

## Target Architecture/Behavior
- Single solver interface for move and resize.
- Axis policy for resize:
  - Solve horizontal with Y-overlap blockers.
  - Solve vertical with X-overlap blockers using resolved horizontal span.
  - Preserve valid axis when other axis fails (`last-valid-axis` fallback).
- Move policy:
  - Preview uses snapped candidate.
  - Commit uses `free -> nearest free -> baseline rollback` strategy.

## Implementation Steps
1. Add `interaction/collision.ts` canonical utilities.
2. Add `interaction/move.ts` and `interaction/resize.ts` wrappers over shared solver.
3. Replace duplicated collision checks in note/marquee paths.
4. Standardize coordinate model to grid units as source of truth.

## Type/API Changes
- Add `CollisionInput`, `CollisionResult`, `AxisResolution`, `Placement` types.
- Add explicit `CollisionDecisionReason` enum for tracing/debug.

## Edge Cases/Failure Modes
- Dense blockers with no free space in search radius.
- Min-size constraints intersecting collision constraints.
- Negative/zero width or height generation.

## Test Cases + Acceptance Criteria
- Horizontal blocked but vertical free preserves vertical change.
- Vertical blocked but horizontal free preserves horizontal change.
- Both blocked returns last valid placement, never zero/negative dimensions.
- Anchor parity coverage for all resize anchors.

## Migration Notes
- Keep existing search radius and snapping constants in first pass.
- Delay UX changes until parity is proven.

## Risks + Mitigations
- Risk: subtle regressions in existing layouts.
- Mitigation: golden tests with known collision fixtures.

## Definition of Done
- One shared collision solver powers move and resize.
- Axis-consistent behavior is verified by unit tests.
