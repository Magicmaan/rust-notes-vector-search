import type { AnyCanvasElementDisplay } from "@/types";
import { useEditorGridStore } from "@/providers/editor/store";
import { resolveMovementCommit } from "@/lib/movement-commit";
import { DRAG_THRESHOLD_PX } from "@/lib/drag-config";
import { normalizeRect, pointInsideRect, getIntersectingNoteIds } from "../../hooks/marquee/geometry";
import { buildGroupMoveSnapshots, createGroupMovableTarget, toGroupMoveBounds } from "../../hooks/marquee/snapshots";
import type { CanvasCallback } from "../types";

const GROUP_SNAP_SEARCH_RADIUS = 20;

type SelectionSession = {
	active: boolean;
	pointerId: number;
	startWorldX: number;
	startWorldY: number;
	startScreenX: number;
	startScreenY: number;
	startedWithShift: boolean;
	selectedIdsAtStart: string[];
	didDrag: boolean;
};

type GroupMoveSession = {
	active: boolean;
	pointerId: number;
	startScreenX: number;
	startScreenY: number;
	groupTarget: ReturnType<typeof createGroupMovableTarget> | null;
};

const selectionSession: SelectionSession = {
	active: false,
	pointerId: -1,
	startWorldX: 0,
	startWorldY: 0,
	startScreenX: 0,
	startScreenY: 0,
	startedWithShift: false,
	selectedIdsAtStart: [],
	didDrag: false,
};

const groupMoveSession: GroupMoveSession = {
	active: false,
	pointerId: -1,
	startScreenX: 0,
	startScreenY: 0,
	groupTarget: null,
};

function isInsideCanvas(target: EventTarget | null) {
	const container = document.getElementById("editor-grid-container");
	return Boolean(container && target && container.contains(target as Node));
}

function isCanvasElementTarget(target: EventTarget | null) {
	if (!(target instanceof Node)) {
		return false;
	}
	const element =
		target instanceof Element ? target : (target.parentElement ?? null);
	if (!element) {
		return false;
	}
	return Boolean(element.closest("[data-canvas-element]"));
}

function applySelection(rect: { x: number; y: number; width: number; height: number }) {
	const state = useEditorGridStore.getState();
	const intersectingIds = getIntersectingNoteIds({
		rect,
		elements: state.elements,
		gridSize: state.gridSize,
	});
	if (selectionSession.startedWithShift) {
		const toggled = new Set(selectionSession.selectedIdsAtStart);
		for (const id of intersectingIds) {
			if (toggled.has(id)) toggled.delete(id);
			else toggled.add(id);
		}
		return Array.from(toggled);
	}
	return intersectingIds;
}

export const onMarqueePointerDown: CanvasCallback = (context) => {
	if (context.flags.isPanning || context.flags.spaceHeld) return null;
	if (context.event.button !== 0) {
		return null;
	}
	if (isCanvasElementTarget(context.event.target)) {
		return null;
	}
	if (!isInsideCanvas(context.event.target)) {
		return null;
	}

	const state = useEditorGridStore.getState();
	const committedRect = context.marqueeRect;

	if (
		committedRect &&
		state.selectedNoteIds.length > 0 &&
		pointInsideRect(
			{ x: context.pointer.worldX, y: context.pointer.worldY },
			committedRect,
		)
	) {
		const snapshots = buildGroupMoveSnapshots(state);
		const bounds = toGroupMoveBounds(snapshots, state.gridSize);
		if (bounds) {
			groupMoveSession.active = true;
			groupMoveSession.pointerId = context.event.pointerId;
			groupMoveSession.startScreenX = context.pointer.screenX;
			groupMoveSession.startScreenY = context.pointer.screenY;
			groupMoveSession.groupTarget = createGroupMovableTarget({
				snapshots,
				bounds,
				gridSize: state.gridSize,
			});
		}
		return null;
	}

	selectionSession.active = true;
	selectionSession.pointerId = context.event.pointerId;
	selectionSession.startWorldX = context.pointer.worldX;
	selectionSession.startWorldY = context.pointer.worldY;
	selectionSession.startScreenX = context.pointer.screenX;
	selectionSession.startScreenY = context.pointer.screenY;
	selectionSession.startedWithShift = Boolean(context.event.shiftKey);
	selectionSession.selectedIdsAtStart = [...state.selectedNoteIds];
	selectionSession.didDrag = false;
	return null;
};

