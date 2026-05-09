import type { PointerEvent as ReactPointerEvent } from "react";
import { resolveMovementCommit } from "@/lib/movement-commit";
import { DRAG_THRESHOLD_PX } from "@/lib/drag-config";
import { startManagedPointerDragSession } from "@/lib/managed-pointer-drag-session";
import { useEditorGridStore } from "@/providers/editor/store";
import type { AnyCanvasElementDisplay } from "@/types";
import { createGroupMovableTarget } from "./snapshots";
import type {
	GroupMoveBounds,
	GroupMoveSession,
	GroupMoveSnapshotItem,
	WorldRect,
} from "./types";

const GROUP_SNAP_SEARCH_RADIUS = 20;

export function startGroupMoveMode({
	e,
	container,
	state,
	snapshots,
	bounds,
	groupMoveSessionRef,
	clearDragSession,
	dragSessionCleanupRef,
	updateElementsBulk,
	setActiveMarqueeRect,
	setCommittedMarqueeRect,
	resetGroupMoveSession,
}: {
	e: ReactPointerEvent<HTMLDivElement>;
	container: HTMLDivElement;
	state: ReturnType<typeof useEditorGridStore.getState>;
	snapshots: GroupMoveSnapshotItem[];
	bounds: GroupMoveBounds;
	groupMoveSessionRef: React.MutableRefObject<GroupMoveSession>;
	clearDragSession: () => void;
	dragSessionCleanupRef: React.MutableRefObject<(() => void) | null>;
	updateElementsBulk: (elements: AnyCanvasElementDisplay[]) => void;
	setActiveMarqueeRect: (rect: WorldRect | null) => void;
	setCommittedMarqueeRect: (rect: WorldRect | null) => void;
	resetGroupMoveSession: () => void;
}) {
	groupMoveSessionRef.current.active = true;
	groupMoveSessionRef.current.pointerId = e.pointerId;

	const groupTarget = createGroupMovableTarget({
		snapshots,
		bounds,
		gridSize: state.gridSize,
	});

	clearDragSession();
	dragSessionCleanupRef.current = startManagedPointerDragSession({
		target: container,
		pointerId: e.pointerId,
		startClientX: e.clientX,
		startClientY: e.clientY,
		thresholdPx: DRAG_THRESHOLD_PX,
		getZoomLevel: () => useEditorGridStore.getState().zoomLevel,
		onMove: ({ deltaPixelX, deltaPixelY }) => {
			updateElementsBulk(groupTarget.buildPreview(deltaPixelX, deltaPixelY));
			setActiveMarqueeRect({
				x: groupTarget.bounds.pixelX + deltaPixelX,
				y: groupTarget.bounds.pixelY + deltaPixelY,
				width: groupTarget.bounds.pixelWidth,
				height: groupTarget.bounds.pixelHeight,
			});
		},
		onComplete: ({ didDrag, deltaPixelX, deltaPixelY }) => {
			if (!didDrag) {
				resetGroupMoveSession();
				setActiveMarqueeRect(null);
				return;
			}

			const [cellWidth, cellHeight] = state.gridSize;
			const result = resolveMovementCommit({
				bounds: {
					gridX: groupTarget.bounds.gridX,
					gridY: groupTarget.bounds.gridY,
					gridWidth: groupTarget.bounds.gridWidth,
					gridHeight: groupTarget.bounds.gridHeight,
					pixelX: groupTarget.bounds.pixelX,
					pixelY: groupTarget.bounds.pixelY,
				},
				deltaPixelX,
				deltaPixelY,
				cellWidth,
				cellHeight,
				excludeIds: groupTarget.selectedIds,
				searchRadius: GROUP_SNAP_SEARCH_RADIUS,
				isAreaFree: state.isAreaFree,
				findNearestFree: state.findNearestFree,
			});

			if (result.committed) {
				updateElementsBulk(
					groupTarget.commit(result.resolvedGridX, result.resolvedGridY),
				);
			} else {
				updateElementsBulk(groupTarget.rollback());
			}
			setCommittedMarqueeRect({
				x: result.resolvedPixelX,
				y: result.resolvedPixelY,
				width: groupTarget.bounds.pixelWidth,
				height: groupTarget.bounds.pixelHeight,
			});

			resetGroupMoveSession();
			setActiveMarqueeRect(null);
		},
		onCancel: ({ didDrag }) => {
			if (didDrag) {
				updateElementsBulk(groupTarget.rollback());
			}
			resetGroupMoveSession();
			setActiveMarqueeRect(null);
		},
	});
}
