# Implementation Plan: Quadrant-Based Note Resize Anchors

**Branch**: `002-quadrant-resize-anchors` | **Date**: 2026-04-25 | **Spec**: `/specs/002-quadrant-resize-anchors/spec.md`
**Input**: Feature specification from `/specs/002-quadrant-resize-anchors/spec.md`

## Summary

Add edge/corner-aware resize anchoring to the existing right-click resize interaction with minimal changes: resolve anchor at pointer-down, keep the current resize lifecycle intact, and extend candidate/final geometry math so left/top starts also move `x/y` while preserving current snap, threshold, RAF, and finalize behavior.

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19 (Electron renderer)  
**Primary Dependencies**: Electron, React, Zustand, TailwindCSS, Vite  
**Storage**: In-memory editor store (Zustand), no persistence schema change  
**Testing**: Manual interaction verification (current project pattern), lint via ESLint  
**Target Platform**: Desktop app (Electron on macOS/Linux/Windows)  
**Project Type**: Desktop application (Electron + React frontend)  
**Performance Goals**: Maintain existing smooth interactive resize behavior (target 60 FPS interaction path)  
**Constraints**: Minimal code change footprint; preserve current right-click resize semantics and no regression in existing finalize/snap path  
**Scale/Scope**: Single interaction hook-focused change (`useResizeInteraction.ts`) with small optional style update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` contains placeholders and no enforceable MUST/SHOULD principles.
- Result (Pre-Phase 0): PASS (no explicit constitutional constraints to violate).
- Result (Post-Phase 1): PASS (design remains consistent with existing project constraints and minimal-change objective).

## Project Structure

### Documentation (this feature)

```text
specs/002-quadrant-resize-anchors/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── resize-interaction-contract.md
└── tasks.md              # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── components/
│   ├── note/
│   │   ├── hooks/
│   │   │   ├── useResizeInteraction.ts   # Primary implementation target
│   │   │   ├── useDragInteraction.ts
│   │   │   ├── useGridMetrics.ts
│   │   │   └── usePositionRendering.ts
│   │   └── preview.tsx                   # Optional small integration touch
│   └── canvas/
├── providers/
│   └── editor/
│       ├── store.ts
│       └── slices/
└── styles/
    └── note.css                          # Optional cursor affordance

specs/
└── 002-quadrant-resize-anchors/
```

**Structure Decision**: Use existing single Electron+React app structure and localize implementation primarily to `app/components/note/hooks/useResizeInteraction.ts`.

## Phase 0: Research & Decisions

Research outcomes are documented in `/specs/002-quadrant-resize-anchors/research.md`.

Resolved clarifications:
- Anchor resolution strategy: resolve once on pointer-down, stable for session.
- Backward compatibility strategy: preserve right-click activation and existing lifecycle.
- Geometry strategy: anchor-aware candidate origin/size math with existing snapping and min-size constraints.
- Ambiguity handling: deterministic SE fallback.

## Phase 1: Design & Contracts

Design artifacts:
- Data model: `/specs/002-quadrant-resize-anchors/data-model.md`
- Interaction contract: `/specs/002-quadrant-resize-anchors/contracts/resize-interaction-contract.md`
- Implementation/playtest guide: `/specs/002-quadrant-resize-anchors/quickstart.md`

Design intent:
- Introduce `ResizeAnchor` and extend session state with start origin (`startPixelX/Y`) and resolved anchor.
- Keep the existing state machine and pointer lifecycle unchanged.
- Compute directional candidates so left/top anchors adjust both size and origin.
- Commit snapped `x/y/width/height` as needed while preserving existing min-size logic and fallback behavior.

## Implementation Strategy (Minimal Change)

1. Add anchor resolution utility in `useResizeInteraction.ts`.
2. Capture start origin (`x/y` pixels) plus anchor in pointer-down.
3. Replace candidate geometry math with anchor-aware computation.
4. Continue existing visual update and finalize flow; only extend to update offsets when anchor includes left/top.
5. Keep current threshold, capture, cleanup, snapping, and commit cadence intact.

## Risks & Mitigations

- Risk: Anchor ambiguity near center can produce surprising behavior.
  - Mitigation: Deterministic fallback to current SE behavior.
- Risk: Left/top anchored resizes regress snapping of `x/y`.
  - Mitigation: Snap both origin and size consistently in finalize commit.
- Risk: Visual jitter while resizing from left/top due to offset updates.
  - Mitigation: Use existing RAF batching and avoid extra state writes during interaction.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
