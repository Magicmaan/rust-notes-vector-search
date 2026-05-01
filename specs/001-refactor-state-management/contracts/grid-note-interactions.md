# Contract: Grid Note Interactions

## Scope
Defines store/UI behavior contract for manual grid-coordinate positioning, drag/drop, and directional add-note controls.

## Store Contract

### GridSlice
- Must provide:
  - `gridSize: number`
  - `setGridSize(gridSize: number): void`
- Invariant:
  - `gridSize` is positive and used as the only conversion scalar from grid to pixels.

### ElementsSlice
- Existing methods used:
  - `addElement(element)`
  - `updateElement(id, updatedElement)`
  - `getElement(id)`
- Added helper behavior (direct method or colocated utility):
  - `isAreaFree(x, y, width, height, excludeId?): boolean`
  - `findOccupyingIds(x, y, width, height, excludeId?): string[]` (optional)

## Rendering Contract

### NotePreview Projection
- Input:
  - `element` in grid units
  - `gridSize` in pixels
- Output CSS vars:
  - `--position-x: ${element.x * gridSize}px`
  - `--position-y: ${element.y * gridSize}px`
  - `--note-width: ${element.width * gridSize}px`
  - `--note-height: ${element.height * gridSize}px`

## Drag Contract

### Start
- Trigger: pointer drag on note preview shell
- Action:
  - Mark dragging state true (`setIsDragging(true)`)

### Move
- Trigger: ongoing drag
- Action:
  - Optional candidate preview; no store commit required

### Stop
- Trigger: `react-draggable` `onStop`
- Required steps:
  1. Convert pixel delta to grid coordinate candidate.
  2. Validate destination occupancy excluding dragged note.
  3. If free, commit `updateElement` with new `x/y`.
  4. If occupied, reject commit and keep previous coordinates.
  5. Mark dragging state false.

## Add-Button Contract

### Directional Targets
- Top: `(x, y - 1)`
- Right: `(x + width, y)`
- Bottom: `(x, y + height)`
- Left: `(x - 1, y)`

### Behavior
- Button appears around each note preview.
- On click:
  1. Compute target cell.
  2. Validate `isAreaFree` for new-note default size.
  3. If free, create placeholder note and insert with `addElement`.
  4. If blocked, no insertion.

## Non-Goals
- No resize behavior.
- No persistence layer changes.
- No react-grid-layout runtime usage for note positioning.
