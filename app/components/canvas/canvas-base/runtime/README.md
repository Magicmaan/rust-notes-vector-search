# Canvas Runtime

Runtime is the single mutation path for canvas interactions.

## Rules
- Plugins emit operations only.
- Runtime executes operations in deterministic phase order.
- Runtime/interaction/plugin modules must not import editor store directly.

## Ownership Reference
See: `docs/canvas-runtime-ownership.md`

## Guard Check
Run:
- `npm run check:canvas-runtime-boundaries`
