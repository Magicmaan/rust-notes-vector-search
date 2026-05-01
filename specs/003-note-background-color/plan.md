# Implementation Plan: Note Background Color Picker + Circular Transition

**Branch**: `003-note-background-color` | **Date**: 2026-04-25 | **Spec**: `/specs/003-note-background-color/spec.md`
**Input**: Feature specification from `/specs/003-note-background-color/spec.md`

## Summary

Add per-note background color selection through the existing note menubar using three options (red, green, blue), switch the popup option list to horizontal flex while preserving current style, and animate color changes with a circle reveal using CSS View Transitions (with non-support fallback).

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19 (Electron renderer)  
**Primary Dependencies**: Electron, React, Zustand, TailwindCSS, Base UI Menubar/Menu, Vite  
**Storage**: In-memory editor store (`NoteDisplay` in Zustand), no external persistence change  
**Testing**: Manual interaction verification + lint/typecheck  
**Target Platform**: Desktop app (Electron on macOS/Linux/Windows)  
**Project Type**: Desktop application (Electron + React frontend)  
**Performance Goals**: Preserve smooth interactive note UX (existing 60 FPS feel)  
**Constraints**: Keep current menubar style; only adjust popup layout to horizontal; only red/green/blue for now; no branch operations  
**Scale/Scope**: Small localized changes in `app/components/note/menubar/index.tsx`, `app/components/note/preview.tsx`, `app/styles/note.css`, and `app/types.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` contains placeholders and no enforceable MUST/SHOULD principles.
- Result (Pre-Phase 0): PASS (no explicit constitutional constraints to violate).
- Result (Post-Phase 1): PASS (design remains minimal and localized).

## Project Structure

### Documentation (this feature)

```text
specs/003-note-background-color/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── note-background-color-contract.md
└── tasks.md              # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── components/
│   └── note/
│       ├── preview.tsx
│       └── menubar/
│           └── index.tsx
├── styles/
│   └── note.css
└── types.ts

specs/
└── 003-note-background-color/
```

**Structure Decision**: Keep the existing single-project Electron + React structure and constrain implementation to note UI/state files only.

## Phase 0: Research & Decisions

Research outcomes are documented in `/specs/003-note-background-color/research.md`.

Resolved clarifications:
- Per-note color storage strategy in existing `NoteDisplay` model.
- Horizontal popup layout strategy without restyling unrelated menubar elements.
- CSS View Transition circle-reveal pattern with fallback.

## Phase 1: Design & Contracts

Design artifacts:
- Data model: `/specs/003-note-background-color/data-model.md`
- Contract: `/specs/003-note-background-color/contracts/note-background-color-contract.md`
- Implementation guide: `/specs/003-note-background-color/quickstart.md`

Design intent:
- Add optional `backgroundColor` to `NoteDisplay` and preserve value in update flows.
- Render three color chips in a horizontal popup row.
- Trigger `document.startViewTransition` on color selection and drive circle reveal via CSS variables.

## Implementation Strategy (Minimal Change)

1. Extend `NoteDisplay` with optional `backgroundColor`.
2. Preserve `backgroundColor` when notes are updated via drag/resize.
3. Update menubar color popup to horizontal options (red, green, blue).
4. Wire color chip selection to `updateElement` for the target note.
5. Apply selected color in note preview CSS variables.
6. Add CSS View Transition circle animation and unsupported-browser fallback.

## Risks & Mitigations

- Risk: View Transitions unsupported in some runtimes.
  - Mitigation: Feature-detect `document.startViewTransition`; fallback to direct state update.
- Risk: New note field dropped during drag/resize updates.
  - Mitigation: Pass through `backgroundColor` in all `new NoteDisplay({...})` update paths.
- Risk: Popup layout change accidentally alters existing style.
  - Mitigation: Keep existing class stack and adjust only flex direction/gap sizing for option row.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
