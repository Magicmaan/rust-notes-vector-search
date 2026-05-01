# Data Model: Note Background Color Picker + Circular Transition

## Entity: NoteDisplay (extended)
- Purpose: Existing visual note entity used by editor interactions and rendering.
- Existing fields:
  - `id`, `note`, `x`, `y`, `width`, `height`, `stat`
- New field:
  - `backgroundColor?: string`
- Validation rules:
  - Optional; when present must be one of current supported palette values (`#ef4444`, `#22c55e`, `#3b82f6`) for this phase.
- State transitions:
  - Set on color selection from menubar.
  - Must be preserved across drag/resize updates that rebuild `NoteDisplay`.

## Entity: ColorOption
- Purpose: Defines available user-selectable background colors in menubar.
- Fields:
  - `id: "red" | "green" | "blue"`
  - `value: string` (hex color)
- Validation rules:
  - Options are fixed to three entries for current scope.

## Entity: TransitionOrigin
- Purpose: Defines where circle reveal starts during view transition.
- Fields:
  - `x: number` (viewport px)
  - `y: number` (viewport px)
- Derivation:
  - Captured from click pointer event on color option.
