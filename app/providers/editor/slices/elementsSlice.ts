/**
 * Elements Slice
 * Manages note elements and spatial queries
 *
 * This file contains:
 * - Type definitions (ElementsSliceState, ElementsSliceActions)
 * - Slice creator function (createElementsSlice)
 */

import type { StateCreator } from "zustand";
import type { NoteDisplay } from "@/types";
import type { EditorGridStoreType } from "../types";

/**
 * Elements and spatial indexing state
 * Manages note elements
 */
export interface ElementsSliceState {
	/** Map of element ID to element (for O(1) lookups) */
	elements: Record<string, NoteDisplay>;

	/** Stable list of element IDs for rendering order without per-selector allocations */
	elementIds: string[];

	/** Monotonic version used for deriving memoized layout data safely */
	elementsVersion: number;
}

/**
 * Elements operations
 * Methods to manage elements and spatial index
 */
export interface ElementsSliceActions {
	/**
	 * Replace all elements with new set
	 * Clears element map
	 * @param elements Array of note display elements
	 */
	setElements: (elements: NoteDisplay[]) => void;

	/**
	 * Add a single element to the tree
	 * @param element Note element to add
	 */
	addElement: (element: NoteDisplay) => void;

	/**
	 * Add multiple elements at once
	 * @param elements Array of elements to add
	 */
	addElements: (elements: NoteDisplay[]) => void;

	/**
	 * Retrieve element by ID
	 * @param id Element ID
	 * @returns The element or undefined if not found
	 */
	getElement: (id: string) => NoteDisplay | undefined;

	/**
	 * Delete element by ID
	 * Removes from elements map
	 * @param id Element ID
	 */
	deleteElement: (id: string) => void;

	/**
	 * Update element position/dimensions
	 * @param id Element ID
	 * @param updatedElement Updated element with new position/dimensions
	 */
	updateElement: (id: string, updatedElement: NoteDisplay) => void;

	/**
	 * Update multiple elements atomically in a single transaction.
	 * @param updatedElements Updated elements keyed by existing ids
	 */
	updateElementsBulk: (updatedElements: NoteDisplay[]) => void;

	/**
	 * Check whether a target rectangle in grid units is free.
	 */
	isAreaFree: (
		x: number,
		y: number,
		width: number,
		height: number,
		excludeIds?: string | string[],
	) => boolean;

	/**
	 * Find all element IDs that overlap a target rectangle.
	 */
	findOccupyingIds: (
		x: number,
		y: number,
		width: number,
		height: number,
		excludeIds?: string | string[],
	) => string[];

	/**
	 * Find the nearest free top-left coordinate for a rectangle of the given size.
	 * Evaluates all grid positions within maxRadius and returns the closest by
	 * Euclidean distance to the anchor coordinate.
	 */
	findNearestFree: (
		x: number,
		y: number,
		width: number,
		height: number,
		excludeIds?: string | string[],
		maxRadius?: number,
	) => { x: number; y: number } | null;
}

/**
 * Complete ElementsSlice type
 */
export type ElementsSliceType = ElementsSliceState & ElementsSliceActions;

/**
 * Create the elements slice
 * Manages spatial indexing and element storage
 */
export const createElementsSlice: StateCreator<
	EditorGridStoreType,
	[["zustand/immer", never]],
	[],
	ElementsSliceType
