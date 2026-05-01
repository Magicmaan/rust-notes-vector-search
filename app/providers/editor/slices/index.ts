/**
 * Slices Barrel Export
 * Central location to import all slice creators and types
 * Follows Zustand docs TypeScript slices pattern
 */

// Grid Slice
export { createGridSlice } from "./gridSlice";
export type {
	GridSliceState,
	GridSliceActions,
	GridSliceType,
} from "./gridSlice";

// Viewport Slice
export { createViewportSlice } from "./viewportSlice";
export type {
	ViewportSliceState,
	ViewportSliceActions,
	ViewportSliceType,
} from "./viewportSlice";

// Elements Slice
export { createElementsSlice } from "./elementsSlice";
export type {
	ElementsSliceState,
	ElementsSliceActions,
	ElementsSliceType,
} from "./elementsSlice";

// UI State Slice
export { createUIStateSlice } from "./uiStateSlice";
export type {
	UIStateSliceState,
	UIStateSliceActions,
	UIStateSliceType,
} from "./uiStateSlice";