export const onMarqueePointerMove: CanvasCallback = (context) => {
	if (
		selectionSession.active &&
		context.event.pointerId === selectionSession.pointerId
	) {
		const deltaX = context.pointer.screenX - selectionSession.startScreenX;
		const deltaY = context.pointer.screenY - selectionSession.startScreenY;
		const distance = Math.hypot(deltaX, deltaY);
		if (distance >= DRAG_THRESHOLD_PX) {
			selectionSession.didDrag = true;
		}
		if (!selectionSession.didDrag) return null;

		const rect = normalizeRect(
			selectionSession.startWorldX,
			selectionSession.startWorldY,
			selectionSession.startWorldX + deltaX,
			selectionSession.startWorldY + deltaY,
		);
		const ids = applySelection(rect);
		return [
			{ type: "setMarqueeRect", rect },
			{ type: "setSelection", ids },
		];
	}

	if (
		groupMoveSession.active &&
		groupMoveSession.groupTarget &&
		context.event.pointerId === groupMoveSession.pointerId
	) {
		const deltaPixelX = context.pointer.screenX - groupMoveSession.startScreenX;
		const deltaPixelY = context.pointer.screenY - groupMoveSession.startScreenY;
		const groupTarget = groupMoveSession.groupTarget;
		return [
			{
				type: "updateElementsBulk",
				elements: groupTarget.buildPreview(deltaPixelX, deltaPixelY),
			},
			{
				type: "setMarqueeRect",
				rect: {
					x: groupTarget.bounds.pixelX + deltaPixelX,
					y: groupTarget.bounds.pixelY + deltaPixelY,
					width: groupTarget.bounds.pixelWidth,
					height: groupTarget.bounds.pixelHeight,
				},
			},
		];
	}
	return null;
};

export const onMarqueePointerUp: CanvasCallback = (context) => {
	if (
		selectionSession.active &&
		context.event.pointerId === selectionSession.pointerId
	) {
		const deltaX = context.pointer.screenX - selectionSession.startScreenX;
		const deltaY = context.pointer.screenY - selectionSession.startScreenY;
		selectionSession.active = false;
		selectionSession.pointerId = -1;
		if (!selectionSession.didDrag) {
			return { type: "setMarqueeRect", rect: null };
		}
		const rect = normalizeRect(
			selectionSession.startWorldX,
			selectionSession.startWorldY,
			selectionSession.startWorldX + deltaX,
			selectionSession.startWorldY + deltaY,
		);
		const ids = applySelection(rect);
		return [
			{ type: "setMarqueeRect", rect },
			{ type: "setSelection", ids },
		];
	}

	if (
		groupMoveSession.active &&
		groupMoveSession.groupTarget &&
		context.event.pointerId === groupMoveSession.pointerId
	) {
		const deltaPixelX = context.pointer.screenX - groupMoveSession.startScreenX;
		const deltaPixelY = context.pointer.screenY - groupMoveSession.startScreenY;
		const groupTarget = groupMoveSession.groupTarget;
		const state = useEditorGridStore.getState();
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

		groupMoveSession.active = false;
		groupMoveSession.pointerId = -1;
		groupMoveSession.groupTarget = null;

		const elements = result.committed
			? groupTarget.commit(result.resolvedGridX, result.resolvedGridY)
			: groupTarget.rollback();
		const rect = {
			x: result.resolvedPixelX,
			y: result.resolvedPixelY,
			width: groupTarget.bounds.pixelWidth,
			height: groupTarget.bounds.pixelHeight,
		};
		return [
			{ type: "updateElementsBulk", elements },
			{ type: "setMarqueeRect", rect },
		];
	}
	return null;
};

export const onMarqueePointerCancel: CanvasCallback = () => {
	if (selectionSession.active) {
		selectionSession.active = false;
		return { type: "setMarqueeRect", rect: null };
	}
	if (groupMoveSession.active && groupMoveSession.groupTarget) {
		const elements: AnyCanvasElementDisplay[] = groupMoveSession.groupTarget.rollback();
		groupMoveSession.active = false;
		groupMoveSession.pointerId = -1;
		groupMoveSession.groupTarget = null;
		return [
			{ type: "updateElementsBulk", elements },
			{ type: "setMarqueeRect", rect: null },
		];
	}
	return null;
};

export const onMarqueeBlur: CanvasCallback = () => {
	if (selectionSession.active || groupMoveSession.active) {
		selectionSession.active = false;
		groupMoveSession.active = false;
		groupMoveSession.pointerId = -1;
		groupMoveSession.groupTarget = null;
		return { type: "setMarqueeRect", rect: null };
	}
	return null;
};

export const onMarqueeOutsidePointerDown: CanvasCallback = (context) => {
	if (context.event.kind !== "pointerDown") return null;
	if (isCanvasElementTarget(context.event.target)) return null;
	const committedRect = context.marqueeRect;
	if (!committedRect) return null;
	const target = context.event.target as Node | null;
	const container = document.getElementById("editor-grid-container");
	if (!container || !target || !container.contains(target)) {
		return { type: "clearSelection" };
	}
	const inside = pointInsideRect(
		{ x: context.pointer.worldX, y: context.pointer.worldY },
		committedRect,
	);
	if (!inside) {
		return { type: "clearSelection" };
	}
	return null;
};
