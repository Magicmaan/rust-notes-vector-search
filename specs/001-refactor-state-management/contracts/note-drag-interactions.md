# Contract: Note Drag and Snap Interactions

## Scope
Defines the lifecycle, commit semantics, and collision prevention rules for note drag interactions.

## Drag Lifecycle Contract

### Required Phases
- `idle`
- `pressed`
- `dragging`
- `finalizing`

### Required Finalization Rule
- All release paths MUST route through one idempotent finalize function.

### Required Cleanup
Finalize MUST clear:
- active pointer id
- transient drag offsets
- pending RAF callback
- window-level fallback listeners
- UI drag flag

## Commit Contract

### Trigger
- Finalize with `shouldCommit=true` and movement threshold exceeded.

### Behavior
1. Compute snapped grid coordinate from drag delta.
2. Reject if target coordinate is negative.
3. Reject if occupancy check fails.
4. Commit once via element update if target is valid.

### Invariants
- Valid commit updates persisted note coordinates.
- Invalid commit restores original visual position.

## Ownership Arbitration Contract

### Rules
- Note drag ownership and canvas pan ownership are mutually exclusive.
- Pointer events originating from note drag MUST NOT start canvas pan.
- Canvas pan handlers MUST NO-OP while note drag is active.

## Visual Preview Contract

- In-flight preview MAY use transient transform updates.
- Persisted coordinates MUST remain unchanged until commit.
- Transient preview MUST be cleared at finalize.

## Non-Goals
- Redesigning zoom behavior.
- Introducing persistence layer changes.
- Reworking note creation workflows.
