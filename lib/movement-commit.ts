export type ExcludeIds = string | string[] | undefined;

export interface MovableBounds {
	gridX: number;
	gridY: number;
	gridWidth: number;
	gridHeight: number;
	pixelX: number;
	pixelY: number;
}

export interface MovementCommitInput {
	bounds: MovableBounds;
	deltaPixelX: number;
	deltaPixelY: number;
	cellWidth: number;
	cellHeight: number;
	excludeIds?: ExcludeIds;
	searchRadius: number;
	isAreaFree: (
		x: number,
		y: number,
		width: number,
		height: number,
		excludeIds?: ExcludeIds,
	) => boolean;
	findNearestFree: (
		x: number,
		y: number,
		width: number,
		height: number,
		excludeIds?: ExcludeIds,
		maxRadius?: number,
	) => { x: number; y: number } | null;
}

export interface MovementCommitResult {
	committed: boolean;
	candidateGridX: number;
	candidateGridY: number;
	resolvedGridX: number;
	resolvedGridY: number;
	resolvedPixelX: number;
	resolvedPixelY: number;
}

const snapToMultiple = (num: number, multiple: number) =>
	Math.round(num / multiple) * multiple;

export function resolveMovementCommit(
	input: MovementCommitInput,
): MovementCommitResult {
	const {
		bounds,
		deltaPixelX,
		deltaPixelY,
		cellWidth,
		cellHeight,
		excludeIds,
		searchRadius,
		isAreaFree,
		findNearestFree,
	} = input;

	const candidatePixelX = bounds.pixelX + deltaPixelX;
	const candidatePixelY = bounds.pixelY + deltaPixelY;
	const candidateGridX = candidatePixelX / cellWidth;
	const candidateGridY = candidatePixelY / cellHeight;

	const snappedPixelX = snapToMultiple(candidatePixelX, cellWidth);
	const snappedPixelY = snapToMultiple(candidatePixelY, cellHeight);

	let resolvedGridX: number | null = null;
	let resolvedGridY: number | null = null;

	if (snappedPixelX >= 0 && snappedPixelY >= 0) {
		const snappedGridX = snappedPixelX / cellWidth;
		const snappedGridY = snappedPixelY / cellHeight;
		if (
			isAreaFree(
				snappedGridX,
				snappedGridY,
				bounds.gridWidth,
				bounds.gridHeight,
				excludeIds,
			)
		) {
			resolvedGridX = snappedGridX;
			resolvedGridY = snappedGridY;
		}
	}

	if (resolvedGridX === null || resolvedGridY === null) {
		const nearest = findNearestFree(
			candidateGridX,
			candidateGridY,
			bounds.gridWidth,
			bounds.gridHeight,
			excludeIds,
			searchRadius,
		);
		if (nearest) {
			resolvedGridX = nearest.x;
			resolvedGridY = nearest.y;
		}
	}

	if (resolvedGridX === null || resolvedGridY === null) {
		return {
			committed: false,
			candidateGridX,
			candidateGridY,
			resolvedGridX: bounds.gridX,
			resolvedGridY: bounds.gridY,
			resolvedPixelX: bounds.pixelX,
			resolvedPixelY: bounds.pixelY,
		};
	}

	return {
		committed: true,
		candidateGridX,
		candidateGridY,
		resolvedGridX,
		resolvedGridY,
		resolvedPixelX: resolvedGridX * cellWidth,
		resolvedPixelY: resolvedGridY * cellHeight,
	};
}
