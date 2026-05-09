/**
 * Shared store type composed from individual slice types.
 *
 * Keep this file as the single source of truth for the complete editor store
 * shape while each slice owns its own state/actions definitions.
 */

import type {
	ElementsSliceType,
	GridSliceType,
	UIStateSliceType,
	ViewportSliceType,
} from "./slices";
import { CacheStoreType } from "./slices/cacheSlice";

export type EditorGridStoreType = GridSliceType &
	ViewportSliceType &
	ElementsSliceType &
	UIStateSliceType &
	CacheStoreType;
