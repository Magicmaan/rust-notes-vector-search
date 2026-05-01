# Note Resizing via Right-Click Drag - Implementation Plan

## Overview
Add note resizing capability triggered by right-click drag (secondary pointer button), complementing the existing left-click drag positioning system. The resize interaction will:
- Activate on `button === 2` (right-click) or pointer `isPrimary === false`
- Update `width` and `height` (grid units) instead of `x` and `y`
- Maintain snap-to-grid for dimension changes
- Reuse existing grid metrics, positioning, and collision detection patterns
- Be isolated in a new `useResizeInteraction` hook

## Design Principles

### 1. **Collision Avoidance with Drag**
- Drag hook: `button === 0` (left/primary pointer)
- Resize hook: `button === 2` (right-click) or secondary pointer
- Both hooks listen to the same `onPointerDown` but check button type first
- No interference: each handles its own pointer lifecycle independently

### 2. **Code Reuse & Patterns**
Leverage existing architecture:
- **GridMetrics**: Reuse `cellWidth`, `cellHeight` for dimension calculations
- **PositioningCallbacks**: Reuse `renderAtPixelPosition` to update `--width` and `--height` CSS variables
- **Store API**: Reuse `updateElement`, `isAreaFree`, and collision detection
- **Session state machine**: Same pattern as drag (idle → active → resizing → finalize)
- **RAF scheduling**: Use existing `scheduleRenderFromSession` flow for smooth visual updates

### 3. **CSS-First Rendering**
- All visual updates during resize use CSS variables: `--width`, `--height`
- No direct DOM manipulation during interaction
- Pointer capture for cross-boundary resize tracking
- Cursor indication via data attributes (e.g., `data-resizing="true"`)

## Hook Architecture: `useResizeInteraction`

### Input Interface
```typescript
interface UseResizeInteractionInput {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  element: NoteDisplay;
  grid: GridMetrics;
  store: {
    updateElement: (id: string, newElement: NoteDisplay) => void;
    isAreaFree: (x: number, y: number, width: number, height: number, ignoreId?: string) => boolean;
    gridSize: [number, number];
    zoomLevel: number;
  };
  positioning: PositioningCallbacks;
}
```

### Output Interface
```typescript
interface ResizeInteraction {
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}
```

### Session State Structure
```typescript
interface ResizeSessionState {
  active: boolean;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPixelWidth: number;
  startPixelHeight: number;
  deltaPixelWidth: number;
  deltaPixelHeight: number;
  didResize: boolean;
}
```

## Implementation Details

### Phase 1: Session Initialization (onPointerDown)
1. Check `e.button === 2` (right/secondary button)
2. Prevent panning conflicts (check `!store.isPanning`)
3. Capture initial state:
   - `startClientX/Y` from pointer event
   - `startPixelWidth/Height` from `element.width/height * grid.cellWidth/Height`
   - Initialize delta accumulators to 0
4. Call `e.currentTarget.setPointerCapture(e.pointerId)`
5. Set `data-resizing="true"` for CSS cursor changes
6. Attach window listeners for `pointermove` and `pointerup`

### Phase 2: Drag Accumulation (onPointerMove)
1. Calculate deltas:
   - `deltaPixelWidth = e.clientX - startClientX` (right-edge resize)
   - `deltaPixelHeight = e.clientY - startClientY` (bottom-edge resize)
2. Apply zoom compensation: `deltaPixelWidth / grid.safeZoom`
3. Render immediately via `positioning.renderAtPixelPosition()`:
   - New pixel width = `startPixelWidth + deltaPixelWidth`
   - New pixel height = `startPixelHeight + deltaPixelHeight`
4. Update CSS variables during drag (visual feedback locked to pointer)

### Phase 3: Finalization (onPointerUp)
1. If `didResize && shouldCommit`:
   - Snap dimensions to grid: `snapToMultiple(candidatePixelWidth, cellWidth)`
   - Convert back to grid units: `snappedWidth = snappedPixelWidth / cellWidth`
   - Check `isAreaFree` with new dimensions at current position
   - If collision: find nearest free size OR revert to original
   - Commit via `store.updateElement()`
2. Cleanup:
   - Clear pointer capture
   - Remove window listeners
   - Set `data-resizing="false"`
   - Reset all session state

### Constraints & Validation
```typescript
const MIN_CELL_WIDTH = 2;  // Prevent notes from becoming too small
const MIN_CELL_HEIGHT = 2;
const MAX_CELL_WIDTH = gridSize[0]; // Prevent oversizing
const MAX_CELL_HEIGHT = gridSize[1];

// During finalization:
const clampedWidth = Math.max(MIN_CELL_WIDTH, Math.min(snappedWidth, MAX_CELL_WIDTH));
const clampedHeight = Math.max(MIN_CELL_HEIGHT, Math.min(snappedHeight, MAX_CELL_HEIGHT));
```

## Integration in preview.tsx

