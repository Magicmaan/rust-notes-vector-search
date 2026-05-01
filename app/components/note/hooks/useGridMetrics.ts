import { useMemo } from "react";
import { toVector2D as t2d } from "@/lib/utils";

const DEFAULT_GRID_SIZE = 16;

export interface UseGridMetricsInput {
	gridSizeWidth?: number;
	gridSizeHeight?: number;
	elementWidth: number;
	elementHeight: number;
	elementX: number;
	elementY: number;
}

export interface GridMetrics {
	cellWidth: number;
	cellHeight: number;
	pixelSize: { x: number; y: number };
	offset: { x: number; y: number };
}

/**
 * Calculate grid metrics used by drag and render systems.
 * All values memoized—do not recreate on every render.
 */
export function useGridMetrics(input: UseGridMetricsInput): GridMetrics {
	const {
		gridSizeWidth,
		gridSizeHeight,
		elementWidth,
		elementHeight,
		elementX,
		elementY,
	} = input;

	const cellWidth = useMemo(
		() => Math.max(1, gridSizeWidth || DEFAULT_GRID_SIZE),
		[gridSizeWidth],
	);

	const cellHeight = useMemo(
		() => Math.max(1, gridSizeHeight || DEFAULT_GRID_SIZE),
		[gridSizeHeight],
	);

	const pixelSize = useMemo(
		() => t2d([elementWidth * cellWidth, elementHeight * cellHeight]),
		[cellWidth, cellHeight, elementWidth, elementHeight],
	);

	const offset = useMemo(
		() => t2d([elementX * cellWidth, elementY * cellHeight]),
		[cellWidth, cellHeight, elementX, elementY],
	);

	return {
		cellWidth,
		cellHeight,
		pixelSize,
		offset,
	};
}
