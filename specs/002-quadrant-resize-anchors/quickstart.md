# Quickstart: Quadrant-Based Resize Anchors

## Goal
Enable directional note resizing from whichever edge/corner the user starts on, with minimal code changes to existing resize mechanics.

## Files in Scope
- `app/components/note/hooks/useResizeInteraction.ts` (primary)
- `app/components/note/preview.tsx` (only if additional CSS vars need updating)
- `app/styles/note.css` (optional cursor affordance updates)

## Implementation Steps
1. Add `ResizeAnchor` type and anchor fields to resize session state.
2. On pointer down, compute note-local pointer coordinates and resolve anchor.
3. Extend candidate geometry calculation to include anchor-aware x/y and width/height updates.
4. Keep existing threshold, pointer capture, RAF scheduling, and finalize control flow unchanged.
5. In finalize, snap and commit `x/y/width/height` as needed (left/top anchors affect origin).
6. Preserve minimum-size clamping and existing fallback semantics.

## Manual Verification Checklist
1. Right-edge start: width changes, right edge tracks pointer.
2. Left-edge start: width changes and x shifts; right edge remains fixed.
3. Top-edge start: height changes and y shifts; bottom edge remains fixed.
4. Bottom-edge start: height changes from bottom as current behavior.
5. All four corners: corresponding two-axis anchor behavior.
6. Ambiguous/center start: falls back to existing SE behavior.
7. Zoomed canvas: directional behavior remains correct.
8. Pointer release outside bounds: finalize once, no stuck resize state.

## Regression Checks
1. Left-click drag behavior unchanged.
2. Right-click still initiates resize only.
3. No snap regression on finalize.
4. No 256px cap regression.
