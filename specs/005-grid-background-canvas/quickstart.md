# Quickstart: Canvas Dot Grid Background

## 1) Scope
Implement a background-only canvas renderer for grid dots while keeping notes/UI as div layers.

## 2) Implement
1. Create `CanvasGridBackgroundCanvas` component under `app/components/canvas/elements/background/`.
2. Replace current dot-layer div usage in `app/components/canvas/elements/background/index.tsx` with `<canvas>`.
3. Keep decorative base/vignette CSS layers intact for this iteration.
4. Read CSS custom properties from `#editor-grid-container` via `getComputedStyle` and parse into tokens.
5. Apply DPR-aware canvas sizing and redraw logic.
6. Reuse existing viewport/grid metrics (`zoomLevel`, `offsetX`, `offsetY`, `gridSize`) to compute spacing/phase.
7. Ensure `pointer-events: none` and proper z-index placement.

## 3) Validate
- Pan/zoom with existing interactions and verify dot alignment.
- Resize window and verify no blur/stretch.
- Compare visual output at 100% and 200% scale displays.
- Smoke test note select/drag/edit/resize for regressions.

## 4) Non-goals
- Converting notes to canvas.
- Full drawing/shapes system implementation.
- Replacing all background effects with canvas in this feature.