# Data Model: Canvas-Rendered Dot Grid Background

## Entity: BackgroundCanvasState
- **Description**: Runtime geometry and viewport values required to draw the dot grid.
- **Fields**:
  - `viewportWidthPx: number` (>= 1)
  - `viewportHeightPx: number` (>= 1)
  - `devicePixelRatio: number` (>= 1)
  - `zoomLevel: number` (> 0)
  - `offsetX: number` (finite)
  - `offsetY: number` (finite)
  - `gridCellWidthPx: number` (>= 1)
  - `gridCellHeightPx: number` (>= 1)
- **Validation rules**:
  - Non-finite numbers fallback to safe defaults.
  - Grid cell dimensions are clamped to at least 1.

## Entity: DotStyleTokens
- **Description**: Parsed style inputs sourced from CSS custom properties.
- **Fields**:
  - `dotColor: string` (CSS color string)
  - `coreRadiusPx: number` (>= 0)
  - `fadeRadiusPx: number` (>= coreRadiusPx)
  - `opacityMin: number` ([0,1])
  - `opacityMax: number` ([0,1], >= opacityMin)
  - `opacityZoomBase: number` (finite)
  - `opacityZoomMultiplier: number` (finite)
  - `saturate: number` (>= 0)
- **Validation rules**:
  - Missing/invalid vars fall back to defaults from current CSS.

## Entity: BackgroundRenderMetrics
- **Description**: Derived drawing values from state + tokens.
- **Fields**:
  - `spacingX: number` (>= 1)
  - `spacingY: number` (>= 1)
  - `phaseX: number` ([0, spacingX))
  - `phaseY: number` ([0, spacingY))
  - `dotOpacity: number` ([opacityMin, opacityMax])
- **Derivations**:
  - `spacingX = gridCellWidthPx * zoomLevel`
  - `spacingY = gridCellHeightPx * zoomLevel`
  - `phase*` via positive modulo with offsets.
  - `dotOpacity` via existing zoom formula clamp.

## Relationship Notes
- `BackgroundCanvasState` + `DotStyleTokens` produce `BackgroundRenderMetrics`.
- Rendering logic is pure over these entities; DOM/canvas side effects are isolated to the draw adapter.

## State Transitions
1. **Init**: canvas mounts, reads initial size/tokens/state.
2. **Sync**: on pan/zoom/resize/token change, state updates and schedules redraw.
3. **Redraw**: metrics recomputed; canvas cleared and dots painted.
4. **Dispose**: observers/listeners canceled on unmount.