### Usage
```typescript
// Import hook
import { useResizeInteraction } from "./hooks/useResizeInteraction";

// Inside NotePreview component:
const resize = useResizeInteraction({
  wrapperRef,
  element,
  grid,
  store: {
    updateElement,
    isAreaFree,
    gridSize,
    zoomLevel,
  },
  positioning,
});

// Add handler to wrapper (same div as drag):
<div
  ref={wrapperRef}
  className="absolute note flex p-1 group..."
  onPointerDown={(e) => {
    if (e.button === 2) {
      resize.handlePointerDown(e);  // Right-click → resize
    } else if (e.button === 0) {
      drag.handlePointerDown(e);    // Left-click → drag
    }
  }}
  // ... rest of props
>
```

**Alternative (Simplified)**: If only right-click needed, attach directly without conditional:
```typescript
// Resize hook internally checks button === 2
<div
  ref={wrapperRef}
  onPointerDown={(e) => {
    drag.handlePointerDown(e);
    resize.handlePointerDown(e);  // Both check their button types
  }}
/>
```

## CSS Modifications

### Cursor Feedback
```css
.note {
  /* Default cursor during normal interaction */
  cursor: grab;
}

.note:data-resizing="true" {
  /* Resize active - lock cursor to SE corner */
  cursor: se-resize;
}

.note:hover {
  /* Optional: hint resize availability on hover */
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: linear-gradient(135deg, transparent 50%, var(--border) 50%);
    cursor: se-resize;
  }
}
```

### Resize Handle (Optional Visual Indicator)
Add a Southeast corner handle via CSS:
```css
.note::before {
  content: "";
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  @apply pointer-events-auto;
}
```

## File Structure
```
app/components/note/hooks/
  ├── useGridMetrics.ts       (existing)
  ├── usePositionRendering.ts (existing)
  ├── useDragInteraction.ts   (existing)
  ├── useExpandNavigation.ts  (existing)
  └── useResizeInteraction.ts (NEW)
```

## State Management Considerations

### No New Store Slices Required
- Resize updates flow through existing `updateElement` action
- `NoteDisplay.width` and `NoteDisplay.height` already exist
- Collision detection via existing `isAreaFree` hook
- No additional UI state needed (resize session is local to hook)

### Optional: Resize Handles
If multiple resize handles are desired in future (corners, edges):
- Store handle config in component local state
- Calculate resize direction from pointer position
- Adjust width/height differently per direction

## Testing Strategy

1. **Unit Tests**:
   - Session state machine (initialization, finalization)
   - Dimension snapping logic
   - Collision detection with resize
   - Boundary clamping (min/max sizes)

2. **Integration Tests**:
   - Right-click + drag triggers resize (not pan, not note drag)
   - CSS variables update during drag
   - Store commit on release
   - Visual revert on collision
   - Multiple notes resizing independently

3. **Manual Testing**:
   - Right-click SE corner of note → drag to resize
   - Resize into occupied space → snap to nearest free or revert
   - Resize across zoom levels → dimensions scale correctly
   - While panning (space+drag) → resize disabled
   - While dragging (left-click) → no resize interference

## Migration Path

### Phase A (MVP): SE Corner Resize Only
- Single resize direction (bottom-right)
- Simplest implementation, covers most use cases

### Phase B (Enhancement): Multi-Handle Resize
- Corners (NW, NE, SW, SE) and edges (N, S, E, W)
- Direction detection logic
- Maintain aspect ratio option

### Phase C (Polish): Visual Feedback
- Animated resize handles
- Dimension tooltip during interaction
- Undo/redo support for resize operations

## Known Challenges & Mitigations

| Challenge | Mitigation |
|-----------|-----------|
| **Right-click context menu** | Suppress via `e.preventDefault()` in handler |
| **Touch device SE resize** | Use `pointer` events (not `mouse` events) for universal support |
| **Zoom level compensation** | Divide deltas by `grid.safeZoom` during accumulation |
| **Rapid size changes** | RAF scheduling + collision detection prevent visual artifacts |
| **Overlapping collisions** | Reuse `findNearestFree` with new dimensions as fallback |
| **Aspect ratio locking** | Store original ratio, scale both dimensions proportionally |

## Performance Considerations

- **RAF scheduling**: usePositionRendering already implements RAF batching
- **Memoization**: Grid metrics and positioning callbacks already memoized
- **Event delegation**: Pointer capture prevents event bubbling overhead
- **Collision detection**: Spatial index query same cost as drag positioning

## Summary

The resize interaction leverages the existing drag system's architecture:
- **Hook pattern**: Isolated concern, reusable input/output interface
- **Session state machine**: Proven pattern for multi-phase interactions
- **CSS-first rendering**: No paint thrashing, GPU-accelerated transforms
- **Store integration**: Reuse existing collision detection and spatial indexing
- **No breaking changes**: All existing drag functionality remains unchanged

The new `useResizeInteraction` hook slots directly into `preview.tsx` without modifying drag or positioning logic, following the established code style and performance characteristics.
