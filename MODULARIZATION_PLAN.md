# NotePreview Component Modularization Plan

## Overview
Refactor [preview.tsx](app/components/note/preview.tsx) from a monolithic component (~400 lines) into focused, single-purpose custom hooks. The component function will become a thin render layer delegating all logic to hooks.

---

## Current Complexity
**Main Logic Areas:**
1. **Drag session management** - Pointer events, session state machine, window listeners
2. **Position rendering** - CSS variable updates, RAF scheduling, pixel calculations
3. **Grid calculations** - Cell dimensions, zoom scaling, snapping logic
4. **Store integration** - Multiple Zustand selectors, element updates
5. **Navigation/expansion** - Double-click timeout, navigation routing
6. **Cleanup & lifecycle** - Unmount handlers, event listener cleanup

**Current Issues:**
- 10+ refs managing different concerns
- 15+ callbacks with complex dependency chains
- Three separate useEffect hooks for different purposes
- 250+ lines of business logic in component body
- Hard to test individual behaviors
- Difficult to understand data flow
- Easy to break cleanup logic

---

## Modularization Strategy

### Dependency Graph (hooks → sub-hooks)
```
NotePreview
├── useGridCalculations           [pure]
├── useStoreSelectors             [Zustand integration]
├── usePositionRendering          [DOM + RAF]
│   └── useGridCalculations       (reuse)
├── useDragSession                [pointer events + state machine]
│   ├── usePositionRendering      (reuse)
│   ├── useStoreSelectors         (reuse)
│   └── useGridCalculations       (reuse)
├── useExpandNavigation           [navigation logic]
└── useUnmountCleanup             [lifecycle]
    ├── useDragSession            (reuse)
    └── useExpandNavigation       (reuse)
```

---

## Hook Specifications

### 1. `useGridCalculations` ✓ Pure Hook
**Purpose:** Calculate grid-based dimensions (memoized, no side effects)

**Input:**
- `gridSizeWidth?: number`
- `gridSizeHeight?: number`
- `zoomLevel: number`
- `elementWidth: number`
- `elementHeight: number`
- `elementX: number`
- `elementY: number`

**Output:**
```typescript
{
  cellWidth: number;        // Grid cell width in pixels
  cellHeight: number;       // Grid cell height in pixels
  safeZoom: number;         // Zoom level clamped to [0.001, ∞)
  pixelSize: Vector2D;      // Element size in pixels (w*cw, h*ch)
  offset: Vector2D;         // Element position in pixels (x*cw, y*ch)
}
```

**Logic:**
- Memoize all calculations
- Default grid size to 16 if missing
- Clamp zoom to safe range (smallest representable value to avoid division by zero)

**Comments needed:**
- Explain zoom clamping strategy
- Document why grid size has default fallback

---

### 2. `useStoreSelectors` ✓ Integration Hook
**Purpose:** Centralize all Zustand store interactions (avoid repeated imports)

**NOTE:** Uses individual selectors (NOT aggregate objects) to prevent infinite loops per repo patterns

**Input:**
- `element: NoteDisplay`

**Output:**
```typescript
{
  isPanning: boolean;
  updateElement: (id: string, element: NoteDisplay) => void;
  isAreaFree: (x, y, w, h, excludeId) => boolean;
  findNearestFree: (x, y, w, h, excludeId, searchRadius) => {x, y} | null;
  gridSize: [number, number];
  zoomLevel: number;
}
```

**Logic:**
- 7 separate `useEditorGridStore` calls with individual selectors
- Keep destructuring at hook level
- Element prop only used for dependency tracking

---

### 3. `usePositionRendering` ✓ DOM/RAF Hook
**Purpose:** Handle CSS variable updates and render scheduling

**Input:**
```typescript
{
  wrapperRef: React.RefObject<HTMLDivElement>;
  pixelSize: Vector2D;
  cellWidth: number;
  cellHeight: number;
  element: NoteDisplay;
}
```

