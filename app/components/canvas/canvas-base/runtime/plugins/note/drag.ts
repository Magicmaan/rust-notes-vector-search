import { cloneElementWithGeometry } from "@/types";
import type { FrameContext } from "../../types";
import { NOTE_SNAP_SEARCH_RADIUS } from "./constants";
import type { NoteSession } from "./types";
import { resolveMoveCommit } from "../../interaction/move";

export function buildDragPreview(
	session: NoteSession,
	context: FrameContext,
) {
	const deltaPixelX = context.pointer.screenX - session.startScreenX;
	const deltaPixelY = context.pointer.screenY - session.startScreenY;
	const [cellWidth, cellHeight] = context.gridSize;
	return cloneElementWithGeometry(session.baseline, {
		x: Math.round((session.baseline.x * cellWidth + deltaPixelX) / cellWidth),
		y: Math.round((session.baseline.y * cellHeight + deltaPixelY) / cellHeight),
	});
}

export function buildDragCommit(
	session: NoteSession,
	context: FrameContext,
) {
	const baseline = session.baseline;
	const [cellWidth, cellHeight] = context.gridSize;
	const deltaPixelX = context.pointer.screenX - session.startScreenX;
	const deltaPixelY = context.pointer.screenY - session.startScreenY;
	const result = resolveMoveCommit({
		bounds: {
			gridX: baseline.x,
			gridY: baseline.y,
			gridWidth: baseline.width,
			gridHeight: baseline.height,
			pixelX: baseline.x * cellWidth,
			pixelY: baseline.y * cellHeight,
		},
		deltaPixelX,
		deltaPixelY,
		cellWidth,
		cellHeight,
		excludeIds: baseline.id,
		searchRadius: NOTE_SNAP_SEARCH_RADIUS,
		isAreaFree: context.ports.query.isAreaFree,
		findNearestFree: context.ports.query.findNearestFree,
	});
	return cloneElementWithGeometry(baseline, {
		x: result.resolvedGridX,
		y: result.resolvedGridY,
	});
}
