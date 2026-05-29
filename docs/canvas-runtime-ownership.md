# Canvas Runtime Ownership

## Ownership Matrix
- Runtime (`canvas-base/runtime/*`): only layer that mutates persisted canvas state and applies runtime side effects.
- Runtime plugins (`runtime/plugins/*`): emit operations only; may hold session-scoped ephemeral state.
- Interaction engine (`runtime/interaction/*`): pure movement/resize/collision utilities; no store imports.
- Canvas element layer (`canvas-element*`): presentational wrappers + element metadata attributes only.
- Note editor/content (`components/note/*`): content editing/rendering only; no canvas interaction mutation.

## Allowed and Forbidden Dependencies
- Runtime and runtime plugins:
  - Allowed: `RuntimePorts`, shared interaction utilities, canvas runtime types.
  - Forbidden: direct `useEditorGridStore` imports and direct DOM query mutation for interaction state.
- Element renderers:
  - Allowed: render args + runtime UI metadata.
  - Forbidden: interaction ownership (selection/drag/resize mutation logic).

## Mutation Rule
- All canvas mutations must flow through runtime operations:
  - `dispatch -> emitted ops -> phase sort/validation -> runtime executor`.
- Plugins must not mutate store/DOM directly.

## Review Checklist
- Does any runtime/plugin file import `@/providers/editor/store`?
- Does any plugin mutate DOM directly for interaction state?
- Is any note selection/drag/resize logic outside runtime plugins?
- Are new interactions represented as operations with phase mapping?
- Are preview vs commit semantics preserved?

## Enforcement
- Boundary check command:
  - `npm run check:canvas-runtime-boundaries`
- Required in local verification and CI for canvas-runtime changes.
