# 09 - Runtime Trace Debugging

## Goal
Add structured runtime trace output to diagnose interaction and ordering bugs quickly.

## Current Problem
When note behavior breaks, there is limited visibility into event routing, emitted operations, sort order, and applied mutations.

## Target Architecture/Behavior
- Optional dev-only trace capture per dispatched event:
  - `event`
  - `target metadata`
  - `emitted ops`
  - `sorted ops with phases`
  - `applied ops`
  - `validation warnings/errors`
- Trace available via runtime getter and optional console formatter.

## Implementation Steps
1. Expand `RuntimeExecutionTrace` shape.
2. Record both pre-sort and post-sort operation lists.
3. Attach collision decision reasons where available.
4. Add dev flag (`CANVAS_RUNTIME_TRACE`) to enable console output.
5. Add helper to pretty-print trace in grouped logs.

## Type/API Changes
- Extend `RuntimeExecutionTrace` and add `RuntimeTraceEntry` primitives.
- Add runtime method: `getLastTrace()` (already present) and optional ring-buffer getter.

## Edge Cases/Failure Modes
- Large trace payload impacts performance.
- Sensitive data leaking to logs.

## Test Cases + Acceptance Criteria
- Trace includes complete pipeline for note drag and resize events.
- Trace disabled by default in production.
- Enabling trace does not change behavior.

## Migration Notes
- Start with single-event last-trace; add ring buffer only if needed.

## Risks + Mitigations
- Risk: noisy logs obscure signal.
- Mitigation: filter by plugin/event kinds and collapse repeated frames.

## Definition of Done
- Debug trace is available, accurate, and gated behind dev controls.
