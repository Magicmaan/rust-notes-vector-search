# Contract: Directional Resize Interaction

## Scope
Internal UI interaction contract for note resizing via right-click pointer drag.

## Inputs
- Pointer down event on note wrapper (`button === 2`)
- Pointer move and pointer up events for same pointer id
- Current note geometry (`x`, `y`, `width`, `height`) in grid units
- Grid metrics (`cellWidth`, `cellHeight`, `safeZoom`)

## Anchor Resolution Contract
At pointer-down, implementation MUST resolve a stable `ResizeAnchor` using pointer position in note-local pixel space:
- `left` if local x is within left edge zone
- `right` if local x is within right edge zone
- `top` if local y is within top edge zone
- `bottom` if local y is within bottom edge zone
- Corner anchors combine one horizontal and one vertical edge
- If ambiguous, fallback anchor MUST be `{ right: true, bottom: true }`

## Lifecycle Contract
- Activation remains right-click only.
- Threshold gating remains in place before `didResize=true`.
- During active resize, visual CSS vars `--width`/`--height` MUST update every RAF tick.
- If anchor includes left/top, visual position (`--offset-x`/`--offset-y`) MUST also update.
- Finalization MUST run once per pointer session and commit snapped grid geometry.

## Commit Contract
On commit, implementation MUST:
1. Convert candidate pixels to snapped grid-aligned pixels.
2. Enforce minimum spans.
3. Convert to grid units.
4. Update `NoteDisplay` with:
   - `width/height` always
   - `x/y` when left/top anchors were active

## Backward Compatibility
- Existing SE behavior MUST remain the default path.
- Existing drag-vs-resize input routing remains unchanged.
