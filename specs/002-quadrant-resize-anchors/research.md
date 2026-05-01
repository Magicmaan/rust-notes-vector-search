# Research: Quadrant-Based Resize Anchors

## Decision 1: Resolve resize anchor once at pointer-down using local hit zones
- Decision: Determine `ResizeAnchor` during `handlePointerDown` from pointer position inside the note's current pixel bounds. Store anchor in session and keep it fixed for the whole interaction.
- Rationale: Minimal-change approach that preserves existing move/finalize pipeline and avoids per-frame direction switching jitter.
- Alternatives considered:
  - Recompute anchor on every pointer move. Rejected because it can flip direction mid-drag and destabilize behavior.
  - Introduce explicit visible resize handles first. Rejected for now because it adds UI scope beyond requested minimal change.

## Decision 2: Keep current right-click entry point and threshold/finalize lifecycle unchanged
- Decision: Reuse existing right-click activation, threshold gating, pointer capture, RAF batching, and finalize commit path.
- Rationale: User explicitly requested minimal changes because current mechanics are working well.
- Alternatives considered:
  - Rewrite resize interaction as a generic transform engine. Rejected as high-risk and unnecessary.

## Decision 3: Add anchor-aware geometry math in resize candidate computation only
- Decision: Extend candidate geometry computation to support left/top anchored resize by changing both size and origin when needed.
- Rationale: Keeps the feature localized to geometry calculations in `useResizeInteraction.ts` while preserving surrounding architecture.
- Alternatives considered:
  - Add a second hook for directional resize. Rejected due to duplicated lifecycle code.

## Decision 4: Use edge/corner hit-zone threshold in pixels with deterministic fallback
- Decision: Use a configurable edge threshold (e.g., 16px) to classify start point into edge/corner zones; default to SE (`right + bottom`) when ambiguous.
- Rationale: Deterministic and backwards-compatible with existing behavior.
- Alternatives considered:
  - Percentage-based threshold. Rejected because tiny notes become hard to classify and behavior can vary unexpectedly.

## Decision 5: Preserve current snap/min-size rules and overlap semantics
- Decision: Continue snapping commit to grid, enforce minimum width/height, and keep existing overlap behavior (no collision rejection currently enforced for resize).
- Rationale: Explicitly avoids behavioral regressions and keeps scope tight.
- Alternatives considered:
  - Introduce collision checks for directional resize. Rejected as an orthogonal feature not requested.

## Decision 6: Maintain zoom-safe deltas in current coordinate model
- Decision: Keep client-delta-to-grid-pixel conversion (`delta / safeZoom`) exactly as current, then apply anchor math to candidate geometry.
- Rationale: Existing zoom correctness is already in place and should not be reworked.
- Alternatives considered:
  - Convert to direct world-space pointer transforms. Rejected due to larger rewrite surface.
