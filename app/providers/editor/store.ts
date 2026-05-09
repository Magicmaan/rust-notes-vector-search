/**
 * EditorGridStore Hook
 * Composes individual slices into a single Zustand store
 *
 * Each slice (GridSlice, ViewportSlice, ElementsSlice, UIStateSlice)
 * is composed into a single store that components can subscribe to selectively.
 */

import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { EditorGridStoreType } from "./types";
import { createGridSlice } from "./slices/gridSlice";
import { createViewportSlice } from "./slices/viewportSlice";
import { createElementsSlice } from "./slices/elementsSlice";
import { createUIStateSlice } from "./slices/uiStateSlice";
import { createCacheSlice } from "./slices/cacheSlice";

/**
 * Bound Zustand hook composed from all slices.
 */
export const useEditorGridStore: UseBoundStore<StoreApi<EditorGridStoreType>> =
	create<EditorGridStoreType>()(
		immer((set, get, api) => ({
			// Grid Slice - grid layout configuration
			...createGridSlice(set, get, api),

			// Viewport Slice - canvas viewport (zoom, size)
			...createViewportSlice(set, get, api),

			// Elements Slice - spatial indexing and element management
			...createElementsSlice(set, get, api),

			// UI State Slice - transient UI state
			...createUIStateSlice(set, get, api),

			// Cache Slice - transient data caching
			...createCacheSlice(set, get, api),
		})),
	);
