# Contract: Background Dot Rendering

## Purpose
Define the expected interface and behavior for canvas-based background dot rendering.

## Input Contract
### Viewport Inputs
- `zoomLevel: number` (required, > 0)
- `offsetX: number` (required, finite)
- `offsetY: number` (required, finite)
- `gridSize: [number, number]` (required, each >= 1)

### Style Token Inputs (from CSS custom properties)
- `--grid-dot-color`
- `--grid-dot-core-size`
- `--grid-dot-fade-size`
- `--grid-dot-opacity-min`
- `--grid-dot-opacity-max`
- `--grid-dot-opacity-zoom-base`
- `--grid-dot-opacity-zoom-multiplier`
- `--grid-dot-saturate`

Missing/invalid token values MUST fallback to safe defaults.

## Rendering Contract
- Canvas MUST fill the editor viewport bounds.
- Canvas backing store MUST be scaled for current DPR.
- Dot spacing MUST track `gridSize * zoomLevel`.
- Dot phase MUST track `offsetX/offsetY` using positive modulo.
- Dot opacity MUST use the existing clamp formula semantics.
- Canvas MUST not intercept pointer interactions.

## Lifecycle Contract
- MUST redraw on viewport transform updates.
- MUST redraw on canvas size/DPR changes.
- SHOULD redraw when relevant CSS token values change.
- MUST clean up observers/raf callbacks on unmount.

## Compatibility Contract
- Notes and interaction overlays remain DOM-based.
- Existing editor behavior and commands remain unchanged.