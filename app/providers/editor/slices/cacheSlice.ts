/**
 * UI State Slice
 * Manages transient UI state (expansion, drag/resize flags, hover state)
 *
 * This file contains:
 * - Type definitions (UIStateSliceState, UIStateSliceActions)
 * - Slice creator function (createUIStateSlice)
 */

import type { StateCreator } from "zustand";
import type { EditorGridStoreType } from "../types";

export interface CacheEntry<T> {
	getData<T>(): Promise<T>;
}

/**
 * Cache store type
 * Methods to update cache
 */
export interface CacheStoreType {
	cache: Record<string, CacheEntry<any>>;
	setCacheEntry: <T>(key: string, entry: CacheEntry<T>) => void;
	getCacheEntry: <T>(key: string) => CacheEntry<T> | undefined;
}

/**
 * Create the cache slice
 * Default: empty cache
 */
export const createCacheSlice: StateCreator<
	EditorGridStoreType,
	[["zustand/immer", never]],
	[],
	CacheStoreType
> = (set, _get, _api) => ({
	cache: {},

	setCacheEntry: (key, entry) => {
		set((state) => {
			state.cache[key] = entry;
		});
	},
	getCacheEntry: (key) => {
		return _get().cache[key];
	},
});
