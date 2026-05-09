import {
	NoteDisplay,
	TitleDisplay,
	type AnyCanvasElementDisplay,
} from "@/types";
import { useEditorGridStore } from "@/providers/editor/store";
import type {
	GroupMoveBounds,
	GroupMoveSnapshotItem,
	GroupMovableTarget,
} from "./types";

export function toGroupMoveBounds(
	snapshots: GroupMoveSnapshotItem[],
	gridSize: [number, number],
): GroupMoveBounds | null {
	if (snapshots.length === 0) {
		return null;
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const item of snapshots) {
		minX = Math.min(minX, item.x);
		minY = Math.min(minY, item.y);
		maxX = Math.max(maxX, item.x + item.width);
		maxY = Math.max(maxY, item.y + item.height);
	}

	const [cellWidth, cellHeight] = gridSize;
	const gridWidth = maxX - minX;
	const gridHeight = maxY - minY;

	return {
		gridX: minX,
		gridY: minY,
		gridWidth,
		gridHeight,
		pixelX: minX * cellWidth,
		pixelY: minY * cellHeight,
		pixelWidth: gridWidth * cellWidth,
		pixelHeight: gridHeight * cellHeight,
	};
}

function buildDisplay(snapshot: GroupMoveSnapshotItem, x: number, y: number) {
	if (snapshot.variant === "title") {
		return new TitleDisplay({
			id: snapshot.id,
			x,
			y,
			width: snapshot.width,
			height: snapshot.height,
			content: snapshot.content,
			stat: snapshot.stat,
			backgroundColor: snapshot.backgroundColor,
		});
	}

	return new NoteDisplay({
		x,
		y,
		width: snapshot.width,
		height: snapshot.height,
		note: snapshot.content,
		stat: snapshot.stat,
		backgroundColor: snapshot.backgroundColor,
	});
}

export function buildGroupMoveSnapshots(
	state: ReturnType<typeof useEditorGridStore.getState>,
): GroupMoveSnapshotItem[] {
	return state.selectedNoteIds
		.map((id) => state.elements[id])
		.filter((element): element is AnyCanvasElementDisplay => Boolean(element))
		.map((element) => ({
			id: element.id,
			variant: element.variant,
			content: element.content,
			x: element.x,
			y: element.y,
			width: element.width,
			height: element.height,
			stat: element.stat,
			backgroundColor: element.backgroundColor,
		}));
}

export function createGroupMovableTarget({
	snapshots,
	bounds,
	gridSize,
}: {
	snapshots: GroupMoveSnapshotItem[];
	bounds: GroupMoveBounds;
	gridSize: [number, number];
}): GroupMovableTarget {
	const [cellWidth, cellHeight] = gridSize;
	const selectedIds = snapshots.map((item) => item.id);

	return {
		bounds,
		selectedIds,
		buildPreview: (deltaPixelX: number, deltaPixelY: number) => {
			return snapshots.map((snapshot) =>
				buildDisplay(
					snapshot,
					snapshot.x + deltaPixelX / cellWidth,
					snapshot.y + deltaPixelY / cellHeight,
				),
			);
		},
		commit: (resolvedGridX: number, resolvedGridY: number) => {
			const deltaGridX = resolvedGridX - bounds.gridX;
			const deltaGridY = resolvedGridY - bounds.gridY;
			return snapshots.map((snapshot) =>
				buildDisplay(snapshot, snapshot.x + deltaGridX, snapshot.y + deltaGridY),
			);
		},
		rollback: () => {
			return snapshots.map((snapshot) =>
				buildDisplay(snapshot, snapshot.x, snapshot.y),
			);
		},
	};
}