**Output:**
```typescript
{
  renderAtPixelPosition: (pixelX: number, pixelY: number) => void;
  renderFromStore: () => void;
  scheduleRenderFromSession: (deltaX: number, deltaY: number, startX: number, startY: number) => void;
  cancelPendingFrame: () => void;
}
```

**Internal Refs:**
- `rafRef` - RAF ID tracking
- `elementRef` - Current element snapshot

**Logic:**
- Direct CSS variable setProperty calls (no state)
- RAF scheduling to batch DOM updates
- Always render with "px" units
- renderFromStore uses element snapshot from ref to avoid stale closures

**Comments needed:**
- Explain RAF scheduling double-check pattern ("if rafRef already pending, return")
- Why snapshots captured in refs vs passed as params
- CSS variable delegation pattern

---

### 4. `useDragSession` ✓ Complex State Machine Hook
**Purpose:** Manage entire drag workflow from pointer down → finalization with collision detection

**Input:**
```typescript
{
  wrapperRef: React.RefObject<HTMLDivElement>;
  isPanning: boolean;
  cellWidth: number;
  cellHeight: number;
  safeZoom: number;
  pixelSize: Vector2D;
  // Rendering callbacks
  renderAtPixelPosition: (x, y) => void;
  scheduleRenderFromSession: (dx, dy, sx, sy) => void;
  cancelPendingFrame: () => void;
  renderFromStore: () => void;
  // Store callbacks
  updateElement: (id, element) => void;
  isAreaFree: (x, y, w, h, id) => boolean;
  findNearestFree: (x, y, w, h, id, radius) => {x,y}|null;
  element: NoteDisplay;
}
```

**Output:**
```typescript
{
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  finalizeSession: (shouldCommit: boolean) => void;
}
```

**Internal State Machine:**
```
idle → [pointerdown] → active
active → [pointermove > threshold] → dragging (visual feedback)
dragging → [pointerup | pointercancel | blur] → idle (with optional commit)
```

**Internal Refs:**
- `sessionRef` - Current drag session metadata:
  - `active: boolean` - Is drag session ongoing?
  - `pointerId: number` - Which pointer triggered drag?
  - `startClientX/Y: number` - Initial mouse position in viewport coords
  - `startPixelX/Y: number` - Initial element position in grid pixels
  - `deltaPixelX/Y: number` - How far moved in grid pixels (adjusted for zoom)
  - `didDrag: boolean` - Has distance threshold been crossed?

- `removeWindowListenersRef` - Cleanup function reference

**Window Event Listeners:**
- `pointermove` → Update delta, schedule render, emit drag state
- `pointerup` → Snap-to-grid, collision detect, commit or revert
- `pointercancel` → Abort drag, revert position
- `blur` → Force finalize (user switched tabs)

**Snap & Collision Logic:**
```
1. Calculate candidate = start + delta (unsnapped pixels)
2. Snap to grid cell: candidate → nearest multiple of cellWidth/Height
3. Check if area free at snapped position
   ✓ YES → Update store with snapped position
   ✗ NO → Find nearest free space within SNAP_SEARCH_RADIUS
      ✓ Found → Update store with fallback position
      ✗ Not found → Don't commit, visual render stays until pointerup
4. Always render visual update immediately (avoid stale-prop lag)
```

**Comments needed:**
- State machine diagram (ascii or prose)
- Why distance threshold prevents accidental drags on click
- Why zoom adjustment needed on deltaPixelX/Y
- Snap-to-grid + collision detection algorithm explanation
- Why "didDrag" flag needed separately from "active" flag
- Why pointer capture/release important
- Window listeners with capture phase (true) - why needed?

---

### 5. `useExpandNavigation` ✓ Navigation Hook
**Purpose:** Handle double-click to navigate to expanded note view

**Input:**
```typescript
{
  elementId: string;
  navigationDelay?: number; // default: EXPAND_DELAY_MS
}
```

**Output:**
```typescript
{
  onDoubleClick: () => void;
  cancel: () => void; // Explicit cleanup if needed
}
```

**Internal Refs:**
- `expandTimeoutRef` - Pending navigation timeout ID

