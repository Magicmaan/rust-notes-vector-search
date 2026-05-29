# 07 - Regression Test Matrix

## Goal
Create a comprehensive runtime/plugin regression suite that locks interaction behavior and architecture boundaries.

## Current Problem
Behavior regressions are surfacing during refactors because no focused integration matrix exists for note/pan/marquee interactions.

## Target Architecture/Behavior
- Tests at three levels: solver unit tests, runtime executor tests, plugin integration tests.
- Static guard checks for architecture constraints.

## Implementation Steps
1. Add fake runtime ports for deterministic runtime tests.
2. Add note plugin interaction tests:
   - selection toggle
   - drag preview/commit/cancel
   - resize preview/commit/cancel
   - blur rollback
3. Add pan precedence tests (space+drag suppresses note drag).
4. Add marquee coexistence tests.
5. Add static grep guard: no direct store imports in runtime plugins.

## Type/API Changes
- Add test helpers for fake ports, event builders, and operation trace assertions.

## Edge Cases/Failure Modes
- Multi-selection with note target changes mid-session.
- Wheel zoom during pending note session.
- Pointer cancel while lockout toggles.

## Test Cases + Acceptance Criteria
- Acceptance matrix scenarios pass:
  - click-select and shift-toggle
  - drag preview smooth + commit deterministic
  - resize constraints stable
  - pan/zoom precedence preserved
  - marquee on empty and occupied canvas
  - runtime/plugins import no store directly

## Migration Notes
- Start with behavior-parity tests against current expected UX.
- Add stricter architectural tests after parity baseline.

## Risks + Mitigations
- Risk: brittle tests due to DOM coupling.
- Mitigation: keep core tests in pure runtime/plugin layers with fake ports.

## Definition of Done
- Regression suite catches known break classes.
- CI includes runtime/plugin test job.
