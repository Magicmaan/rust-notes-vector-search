# Quickstart: Note Background Color Picker + Circular Transition

## Goal
Add a horizontal color picker (red, green, blue) in the note menubar and animate note background changes with a circular View Transition.

## Files in Scope
- `app/components/note/menubar/index.tsx`
- `app/components/note/preview.tsx`
- `app/styles/note.css`
- `app/types.ts`
- `app/components/note/hooks/useDragInteraction.ts` (preserve new field)
- `app/components/note/hooks/useResizeInteraction.ts` (preserve new field)
- `app/components/canvas/add-cells-layer.tsx` and `app/app.tsx` (constructor compatibility)

## Implementation Steps
1. Extend `NoteDisplay` with optional `backgroundColor` and constructor support.
2. Ensure all `new NoteDisplay(...)` calls preserve `backgroundColor` when cloning existing notes.
3. Update menubar popup option container to horizontal flex.
4. Replace placeholder/repeated chips with exactly three chips: red, green, blue.
5. On chip click, run view transition (if supported) and update note `backgroundColor`.
6. In note preview, map selected color to `--background` (and hover/active derivatives).
7. Add CSS for circular reveal animation using view transition pseudo-elements and click-origin vars.

## Manual Verification Checklist
1. Open menubar: popup options are horizontal.
2. Red/green/blue each set note background correctly.
3. Circle reveal animation appears on each selection (supported environments).
4. Fallback path still updates color if View Transition API is missing.
5. Drag note after color change; color persists.
6. Resize note after color change; color persists.