> = (set, get, _api) => ({
	// State
	elements: {},
	elementIds: [],
	elementsVersion: 0,

	// Actions
	setElements: (elements: NoteDisplay[]) => {
		set((state) => {
			state.elements = {};
			state.elementIds = [];
			const seen = new Set<string>();
			elements.forEach((element) => {
				state.elements[element.id] = element;
				if (!seen.has(element.id)) {
					seen.add(element.id);
					state.elementIds.push(element.id);
				}
			});
			state.elementsVersion += 1;
		});
	},

	addElement: (element: NoteDisplay) => {
		set((state) => {
			if (!state.elements[element.id]) {
				state.elementIds.push(element.id);
			}
			state.elements[element.id] = element;
			state.elementsVersion += 1;
		});
	},

	addElements: (elements: NoteDisplay[]) => {
		set((state) => {
			elements.forEach((element) => {
				if (!state.elements[element.id]) {
					state.elementIds.push(element.id);
				}
				state.elements[element.id] = element;
			});
			state.elementsVersion += 1;
		});
	},

	getElement: (id: string) => {
		return get().elements[id];
	},

	deleteElement: (id: string) => {
		set((state) => {
			if (!state.elements[id]) {
				console.error(
					`[ElementsSlice] deleteElement: element with id "${id}" not found`,
				);
				return;
			}
			delete state.elements[id];
			state.elementIds = state.elementIds.filter((elementId) => elementId !== id);
			state.elementsVersion += 1;
		});
	},

	updateElement: (id: string, updatedElement: NoteDisplay) => {
		set((state) => {
			if (!state.elements[id]) {
				console.error(
					`[ElementsSlice] updateElement: element with id "${id}" not found`,
				);
				return;
			}

			state.elements[updatedElement.id] = updatedElement;
			if (updatedElement.id !== id) {
				delete state.elements[id];
				state.elementIds = state.elementIds.map((elementId) =>
					elementId === id ? updatedElement.id : elementId,
				);
			}

			state.elementsVersion += 1;
		});
	},

	updateElementsBulk: (updatedElements: NoteDisplay[]) => {
		set((state) => {
			let changed = false;
			for (const updatedElement of updatedElements) {
				if (!state.elements[updatedElement.id]) {
					continue;
				}
				state.elements[updatedElement.id] = updatedElement;
				changed = true;
			}

			if (changed) {
				state.elementsVersion += 1;
			}
		});
	},

	findOccupyingIds: (x, y, width, height, excludeIds) => {
		if (x < 0 || y < 0 || width < 1 || height < 1) {
			return [];
		}
		const excludedIdSet = toExcludedIdSet(excludeIds);

		const elements = get().elements;
		return Object.values(elements)
			.filter((element) => !excludedIdSet.has(element.id))
			.filter((element) =>
				rectanglesOverlap(
					x,
					y,
					width,
					height,
					element.x,
					element.y,
					element.width,
					element.height,
				),
			)
			.map((element) => element.id);
	},

	isAreaFree: (x, y, width, height, excludeIds) => {
		if (x < 0 || y < 0 || width < 1 || height < 1) {
			return false;
		}

		return get().findOccupyingIds(x, y, width, height, excludeIds).length === 0;
	},

		findNearestFree: (x, y, width, height, excludeIds, maxRadius = 20) => {
		if (!Number.isFinite(x) || !Number.isFinite(y) || width < 1 || height < 1) {
			return null;
		}

		const elements = get().elements;
		const excludedIdSet = toExcludedIdSet(excludeIds);

			function isFree(candidateX: number, candidateY: number) {
				if (candidateX < 0 || candidateY < 0) return false;
				for (const element of Object.values(elements)) {
					if (excludedIdSet.has(element.id)) continue;
					if (
						rectanglesOverlap(
							candidateX,
							candidateY,
							width,
							height,
							element.x,
							element.y,
							element.width,
							element.height,
						)
					) {
						return false;
				}
			}
			return true;
		}

		const boundedRadius = Math.max(0, Math.floor(maxRadius));
		let best: { x: number; y: number } | null = null;
		let bestDistanceSquared = Number.POSITIVE_INFINITY;
		let bestManhattan = Number.POSITIVE_INFINITY;

		const startX = Math.max(0, Math.floor(x - boundedRadius));
		const endX = Math.max(0, Math.ceil(x + boundedRadius));
		const startY = Math.max(0, Math.floor(y - boundedRadius));
		const endY = Math.max(0, Math.ceil(y + boundedRadius));

			for (let candidateY = startY; candidateY <= endY; candidateY++) {
				for (let candidateX = startX; candidateX <= endX; candidateX++) {
					if (!isFree(candidateX, candidateY)) {
						continue;
					}

					const deltaX = candidateX - x;
					const deltaY = candidateY - y;
					const distanceSquared = deltaX * deltaX + deltaY * deltaY;
					const manhattan = Math.abs(deltaX) + Math.abs(deltaY);

				if (
					distanceSquared < bestDistanceSquared ||
					(distanceSquared === bestDistanceSquared &&
								(manhattan < bestManhattan ||
									(manhattan === bestManhattan &&
										(best === null ||
											candidateY < best.y ||
											(candidateY === best.y && candidateX < best.x)))))
					) {
						best = { x: candidateX, y: candidateY };
						bestDistanceSquared = distanceSquared;
						bestManhattan = manhattan;
					}
			}
		}

		return best;
	},
});

/**
 * Check if two rectangles overlap
 */
function rectanglesOverlap(
	ax: number,
	ay: number,
	aw: number,
	ah: number,
	bx: number,
	by: number,
	bw: number,
	bh: number,
): boolean {
	return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function toExcludedIdSet(excludeIds?: string | string[]) {
	if (!excludeIds) {
		return new Set<string>();
	}
	if (Array.isArray(excludeIds)) {
		return new Set(excludeIds);
	}
	return new Set([excludeIds]);
}
