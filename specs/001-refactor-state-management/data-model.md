# Data Model: Note Drag and Snap Redesign

## Entity: NoteDragSession
- Fields:
  - `pointerId: number | null`
  - `startScreenX: number`
  - `startScreenY: number`
  - `offsetX: number`
  - `offsetY: number`
  - `phase: 'idle' | 'pressed' | 'dragging' | 'finalizing'`
- Validation Rules:
  - `pointerId` must be unique per active session
  - only one active session per note preview

## Entity: DragFinalizeIntent
- Fields:
  - `shouldCommit: boolean`
  - `finalized: boolean`
- Invariant:
  - finalization executes at most once per session

## Entity: DragOwnership
- Fields:
  - `owner: 'none' | 'note' | 'canvas'`
- Invariant:
  - note and canvas cannot own the same pointer stream simultaneously

## Entity: SnapCandidate
- Inputs:
  - drag delta in world/grid units
  - note origin in grid coordinates
  - `gridSize`
- Output:
  - `snappedX`, `snappedY`
- Validation Rules:
  - reject negative coordinates
  - apply occupancy validation before commit

## Entity: DragPreviewTransform
- Inputs:
  - note origin
  - transient drag offset
- Output:
  - visual transform for in-flight preview only
- Invariant:
  - preview transform is cleared during finalize
