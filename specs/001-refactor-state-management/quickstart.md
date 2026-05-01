# Quickstart: Verify Note Drag and Snap Redesign

## 1. Implement lifecycle foundation
1. Add explicit drag phases in `app/components/note/preview.tsx`.
2. Add single-path `finalizeDrag(shouldCommit)` with idempotent guard.
3. Add one centralized cleanup utility for listeners, RAF, refs, and drag flags.

## 2. Implement release-path routing
1. Route element pointer up to `finalizeDrag(true)`.
2. Route pointer cancel and lost capture to `finalizeDrag(false)`.
3. Route window-level pointer up/cancel fallbacks to the same finalize path.

## 3. Preserve commit semantics
1. Keep snap rounding in commit step only.
2. Keep occupancy validation and negative-coordinate rejection in commit step only.
3. Ensure visual preview offsets reset after finalize.

## 4. Enforce note/canvas ownership arbitration
1. Ensure note-origin pointer events do not trigger canvas pan start.
2. Ensure canvas pan handlers no-op while note drag is active.
3. Ensure release/cancel always clears owner state.

## 5. Validate interaction matrix
1. Drag and release on free cell: snaps and commits once.
2. Drag and release on occupied cell: reverts once.
3. Drag and release to negative coordinate: reverts once.
4. Release outside note/viewport: finalize still runs once.
5. Lost capture/cancel: tracking ends and state resets.
6. Note drag and canvas pan never execute simultaneously.

## 6. Validate quality gates
1. Run lint on touched note/canvas/store files.
2. Run diagnostics on touched files.
3. Record matrix outcomes in plan notes.
