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

/**
 * UI state
 * Manages transient UI interactions and display state
 */
export interface UIStateSliceState {
	/** ID of currently expanded note (empty string if none) */
	expandedNoteId: string;

	/** Whether a drag operation is in progress */
	isDragging: boolean;

	/** Whether a resize operation is in progress */
	isResizing: boolean;

	/** ID of the closest element to cursor (for hover effects) */
	closestElementId?: string;

	/** Ordered set of note IDs currently selected in canvas */
	selectedNoteIds: string[];
}

/**
 * UI state actions
 * Methods to update UI state
 */
export interface UIStateSliceActions {
	/**
	 * Set the expanded note ID
	 * Empty string means no note expanded
	 * @param id Note ID or empty string
	 */
	setExpandedNoteId: (id: string) => void;

	/**
	 * Set drag state
	 * @param isDragging Whether drag is in progress
	 */
	setIsDragging: (isDragging: boolean) => void;

	/**
	 * Set resize state
	 * @param isResizing Whether resize is in progress
	 */
	setIsResizing: (isResizing: boolean) => void;

	/**
	 * Set the closest element ID for hover effects
	 * @param id Element ID or undefined
	 */
	setClosestElementId?: (id: string | undefined) => void;

	/**
	 * Replace the entire selected note ID list.
	 * @param ids Ordered note IDs to mark as selected
	 */
	setSelectedNoteIds: (ids: string[]) => void;

	/** Clear all selected note IDs. */
	clearSelectedNoteIds: () => void;
}

/**
 * Complete UIStateSlice type
 */
export type UIStateSliceType = UIStateSliceState & UIStateSliceActions;

/**
 * Create the UI state slice
 * Default: no expansion, not dragging/resizing, no closest element
 */
export const createUIStateSlice: StateCreator<
	EditorGridStoreType,
	[["zustand/immer", never]],
	[],
	UIStateSliceType
> = (set, _get, _api) => ({
	// State
	expandedNoteId: "",
	isDragging: false,
	isResizing: false,
	closestElementId: undefined,
	selectedNoteIds: [],

	// Actions
	setExpandedNoteId: (id: string) => {
		set((state) => {
			if (id === "") {
				// Clear previous expanded note
				const oldElement = state.elements[state.expandedNoteId];
				if (oldElement) {
					state.elements[state.expandedNoteId] = { ...oldElement, stat: false };
				}
				state.expandedNoteId = "";
				return;
			}

			// Set new expanded note
			const element = state.elements[id];
			if (!element) {
				console.error(
					`[UIStateSlice] setExpandedNoteId: element with id "${id}" not found`,
				);
				return;
			}
			state.expandedNoteId = id;
			state.elements[id] = { ...element, stat: true };
		});
	},

	setIsDragging: (isDragging: boolean) =>
		set((state) => {
			state.isDragging = isDragging;
		}),
	setIsResizing: (isResizing: boolean) =>
		set((state) => {
			state.isResizing = isResizing;
		}),
	setClosestElementId: (id: string | undefined) =>
		set((state) => {
			state.closestElementId = id;
		}),
	setSelectedNoteIds: (ids: string[]) =>
		set((state) => {
			state.selectedNoteIds = Array.from(new Set(ids));
		}),
	clearSelectedNoteIds: () =>
		set((state) => {
			state.selectedNoteIds = [];
		}),
});
