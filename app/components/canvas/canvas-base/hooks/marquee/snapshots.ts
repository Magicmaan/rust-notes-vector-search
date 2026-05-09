import { cloneElementWithGeometry, type AnyCanvasElementDisplay } from "@/types";
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

export function buildGroupMoveSnapshots(
	state: ReturnType<typeof useEditorGridStore.getState>,
): GroupMoveSnapshotItem[] {
	return state.selectedNoteIds
		.map((id) => state.elements[id])
		.filter((element): element is AnyCanvasElementDisplay => Boolean(element))
			.map((element) => ({
				id: element.id,
				variant: element.variant,
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
			}));
}

export function createGroupMovableTarget({
	snapshots,
	bounds,
	gridSize,
	baselineElementsById,
}: {
	snapshots: GroupMoveSnapshotItem[];
	bounds: GroupMoveBounds;
	gridSize: [number, number];
	baselineElementsById: Record<string, AnyCanvasElementDisplay>;
}): GroupMovableTarget {
	const [cellWidth, cellHeight] = gridSize;
	const selectedIds = snapshots.map((item) => item.id);

	const createElements = (
		resolveGeometry: (snapshot: GroupMoveSnapshotItem) => { x: number; y: number },
	) => {
		return snapshots
			.map((snapshot) => {
				const baseline = baselineElementsById[snapshot.id];
				if (!baseline) return null;
				return cloneElementWithGeometry(baseline, resolveGeometry(snapshot));
			})
			.filter((element): element is AnyCanvasElementDisplay => Boolean(element));
	};

	return {
		bounds,
		selectedIds,
		buildPreview: (deltaPixelX: number, deltaPixelY: number) => {
			const deltaGridX = Math.round(deltaPixelX / cellWidth);
			const deltaGridY = Math.round(deltaPixelY / cellHeight);
			return createElements((snapshot) => ({
				x: snapshot.x + deltaGridX,
				y: snapshot.y + deltaGridY,
			}));
		},
		commit: (resolvedGridX: number, resolvedGridY: number) => {
			const deltaGridX = resolvedGridX - bounds.gridX;
			const deltaGridY = resolvedGridY - bounds.gridY;
			return createElements((snapshot) => ({
				x: snapshot.x + deltaGridX,
				y: snapshot.y + deltaGridY,
			}));
		},
		rollback: () => {
			return createElements((snapshot) => ({
				x: snapshot.x,
				y: snapshot.y,
			}));
		},
	};
}
