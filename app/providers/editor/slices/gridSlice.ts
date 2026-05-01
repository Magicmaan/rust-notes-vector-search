/**
 * Grid Configuration Slice
 * Manages grid layout parameters (columns, row height, margins)
 *
 * This file contains:
 * - Type definitions (GridSliceState, GridSliceActions)
 * - Slice creator function (createGridSlice)
 */

import type { StateCreator } from "zustand";
import type { EditorGridStoreType } from "../types";

/**
 * Grid layout configuration state
 * Contains parameters for grid column count, row height, and margins
 */
export interface GridSliceState {
	/** Number of columns in the grid layout */
	columns: number;

	/** Height of each grid row in pixels */
	rowHeight: number;

	/** Margins around grid [horizontal, vertical] in pixels */
	margin: [number, number];

	/** Size of one grid cell in pixels */
	gridSize: [number, number];
}

/**
 * Grid configuration actions
 * Methods to update grid layout parameters
 */
export interface GridSliceActions {
	/**
	 * Set the number of columns
	 * @param cols Number of columns
	 */
	setColumns: (cols: number) => void;

	/**
	 * Set the row height
	 * @param rowHeight Height in pixels
	 */
	setRowHeight: (rowHeight: number) => void;

	/**
	 * Set the margins
	 * @param margin [horizontal, vertical] margins in pixels
	 */
	setMargin: (margin: [number, number]) => void;

	/**
	 * Set the grid cell size in pixels
	 * @param gridSize Pixel size for one cell
	 */
	setGridSize: (gridSize: [number, number]) => void;
}

/**
 * Complete GridSlice type
 * Union of state and actions
 */
export type GridSliceType = GridSliceState & GridSliceActions;

/**
 * Create the grid configuration slice
 * Default values: 6 columns, 75px row height, [25, 25] margins
 */
export const createGridSlice: StateCreator<
	EditorGridStoreType,
	[["zustand/immer", never]],
	[],
	GridSliceType
> = (set, _get, _api) => ({
	// State
	columns: 6,
	rowHeight: 75,
	margin: [25, 25],
	gridSize: [16, 16],

	// Actions
	setColumns: (cols: number) =>
		set((state) => {
			if (!Number.isFinite(cols) || cols < 1 || !Number.isInteger(cols)) {
				console.error(`[GridSlice] setColumns: invalid cols ${cols}`);
				return;
			}
			state.columns = cols;
		}),
	setRowHeight: (rowHeight: number) =>
		set((state) => {
			if (!Number.isFinite(rowHeight) || rowHeight <= 0) {
				console.error(
					`[GridSlice] setRowHeight: invalid rowHeight ${rowHeight}`,
				);
				return;
			}
			state.rowHeight = rowHeight;
		}),
	setMargin: (margin: [number, number]) =>
		set((state) => {
			if (
				!Array.isArray(margin) ||
				margin.length !== 2 ||
				!Number.isFinite(margin[0]) ||
				!Number.isFinite(margin[1]) ||
				margin[0] < 0 ||
				margin[1] < 0
			) {
				console.error(
					`[GridSlice] setMargin: invalid margin ${JSON.stringify(margin)}`,
				);
				return;
			}
			state.margin = [
				Math.max(0, Math.round(margin[0])),
				Math.max(0, Math.round(margin[1])),
			];
		}),
	setGridSize: (gridSize: [number, number]) =>
		set((state) => {
			if (
				!Array.isArray(gridSize) ||
				gridSize.length !== 2 ||
				!Number.isFinite(gridSize[0]) ||
				!Number.isFinite(gridSize[1]) ||
				gridSize[0] <= 0 ||
				gridSize[1] <= 0
			) {
				console.error(
					`[GridSlice] setGridSize: invalid gridSize ${JSON.stringify(gridSize)}`,
				);
				return;
			}
			state.gridSize = [
				Math.max(1, Math.round(gridSize[0])),
				Math.max(1, Math.round(gridSize[1])),
			];
		}),
});
