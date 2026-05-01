# Research: Note Background Color Picker + Circular Transition

## Decision 1: Persist color on `NoteDisplay.backgroundColor`
- Decision: Add optional `backgroundColor` field to `NoteDisplay` and thread it through all note update constructors.
- Rationale: Smallest change that keeps color tied to existing note display state and avoids separate maps/stores.
- Alternatives considered:
  - Separate color map in store keyed by note id. Rejected as extra state synchronization complexity.
  - Local component state only. Rejected because it would reset on rerender and not track note model updates.

## Decision 2: Horizontal popup via existing menu structure
- Decision: Keep existing trigger/popup chrome and only change option container from column to row.
- Rationale: Matches user request to keep styles the same except horizontal layout.
- Alternatives considered:
  - Build a custom popover from scratch. Rejected as unnecessary and riskier.

## Decision 3: Use View Transition API with CSS-driven circular reveal
- Decision: Wrap color updates in `document.startViewTransition` when available; set click-origin CSS variables and animate `::view-transition-new(root)` clip-path from circle(0) to full coverage.
- Rationale: Provides requested smooth circle transition while keeping JS logic small.
- Alternatives considered:
  - Animate note background with regular CSS transitions only. Rejected because requirement explicitly asks for View Transitions.
  - Per-note unique transition pseudo targets. Rejected for now due to naming complexity and larger styling surface.

## Decision 4: Fallback behavior for unsupported environments
- Decision: Feature-detect and directly update note color without transition if API is unavailable.
- Rationale: Ensures behavior remains functional in all renderer environments.
- Alternatives considered:
  - No fallback. Rejected as brittle and user-visible failure risk.
