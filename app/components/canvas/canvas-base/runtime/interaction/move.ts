import { resolveMovementCommit } from "@/lib/movement-commit";

export type MovementBounds = {
	gridX: number;
	gridY: number;
	gridWidth: number;
	gridHeight: number;
	pixelX: number;
	pixelY: number;
};

export type MovementResolverInput = {
	bounds: MovementBounds;
	deltaPixelX: number;
	deltaPixelY: number;
	cellWidth: number;
	cellHeight: number;
	excludeIds: string | string[];
	searchRadius: number;
	isAreaFree: (
		x: number,
		y: number,
		width: number,
		height: number,
		excludeIds?: string | string[],
	) => boolean;
	findNearestFree: (
		x: number,
		y: number,
		width: number,
		height: number,
		excludeIds?: string | string[],
		maxRadius?: number,
	) => { x: number; y: number } | null;
};

export function resolveMoveCommit(input: MovementResolverInput) {
	return resolveMovementCommit(input);
}
