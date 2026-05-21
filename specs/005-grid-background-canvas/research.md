# Research: Canvas-Rendered Dot Grid Background

## Decision 1: Move the background canvas into the transform layer
- **Decision**: Render the dot field in a new background canvas component mounted inside `#editor-grid-transform` as the lowest transformed layer, keeping note/content layers unchanged.
- **Rationale**: This makes background motion/scale naturally match note-space transforms and reduces visual mismatch risk from separately applied offsets.
- **Alternatives considered**:
  - Keep CSS gradients and tweak formulas: rejected because artifacts persist and precision control is limited.
  - Move all notes to canvas: rejected because it complicates editing and is out of scope.

## Decision 2: Reuse existing CSS custom properties as input tokens
- **Decision**: Read computed styles for existing variables (`--grid-dot-color`, `--grid-dot-core-size`, `--grid-dot-fade-size`, opacity variables, saturation) and map them to canvas draw settings.
- **Rationale**: Preserves theme integration and avoids hardcoding style constants in TS.
- **Alternatives considered**:
  - Duplicate token values in TS constants: rejected due to drift risk with CSS themes.
  - Keep all dot style in CSS only: rejected since canvas draw pipeline still needs numeric/color inputs.

## Decision 3: DPR-aware backing store with CSS-size decoupling
- **Decision**: Set canvas CSS size to viewport pixels, backing resolution to `clientSize * devicePixelRatio`, then scale context by DPR.
- **Rationale**: Standard technique to avoid blurry output on retina displays.
- **Alternatives considered**:
  - 1:1 backing store only: rejected due to blurry dots on high-DPI screens.

## Decision 4: Redraw strategy based on transform-aware offset tracking + resize observer
- **Decision**: Redraw when (`zoomLevel`, `offsetX`, `offsetY`, `gridSize`, relevant CSS vars, canvas size, DPR) change; use rAF throttling for fast interaction updates. Draw phase is computed from tracked offsets so dot origin remains stable as transforms change.
- **Rationale**: Keeps dot grid synced while minimizing redundant full redraws and eliminates drift/jitter from stale phase calculations.
- **Alternatives considered**:
  - Redraw on every React render: rejected due to unnecessary work.
  - Redraw only on pan end: rejected because user needs live feedback.

## Decision 5: Preserve vignette/background aesthetic with minimal risk
- **Decision**: Keep existing non-dot decorative background/vignette layers in CSS initially; replace only dot layer with canvas in this feature.
- **Rationale**: Reduces migration risk while solving target problem.
- **Alternatives considered**:
  - Port all gradients/vignette to canvas immediately: rejected as larger visual-diff risk and unnecessary for first migration.

## Decision 6: Future-shape readiness
- **Decision**: Keep background canvas component API explicit (`renderDotGrid(state, tokens)`), enabling additional guide/shape overlay canvas later without reworking note DOM layers.
- **Rationale**: Aligns with stated future drawing/shapes interest while keeping present scope narrow.
- **Alternatives considered**:
  - No API abstraction: rejected because it increases future refactor cost.