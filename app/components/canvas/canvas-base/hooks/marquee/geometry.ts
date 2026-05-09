import type { AnyCanvasElementDisplay } from "@/types";
import type { WorldRect } from "./types";

export function normalizeRect(
	aX: number,
	aY: number,
	bX: number,
	bY: number,
): WorldRect {
	const left = Math.min(aX, bX);
	const top = Math.min(aY, bY);
	const right = Math.max(aX, bX);
	const bottom = Math.max(aY, bY);

	return {
		x: left,
		y: top,
		width: right - left,
		height: bottom - top,
	};
}

export function rectanglesOverlap(a: WorldRect, b: WorldRect) {
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

export function pointInsideRect(point: { x: number; y: number }, rect: WorldRect) {
	return (
		point.x >= rect.x &&
		point.x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect.height
	);
}

export function getIntersectingNoteIds({
	rect,
	elements,
	gridSize,
}: {
	rect: WorldRect;
	elements: Record<string, AnyCanvasElementDisplay>;
	gridSize: [number, number];
}) {
	const [cellWidth, cellHeight] = gridSize;
	const nextIds: string[] = [];

	for (const element of Object.values(elements)) {
		const noteRect: WorldRect = {
			x: element.x * cellWidth,
			y: element.y * cellHeight,
			width: element.width * cellWidth,
			height: element.height * cellHeight,
		};

		if (rectanglesOverlap(rect, noteRect)) {
			nextIds.push(element.id);
		}
	}

	return nextIds;
}
