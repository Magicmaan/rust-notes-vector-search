# Feature Specification: Note Background Color Picker + Circular Transition

**Feature Branch**: `003-note-background-color`  
**Created**: April 25, 2026  
**Status**: Draft  
**Input**: User description: "create a plan to implement background colour modification for notes. I've began work on a menubar that pops up, you'll need to adjust the colour popup to be horizontal flex, keep rest of styles the same. For now just do red, green, blue colours for it. Once that is done, implement a smooth background transition through a circle animation, this will require using view transitions from css."

## User Scenarios and Testing

### User Story 1 - Pick Note Background Color From Menubar (Priority: P1)

A user can open the existing note menubar and choose a color chip to set that note's background color.

**Why this priority**: This is the core requested behavior.

**Independent Test**: Open menubar on a note, click each color option, verify note background updates.

**Acceptance Scenarios**:

1. **Given** a note menubar is open, **When** the user clicks Red, **Then** that note background becomes red.
2. **Given** a note menubar is open, **When** the user clicks Green, **Then** that note background becomes green.
3. **Given** a note menubar is open, **When** the user clicks Blue, **Then** that note background becomes blue.

---

### User Story 2 - Keep Existing Menubar Styling, Change Color Popup Layout (Priority: P1)

The color popup keeps its current visual style but the color list is displayed horizontally.

**Why this priority**: User requested a specific UI adjustment while preserving existing appearance.

**Independent Test**: Inspect popup and confirm color options render in one horizontal row and surrounding styles are unchanged.

**Acceptance Scenarios**:

1. **Given** the color popup opens, **When** options render, **Then** options appear in a horizontal flex row.
2. **Given** popup opens, **When** compared to current style, **Then** border/radius/spacing/trigger style remain consistent except orientation.

---

### User Story 3 - Animate Color Change With Circular View Transition (Priority: P1)

When a color is selected, the note background updates through a smooth circular reveal animation using CSS View Transitions.

**Why this priority**: User explicitly requested this transition style.

**Independent Test**: Click any color chip and verify a smooth circle reveal animation from click origin.

**Acceptance Scenarios**:

1. **Given** browser supports View Transitions, **When** a color is chosen, **Then** the background transition animates as a circle reveal.
2. **Given** browser does not support View Transitions, **When** a color is chosen, **Then** color still updates without errors.

### Edge Cases

- Repeated rapid color selections should not break note state or leave stale transition classes.
- Color updates must preserve other note data (`x/y/width/height/content/stat`).
- Existing drag/resize interactions should keep working after color changes.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow updating per-note background color from the existing note menubar.
- **FR-002**: System MUST provide exactly three color options for this phase: red, green, blue.
- **FR-003**: System MUST render color options in a horizontal flex layout in the popup.
- **FR-004**: System MUST preserve existing menubar styling outside the requested layout change.
- **FR-005**: System MUST persist selected color in note display state so rerenders retain the selection.
- **FR-006**: System MUST animate background color updates using CSS View Transitions with circular reveal when supported.
- **FR-007**: System MUST gracefully fallback to instant update when View Transitions are unsupported.

### Non-Functional Requirements

- **NFR-001 (Smoothness)**: Color change animation should feel smooth and not visibly block input.
- **NFR-002 (Compatibility)**: Existing drag/resize and note rendering behavior should remain unchanged.
- **NFR-003 (Scope Control)**: Keep implementation localized to note menubar, note preview styling, and minimal type/model updates.

### Key Entities

- **NoteDisplay.backgroundColor**: Optional color token/hex persisted on each note display item.
- **ColorOption**: One of three predefined values (`red`, `green`, `blue`) with display swatch value.
- **TransitionOrigin**: Pointer coordinates used by CSS to animate circular reveal.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All three color options update target note background in manual test.
- **SC-002**: Popup options are displayed horizontally with existing style preserved.
- **SC-003**: View transition circle animation is visible on supported browsers for every color selection.
- **SC-004**: No regression in drag/resize behavior during 20 manual interactions after color changes.