**Logic:**
- Debounce navigation via timeout
- Allow cancel before timeout fires

**Comments needed:**
- Why delay design chosen (vs immediate nav)
- How delay prevents accidental double-navigation

---

### 6. `useUnmountCleanup` ✓ Lifecycle Hook
**Purpose:** Ensure all pending operations cancelled on unmount

**Input:**
```typescript
{
  finalizeSession: (shouldCommit: boolean) => void;
  cancelNavigationTimeout: () => void;
}
```

**Output:** None (just manages side effects)

**Logic:**
- Register effect that cleans up in return function
- Use ref wrapper to capture latest finalizeSession (avoid closure issues)

**Comments needed:**
- Why ref wrapper needed for finalizeSession
- Cleanup order matters? (session before nav?)

---

## Refactored Component Structure

### Before: 380 lines
```typescript
export default function NotePreview({ element }) {
  // 10+ refs
  // 15+ callbacks
  // 3 useEffect + lots of logic
  // 1 return with JSX
}
```

### After: ~80 lines
```typescript
export default function NotePreview({ element }: { element: NoteDisplay }) {
  // Compute grid metrics
  const grid = useGridCalculations(...);
  
  // Get store exports
  const store = useStoreSelectors(element);
  
  // Setup DOM rendering pipeline
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rendering = usePositionRendering({...});
  
  // Wire up drag interaction
  const drag = useDragSession({...});
  
  // Wire up navigation
  const nav = useExpandNavigation(element.id);
  
  // Setup cleanup
  useUnmountCleanup({...});

  // Minimal return: just JSX wiring
  return (
    <div
      ref={wrapperRef}
      onPointerDown={drag.handlePointerDown}
      data-dragging="false"
      style={{/* CSS vars from grid + rendering */}}
    >
      <button onDoubleClick={nav.onDoubleClick}>
        test
      </button>
      <NoteMenubar element={element} />
    </div>
  );
}
```

---

## Implementation Order

1. ✅ `useGridCalculations` - Pure, no dependencies
2. ✅ `useStoreSelectors` - Simple wrapper, clarifies integration
3. ✅ `usePositionRendering` - DOM/RAF layer, no callbacks yet
4. ✅ `useDragSession` - Complex, uses all above
5. ✅ `useExpandNavigation` - Simple, isolated
6. ✅ `useUnmountCleanup` - Final lifecycle manager
7. ✅ Refactor component - Wire it all together

---

## Comment Strategy

**Explain:**
- ✅ State machine transitions and conditions
- ✅ Non-obvious math (zoom adjustment, snap algorithm)
- ✅ Why refs needed instead of state
- ✅ Window listener lifecycle
- ✅ Performance decisions (RAF scheduling, memoization)
- ✅ Ordering dependencies (cleanup order matters)

**Skip (too obvious):**
- ✗ "Set x to y"
- ✗ "Check if active"
- ✗ "Calculate offset"
- ✗ Loop/conditional labels

---

## Testing Surface Area
After modularization, easy to test:
- ✅ Grid calculations in isolation (unit test)
- ✅ Snap algorithm with mock collisions
- ✅ Drag state transitions (move > threshold → dragging)
- ✅ Cleanup handlers fire on unmount
- ✅ Navigation timeout debounce

---

## File Structure
```
app/
  components/
    note/
      hooks/
        useGridCalculations.ts      (60 lines)
        useStoreSelectors.ts        (40 lines)
        usePositionRendering.ts     (90 lines)
        useDragSession.ts           (180 lines) ← Most complex
        useExpandNavigation.ts      (40 lines)
        useUnmountCleanup.ts        (30 lines)
      preview.tsx                   (80 lines) ← Thin component
      menubar.tsx                   (unchanged)
```

---

## Next Steps
- [ ] Create `hooks/` directory
- [ ] Implement hooks in order listed
- [ ] Migrate preview.tsx to use new hooks
- [ ] Add narrative comments explaining complex logic
- [ ] Update any existing prop drilling/contexts if needed
- [ ] Test drag behavior in browser
