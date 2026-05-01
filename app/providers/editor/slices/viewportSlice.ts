/**
 * Viewport Slice
 * Manages canvas viewport state (zoom level, viewport size)
 *
 * This file contains:
 * - Type definitions (ViewportSliceState, ViewportSliceActions)
 * - Slice creator function (createViewportSlice)
 */

import type { StateCreator } from "zustand";
import type { EditorGridStoreType } from "../types";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;

function clampZoom(zoomLevel: number) {
	if (!Number.isFinite(zoomLevel)) {
		console.error(
			`[ViewportSlice] clampZoom: invalid zoomLevel ${zoomLevel}, falling back to 1`,
		);
		return 1;
	}

	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel));
}

/**
 * Viewport state
 * Manages zoom level and viewport dimensions
 */
export interface ViewportSliceState {
	/** Current zoom level multiplier */
	zoomLevel: number;

	/** Current world-to-screen translation on X axis */
	offsetX: number;

	/** Current world-to-screen translation on Y axis */
	offsetY: number;

	/** Current viewport dimensions */
	viewportSize?: {
		width: number;
		height: number;
	};

	/** Whether a canvas pan gesture is currently active (space+drag) */
	isPanning: boolean;
}

/**
 * Viewport actions
 * Methods to update viewport state
 */
export interface ViewportSliceActions {
	/**
	 * Set the zoom level
	 * @param zoomLevel Zoom multiplier
	 */
	setZoomLevel: (zoomLevel: number) => void;

	/**
	 * Set the zoom level, zooming in from a specific center point
	 */
	setZoomLevelFromCentre: (zoomLevel: number) => void;

	/**
	 * Set viewport translation offset
	 * @param offset World-to-screen translation
	 */
	setViewportOffset: (offset: { x: number; y: number }) => void;

	/**
	 * Set viewport transform atomically
	 * @param transform New zoom and offsets
	 */
	setViewportTransform: (transform: {
		zoomLevel: number;
		offsetX: number;
		offsetY: number;
	}) => void;

	/**
	 * Set the viewport dimensions
	 * @param size Viewport width and height
	 */
	setViewportSize: (size: { width: number; height: number }) => void;

	/** Begin a pan gesture (space + pointer). Does not apply frequent updates. */
	startPan: () => void;

	/** End a pan gesture. If `commit` is true, `delta` (px) will be applied to offsets. */
	endPan: (commit: boolean, delta?: { x: number; y: number }) => void;
}

/**
 * Complete ViewportSlice type
 */
export type ViewportSliceType = ViewportSliceState & ViewportSliceActions;

/**
 * Create the viewport slice
 * Default: zoom level 1, no initial viewport size
 */
export const createViewportSlice: StateCreator<
	EditorGridStoreType,
	[["zustand/immer", never]],
	[],
	ViewportSliceType
> = (set, _get, _api) => ({
	// State
	zoomLevel: 1,
	offsetX: 0,
	offsetY: 0,
	viewportSize: undefined,
	// panning state
	isPanning: false,

	// Actions
	setZoomLevel: (zoomLevel: number) =>
		set((state) => {
			if (!Number.isFinite(zoomLevel)) {
				console.error(
					`[ViewportSlice] setZoomLevel: invalid zoomLevel ${zoomLevel}`,
				);
				return;
			}
			state.zoomLevel = clampZoom(zoomLevel);
		}),
		setZoomLevelFromCentre: (zoomLevel: number) =>
			set((state) => {
				if (!Number.isFinite(zoomLevel)) {
					console.error(
						`[ViewportSlice] setZoomLevelFromCentre: invalid zoomLevel ${zoomLevel}`,
					);
					return;
				}

				const nextZoomLevel = clampZoom(zoomLevel);

				if (!state.viewportSize) {
					state.zoomLevel = nextZoomLevel;
					return;
				}

				const centerX = state.viewportSize.width / 2;
				const centerY = state.viewportSize.height / 2;
				const currentZoomLevel = clampZoom(state.zoomLevel);
				const zoomRatio = nextZoomLevel / currentZoomLevel;
				const offsetX = state.offsetX;
				const offsetY = state.offsetY;

				state.zoomLevel = nextZoomLevel;
				state.offsetX = centerX - (centerX - offsetX) * zoomRatio;
				state.offsetY = centerY - (centerY - offsetY) * zoomRatio;
			}),
	setViewportOffset: (offset: { x: number; y: number }) =>
		set((state) => {
			if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y)) {
				return;
			}

			state.offsetX = offset.x;
			state.offsetY = offset.y;
		}),
	setViewportTransform: (transform) =>
		set((state) => {
			if (
				!Number.isFinite(transform.offsetX) ||
				!Number.isFinite(transform.offsetY) ||
				!Number.isFinite(transform.zoomLevel)
			) {
				console.error(
					`[ViewportSlice] setViewportTransform: invalid transform ${JSON.stringify(transform)}`,
				);
				return;
			}

			state.zoomLevel = clampZoom(transform.zoomLevel);
			state.offsetX = transform.offsetX;
			state.offsetY = transform.offsetY;
		}),
	setViewportSize: (viewportSize: { width: number; height: number }) =>
		set((state) => {
			if (
				!viewportSize ||
				notNumber(viewportSize.width) ||
				notNumber(viewportSize.height) ||
				viewportSize.width <= 0 ||
				viewportSize.height <= 0
			) {
				console.error(
					`[ViewportSlice] setViewportSize: invalid size ${JSON.stringify(viewportSize)}`,
				);
				return;
			}
			state.viewportSize = viewportSize;
		}),

	startPan: () =>
		set((state) => {
			state.isPanning = true;
		}),
	endPan: (commit: boolean, delta?: { x: number; y: number }) =>
		set((state) => {
			if (!state.isPanning) {
				state.isPanning = false;
				return;
			}

			if (commit && delta) {
				if (Number.isFinite(delta.x) && Number.isFinite(delta.y)) {
					state.offsetX = state.offsetX + delta.x;
					state.offsetY = state.offsetY + delta.y;
				}
			}

			state.isPanning = false;
		}),
});

function notNumber(n: unknown): n is number {
	return typeof n !== "number" || !Number.isFinite(n as number);
}
