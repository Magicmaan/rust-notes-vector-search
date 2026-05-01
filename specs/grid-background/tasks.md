# Tasks: Infinite Grid Background

Purpose: Implement an infinite-looking dotted background that stays aligned with grid world coordinates during pan and zoom, and never reveals the page behind the grid.

Phase 1 — Setup

- [ ] T001 Create `InfiniteBackground` component in app/components/canvas/infinite-background.tsx
- [ ] T002 Move `#canvas-background` DOM out of transformed element in app/components/canvas/grid.tsx
- [P] [ ] T003 Add CSS defaults and variables for background in app/styles/app.css

Phase 2 — Implementation

- [ ] T004 Implement background sync: compute `background-size` and `background-position` from world-space dot spacing and zoom in app/components/canvas/infinite-background.tsx
- [P] [ ] T005 Read and parse CSS vars (`--dot-space`, `--dot-size`) with safe fallbacks (handle `calc()`/px) in app/components/canvas/infinite-background.tsx
- [ ] T006 Throttle background updates using `requestAnimationFrame` in app/components/canvas/infinite-background.tsx
- [P] [ ] T007 Prefer panController-driven CSS vars (`--grid-offset-x`, `--grid-offset-y`) when available to remain fully in sync during interactive panning
- [ ] T008 Handle `resize` and `devicePixelRatio` changes (matchMedia) to ensure coverage and crisp dots in app/components/canvas/infinite-background.tsx

Phase 3 — Polishing & Verification

- [ ] T009 Clamp tile sizes and avoid sub-pixel jitter on extreme zooms in app/components/canvas/infinite-background.tsx
- [ ] T010 Add unit/integration tests for alignment and idempotent updates (tests/infinite-background/)
- [ ] T011 Add small performance harness to measure p95/p99 frame times for background updates (tools/perf/background-bench)
- [ ] T012 Document variables, defaults and usage in app/styles/app.css and docs/grid-background.md

Acceptance: background remains visually continuous during pan/zoom, aligned to world coords, and never shows the page behind the grid.
