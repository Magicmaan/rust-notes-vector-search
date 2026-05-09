import type { AnyCanvasElementDisplay } from "@/types";

const NEIGHBOR_OFFSETS = [
	[-1, 0],
	[1, 0],
	[0, -1],
	[0, 1],
] as const;

type CoordinateSet = Map<number, Set<number>>;

function addCoordinate(coords: CoordinateSet, x: number, y: number) {
	let row = coords.get(y);
	if (!row) {
		row = new Set<number>();
		coords.set(y, row);
	}

	row.add(x);
}

function hasCoordinate(coords: CoordinateSet, x: number, y: number) {
	return coords.get(y)?.has(x) ?? false;
}

function toCoordinates(coords: CoordinateSet) {
	const result: { x: number; y: number }[] = [];

	for (const [y, row] of coords) {
		for (const x of row) {
			result.push({ x, y });
		}
	}

	return result;
}

export function getStaticAddCells(
	elements: Record<string, AnyCanvasElementDisplay>,
) {
	const occupied: CoordinateSet = new Map();

	for (const element of Object.values(elements)) {
		for (let dy = 0; dy < element.height; dy += 1) {
			for (let dx = 0; dx < element.width; dx += 1) {
				addCoordinate(occupied, element.x + dx, element.y + dy);
			}
		}
	}

	const candidates: CoordinateSet = new Map();
	for (const { x, y } of toCoordinates(occupied)) {
		for (const [offsetX, offsetY] of NEIGHBOR_OFFSETS) {
			const neighborX = x + offsetX;
			const neighborY = y + offsetY;

			if (neighborX < 0 || neighborY < 0) {
				continue;
			}

			if (!hasCoordinate(occupied, neighborX, neighborY)) {
				addCoordinate(candidates, neighborX, neighborY);
			}
		}
	}

	return toCoordinates(candidates).sort((a, b) => a.y - b.y || a.x - b.x);
}
