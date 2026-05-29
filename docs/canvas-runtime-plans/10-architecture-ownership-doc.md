# 10 - Architecture Ownership Document

## Goal
Establish and document hard ownership rules so interaction logic does not fragment again.

## Current Problem
Behavior ownership has drifted between runtime, plugins, element wrappers, and editor content, causing duplicated handlers and inconsistent state flow.

## Target Architecture/Behavior
- Runtime owns all mutations and side-effect execution.
- Plugins emit operations only and hold session-scoped state only.
- Canvas element layer is presentational and metadata-only.
- Note editor owns content behavior only (not canvas movement/selection).

## Implementation Steps
1. Create architecture doc in `docs/canvas-runtime-plans/` with ownership matrix.
2. Define allowed vs forbidden dependencies per layer.
3. Add review checklist for PRs touching canvas runtime.
4. Add static checks (grep/lint) for forbidden imports and direct writes.

## Type/API Changes
- None required functionally; documentation + guardrails only.
- Optional: add `README` in runtime folder linking to ownership doc.

## Edge Cases/Failure Modes
- New features bypassing operation pipeline for expedience.
- “Temporary” direct writes becoming permanent.

## Test Cases + Acceptance Criteria
- Architecture checklist added to contribution workflow.
- Static guard checks enforce:
  - no store imports in runtime plugins
  - no element-level note interaction ownership
- New canvas features follow documented ownership matrix.

## Migration Notes
- Apply doc and guardrails immediately after runtime consolidation.
- Revisit quarterly as plugin surface expands.

## Risks + Mitigations
- Risk: docs stale as code evolves.
- Mitigation: require doc update in PR template when ownership changes.

## Definition of Done
- Ownership matrix is explicit, versioned, and enforced by checks.
