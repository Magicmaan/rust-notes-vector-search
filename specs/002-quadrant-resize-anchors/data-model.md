# Data Model: Quadrant-Based Resize Anchors

## Entity: ResizeAnchor
- Purpose: Encodes which edges are active during an in-progress resize.
- Fields:
  - `left: boolean`
  - `right: boolean`
  - `top: boolean`
  - `bottom: boolean`
- Validation rules:
  - At least one horizontal edge must be active (`left || right`).
  - At least one vertical edge must be active (`top || bottom`).
  - `left` and `right` cannot both be true unless intentionally supporting center-scale (out of scope here).
  - `top` and `bottom` cannot both be true unless intentionally supporting center-scale (out of scope here).
- Notes:
  - Corners are represented by one horizontal + one vertical active edge.

## Entity: ResizeSessionState (extended)
- Purpose: Tracks interaction lifecycle and starting geometry for the current pointer session.
- Existing fields (preserved):
  - `active`, `pointerId`, `startClientX`, `startClientY`
  - `startPixelWidth`, `startPixelHeight`
  - `deltaPixelWidth`, `deltaPixelHeight`
  - `didResize`
- New fields:
  - `startPixelX: number` (note origin in pixels at resize start)
  - `startPixelY: number`
  - `anchor: ResizeAnchor`
- Validation rules:
  - `anchor` must be set before first candidate computation.
  - `startPixelX/Y` and `startPixelWidth/Height` are immutable during one session.

## Entity: ResizeCandidate
- Purpose: Anchor-aware intermediate geometry before snapping and commit.
- Fields:
  - `candidatePixelX: number`
  - `candidatePixelY: number`
  - `candidatePixelWidth: number`
  - `candidatePixelHeight: number`
- Derivation rules:
  - Right anchor active: `width = startWidth + deltaX`
  - Left anchor active: `width = startWidth - deltaX`, `x = startX + deltaX`
  - Bottom anchor active: `height = startHeight + deltaY`
  - Top anchor active: `height = startHeight - deltaY`, `y = startY + deltaY`
- Constraints:
  - Clamp to minimum pixel size derived from min grid spans.
  - Final committed values are snapped to grid and converted to grid units.

## Persisted Domain Entity: NoteDisplay
- Purpose: Existing persisted grid entity for notes.
- Relevant fields:
  - `x`, `y` (grid coordinates)
  - `width`, `height` (grid spans)
- State transition changes:
  - Existing resize updated only `width/height`.
  - Directional resize may update `x/y` in addition to `width/height` when anchor includes left/top.
