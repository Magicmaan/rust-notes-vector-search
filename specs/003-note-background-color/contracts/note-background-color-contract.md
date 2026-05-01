# Contract: Note Background Color Update

## Scope
Internal UI contract for selecting note background colors from the note menubar.

## Inputs
- Target note id
- Selected color (`red`, `green`, `blue`) mapped to hex value
- Pointer event coordinates for transition origin

## Menubar UI Contract
- Existing trigger remains unchanged.
- Popup content keeps current visual style and spacing language.
- Color options render as a horizontal flex row.
- Exactly three options are rendered for now: red, green, blue.

## Update Contract
- On option click, system updates the target `NoteDisplay` with selected `backgroundColor`.
- System preserves all existing note fields (`x`, `y`, `width`, `height`, `note`, `stat`) on update.

## Animation Contract
- If `document.startViewTransition` exists:
1. Set transition origin CSS variables using click coordinates.
2. Execute note color update inside view transition callback.
3. Apply CSS animation to reveal new state via expanding circle.
- If unavailable:
1. Perform direct note color update with no transition.

## Backward Compatibility
- Drag/resize workflows remain unchanged.
- Notes without selected color continue using default background variables.
