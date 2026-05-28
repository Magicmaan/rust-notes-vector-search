import type { AnyCanvasElementDisplay } from "@/types";
import { resolveMovementCommit } from "@/lib/movement-commit";
import { DRAG_THRESHOLD_PX } from "@/lib/drag-config";
import {
	normalizeRect,
	pointInsideRect,
	getIntersectingNoteIds,
} from "../../hooks/marquee/geometry";
import {
	buildGroupMoveSnapshots,
	createGroupMovableTarget,
	toGroupMoveBounds,
} from "../../hooks/marquee/snapshots";
import type { CanvasCallback, CanvasOperation, FrameContext } from "../types";
import { PluginBase } from "./types";

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
	dragging: boolean;
};

type GroupMoveSession = {
	active: boolean;
	pointerId: number;
	startScreenX: number;
	startScreenY: number;
	groupTarget: ReturnType<typeof createGroupMovableTarget> | null;
};

type MarqueeCallbacks = {
	onMarqueePointerDown: CanvasCallback;
	onMarqueePointerMove: CanvasCallback;
	onMarqueePointerUp: CanvasCallback;
	onMarqueePointerCancel: CanvasCallback;
	onMarqueeBlur: CanvasCallback;
	onMarqueeOutsidePointerDown: CanvasCallback;
};

function isInsideCanvas(target: EventTarget | null, container: HTMLDivElement) {
	return Boolean(target && container.contains(target as Node));
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

type MarqueePluginState = {
	groupTarget: ReturnType<typeof createGroupMovableTarget> | null;
};

// This Plugin handles the marquee (drag to select) interaction to the canvas. As part of it, it also handles group movement
export default class MarqueePlugin extends PluginBase<MarqueePluginState> {
	name = "Marquee Plugin";
	description = "Handles marquee selection and group movement.";
	version = "0.1.0";

	state: MarqueePluginState = {
		groupTarget: null,
	};

	applySelection(rect: {
		x: number;
		y: number;
		width: number;
		height: number;
	}) {
		const state = this.runtime?.getPorts().read.getState();
		if (!state) return [];
		const intersectingIds = getIntersectingNoteIds({
			rect,
			elements: state.elements,
			gridSize: state.gridSize,
		});
		if (this.selection.startedWithShift) {
			const toggled = new Set(this.selection.selectedIdsAtStart);
			for (const id of intersectingIds) {
				if (toggled.has(id)) toggled.delete(id);
				else toggled.add(id);
			}
			return Array.from(toggled);
		}
		return intersectingIds;
	}

	protected override onPointerDown(
		context: FrameContext,
	): null | CanvasOperation | CanvasOperation[] {
		const outsidePointerDownOperation = this.onOutsidePointerDown(context);
		if (outsidePointerDownOperation) {
			return outsidePointerDownOperation;
		}

		if (context.flags.isPanning || context.flags.spaceHeld) return null;
		if (context.event.button !== 0) {
			return null;
		}
		if (isCanvasElementTarget(context.event.target)) {
			return null;
		}
		if (!isInsideCanvas(context.event.target, context.container)) {
			return null;
		}

		const ports = context.ports;
		const state = ports.read.getState();
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
				const baselineElementsById = snapshots.reduce<
					Record<string, AnyCanvasElementDisplay>
				>((acc, snapshot) => {
					const element = state.elements[snapshot.id];
					if (element) {
						acc[snapshot.id] = element;
					}
					return acc;
				}, {});

				this.setSelectionState({
					clicking: true,
					pointerId: context.event.pointerId,
					startWorldX: context.pointer.worldX,
					startWorldY: context.pointer.worldY,
					startScreenX: context.pointer.screenX,
				});
				this.setState({
					groupTarget: createGroupMovableTarget({
						snapshots,
						bounds,
						gridSize: state.gridSize,
						baselineElementsById,
					}),
				});
				// groupMoveSession.clicking = true;
				// groupMoveSession.pointerId = context.event.pointerId;
				// groupMoveSession.startScreenX = context.pointer.screenX;
				// groupMoveSession.startScreenY = context.pointer.screenY;
				// groupMoveSession.groupTarget = createGroupMovableTarget({
				// 	snapshots,
				// 	bounds,
				// 	gridSize: state.gridSize,
				// 	baselineElementsById,
				// });
			}
			return null;
		}

		this.setSelectionState({
			clicking: true,
			pointerId: context.event.pointerId,
			startWorldX: context.pointer.worldX,
			startWorldY: context.pointer.worldY,
			startScreenX: context.pointer.screenX,
			startScreenY: context.pointer.screenY,
			startedWithShift: Boolean(context.event.shiftKey),
			selectedIdsAtStart: [...state.selectedNoteIds],
			dragging: false,
		});
		// selectionSession.active = true;
		// selectionSession.pointerId = context.event.pointerId;
		// selectionSession.startWorldX = context.pointer.worldX;
		// selectionSession.startWorldY = context.pointer.worldY;
		// selectionSession.startScreenX = context.pointer.screenX;
		// selectionSession.startScreenY = context.pointer.screenY;
		// selectionSession.startedWithShift = Boolean(context.event.shiftKey);
		// selectionSession.selectedIdsAtStart = [...state.selectedNoteIds];
		// selectionSession.dragging = false;
		return null;
	}

	protected override onPointerMove(
		context: FrameContext,
	): null | CanvasOperation | CanvasOperation[] {
		if (
			this.selection.clicking &&
			this.state.groupTarget &&
			context.event.pointerId === this.selection.pointerId
		) {
			const deltaPixelX = context.pointer.screenX - this.selection.startScreenX;
			const deltaPixelY = context.pointer.screenY - this.selection.startScreenY;
			const groupTarget = this.state.groupTarget;
			return [
				{
					type: "element.previewBulk",
					elements: groupTarget.buildPreview(deltaPixelX, deltaPixelY),
				},
				{
					type: "ui.setMarqueeRect",
					rect: {
						x: groupTarget.bounds.pixelX + deltaPixelX,
						y: groupTarget.bounds.pixelY + deltaPixelY,
						width: groupTarget.bounds.pixelWidth,
						height: groupTarget.bounds.pixelHeight,
					},
				},
			];
		}

		if (
			this.selection.clicking &&
			context.event.pointerId === this.selection.pointerId
		) {
			const deltaX = context.pointer.screenX - this.selection.startScreenX;
			const deltaY = context.pointer.screenY - this.selection.startScreenY;
			const distance = Math.hypot(deltaX, deltaY);
			if (distance >= DRAG_THRESHOLD_PX) {
				this.selection.dragging = true;
			}
			if (!this.selection.dragging) return null;

			const rect = normalizeRect(
				this.selection.startWorldX,
				this.selection.startWorldY,
				context.pointer.worldX,
				context.pointer.worldY,
			);
			const ids = this.applySelection(rect);
			return [
				{ type: "ui.setMarqueeRect", rect },
				{ type: "selection.set", ids },
			] as CanvasOperation[];
		}

		return null;
	}

	protected override onPointerUp(
		context: FrameContext,
	): null | CanvasOperation | CanvasOperation[] {
		if (
			this.selection.clicking &&
			this.state.groupTarget &&
			context.event.pointerId === this.selection.pointerId
		) {
			const deltaPixelX = context.pointer.screenX - this.selection.startScreenX;
			const deltaPixelY = context.pointer.screenY - this.selection.startScreenY;
			const groupTarget = this.state.groupTarget;
			const ports = context.ports;
			const state = ports.read.getState();
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
				isAreaFree: ports.query.isAreaFree,
				findNearestFree: ports.query.findNearestFree,
			});

			this.selection.clicking = false;
			this.selection.pointerId = -1;
			this.state.groupTarget = null;

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
				{ type: "element.commitBulk", elements },
				{ type: "ui.setMarqueeRect", rect },
			];
		}

		if (
			this.selection.clicking &&
			context.event.pointerId === this.selection.pointerId
		) {
			this.selection.clicking = false;
			this.selection.pointerId = -1;
			if (!this.selection.dragging) {
				return { type: "ui.setMarqueeRect", rect: null } as CanvasOperation;
			}
			const rect = normalizeRect(
				this.selection.startWorldX,
				this.selection.startWorldY,
				context.pointer.worldX,
				context.pointer.worldY,
			);
			const ids = this.applySelection(rect);
			return [
				{ type: "ui.setMarqueeRect", rect },
				{ type: "selection.set", ids },
			];
		}

		return null;
	}

	protected override onPointerCancel(
		ctx: FrameContext,
	): null | CanvasOperation | CanvasOperation[] {
		if (this.selection.clicking && this.state.groupTarget) {
			const elements: AnyCanvasElementDisplay[] =
				this.state.groupTarget.rollback();
			this.selection.clicking = false;
			this.selection.pointerId = -1;
			this.state.groupTarget = null;
			return [
				{ type: "element.rollbackSession", elements },
				{ type: "ui.setMarqueeRect", rect: null },
			] as CanvasOperation[];
		}
		if (this.selection.clicking) {
			this.selection.clicking = false;
			return { type: "ui.setMarqueeRect", rect: null } as CanvasOperation;
		}
		return null;
	}

	protected override onBlur(ctx: FrameContext): null {
		if (this.selection.clicking || this.state.groupTarget) {
			this.selection.clicking = false;
			this.state.groupTarget = null;
			return null;
		}
		return null;
	}

	protected onOutsidePointerDown(
		context: FrameContext,
	): null | CanvasOperation {
		if (context.event.kind !== "pointerDown") return null;
		if (isCanvasElementTarget(context.event.target)) return null;
		const committedRect = context.marqueeRect;
		if (!committedRect) return null;
		const target = context.event.target as Node | null;
		if (!target || !context.container.contains(target)) {
			return { type: "selection.clear" };
		}
		const inside = pointInsideRect(
			{ x: context.pointer.worldX, y: context.pointer.worldY },
			committedRect,
		);
		if (!inside) {
			return { type: "selection.clear" };
		}
		return null;
	}
}

// This Plugin handles the marquee (drag to select) interaction to the canvas. As part of it, it also handles group movement
//
// //
// export function createMarqueeCallbacks(): MarqueeCallbacks {
// 	const this.selection: SelectionSession = {
// 		active: false,
// 		pointerId: -1,
// 		startWorldX: 0,
// 		startWorldY: 0,
// 		startScreenX: 0,
// 		startScreenY: 0,
// 		startedWithShift: false,
// 		selectedIdsAtStart: [],
// 		dragging: false,
// 	};

// 	const groupMoveSession: GroupMoveSession = {
// 		active: false,
// 		pointerId: -1,
// 		startScreenX: 0,
// 		startScreenY: 0,
// 		groupTarget: null,
// 	};

// 	const applySelection = (rect: {
// 		x: number;
// 		y: number;
// 		width: number;
// 		height: number;
// 	}) => {
// 		const state = useEditorGridStore.getState();
// 		const intersectingIds = getIntersectingNoteIds({
// 			rect,
// 			elements: state.elements,
// 			gridSize: state.gridSize,
// 		});
// 		if (this.selection.startedWithShift) {
// 			const toggled = new Set(selectionSession.selectedIdsAtStart);
// 			for (const id of intersectingIds) {
// 				if (toggled.has(id)) toggled.delete(id);
// 				else toggled.add(id);
// 			}
// 			return Array.from(toggled);
// 		}
// 		return intersectingIds;
// 	};

// 	const onMarqueePointerDown: CanvasCallback = (context) => {
// 		if (context.flags.isPanning || context.flags.spaceHeld) return null;
// 		if (context.event.button !== 0) {
// 			return null;
// 		}
// 		if (isCanvasElementTarget(context.event.target)) {
// 			return null;
// 		}
// 		if (!isInsideCanvas(context.event.target, context.container)) {
// 			return null;
// 		}

// 		const state = useEditorGridStore.getState();
// 		const committedRect = context.marqueeRect;

// 		if (
// 			committedRect &&
// 			state.selectedNoteIds.length > 0 &&
// 			pointInsideRect(
// 				{ x: context.pointer.worldX, y: context.pointer.worldY },
// 				committedRect,
// 			)
// 		) {
// 			const snapshots = buildGroupMoveSnapshots(state);
// 			const bounds = toGroupMoveBounds(snapshots, state.gridSize);
// 			if (bounds) {
// 				const baselineElementsById = snapshots.reduce<
// 					Record<string, AnyCanvasElementDisplay>
// 				>((acc, snapshot) => {
// 					const element = state.elements[snapshot.id];
// 					if (element) {
// 						acc[snapshot.id] = element;
// 					}
// 					return acc;
// 				}, {});
// 				groupMoveSession.clicking = true;
// 				groupMoveSession.pointerId = context.event.pointerId;
// 				groupMoveSession.startScreenX = context.pointer.screenX;
// 				groupMoveSession.startScreenY = context.pointer.screenY;
// 				groupMoveSession.groupTarget = createGroupMovableTarget({
// 					snapshots,
// 					bounds,
// 					gridSize: state.gridSize,
// 					baselineElementsById,
// 				});
// 			}
// 			return null;
// 		}

// 		selectionSession.active = true;
// 		selectionSession.pointerId = context.event.pointerId;
// 		selectionSession.startWorldX = context.pointer.worldX;
// 		selectionSession.startWorldY = context.pointer.worldY;
// 		selectionSession.startScreenX = context.pointer.screenX;
// 		selectionSession.startScreenY = context.pointer.screenY;
// 		selectionSession.startedWithShift = Boolean(context.event.shiftKey);
// 		selectionSession.selectedIdsAtStart = [...state.selectedNoteIds];
// 		selectionSession.dragging = false;
// 		return null;
// 	};

// 	const onMarqueePointerMove: CanvasCallback = (context) => {
// 		if (
// 			selectionSession.active &&
// 			context.event.pointerId === selectionSession.pointerId
// 		) {
// 			const deltaX = context.pointer.screenX - selectionSession.startScreenX;
// 			const deltaY = context.pointer.screenY - selectionSession.startScreenY;
// 			const distance = Math.hypot(deltaX, deltaY);
// 			if (distance >= DRAG_THRESHOLD_PX) {
// 				selectionSession.dragging = true;
// 			}
// 			if (!selectionSession.dragging) return null;

// 			const rect = normalizeRect(
// 				selectionSession.startWorldX,
// 				selectionSession.startWorldY,
// 				context.pointer.worldX,
// 				context.pointer.worldY,
// 			);
// 			const ids = applySelection(rect);
// 			return [
// 				{ type: "ui.setMarqueeRect", rect },
// 				{ type: "selection.set", ids },
// 			];
// 		}

// 		if (
// 			groupMoveSession.clicking &&
// 			groupMoveSession.groupTarget &&
// 			context.event.pointerId === groupMoveSession.pointerId
// 		) {
// 			const deltaPixelX =
// 				context.pointer.screenX - groupMoveSession.startScreenX;
// 			const deltaPixelY =
// 				context.pointer.screenY - groupMoveSession.startScreenY;
// 			const groupTarget = groupMoveSession.groupTarget;
// 			return [
// 				{
// 					type: "element.previewBulk",
// 					elements: groupTarget.buildPreview(deltaPixelX, deltaPixelY),
// 				},
// 				{
// 					type: "ui.setMarqueeRect",
// 					rect: {
// 						x: groupTarget.bounds.pixelX + deltaPixelX,
// 						y: groupTarget.bounds.pixelY + deltaPixelY,
// 						width: groupTarget.bounds.pixelWidth,
// 						height: groupTarget.bounds.pixelHeight,
// 					},
// 				},
// 			];
// 		}
// 		return null;
// 	};

// 	const onMarqueePointerUp: CanvasCallback = (context) => {
// 		if (
// 			selectionSession.active &&
// 			context.event.pointerId === selectionSession.pointerId
// 		) {
// 			selectionSession.active = false;
// 			selectionSession.pointerId = -1;
// 			if (!selectionSession.dragging) {
// 				return { type: "ui.setMarqueeRect", rect: null };
// 			}
// 			const rect = normalizeRect(
// 				selectionSession.startWorldX,
// 				selectionSession.startWorldY,
// 				context.pointer.worldX,
// 				context.pointer.worldY,
// 			);
// 			const ids = applySelection(rect);
// 			return [
// 				{ type: "ui.setMarqueeRect", rect },
// 				{ type: "selection.set", ids },
// 			];
// 		}

// 		if (
// 			groupMoveSession.clicking &&
// 			groupMoveSession.groupTarget &&
// 			context.event.pointerId === groupMoveSession.pointerId
// 		) {
// 			const deltaPixelX =
// 				context.pointer.screenX - groupMoveSession.startScreenX;
// 			const deltaPixelY =
// 				context.pointer.screenY - groupMoveSession.startScreenY;
// 			const groupTarget = groupMoveSession.groupTarget;
// 			const state = useEditorGridStore.getState();
// 			const [cellWidth, cellHeight] = state.gridSize;
// 			const result = resolveMovementCommit({
// 				bounds: {
// 					gridX: groupTarget.bounds.gridX,
// 					gridY: groupTarget.bounds.gridY,
// 					gridWidth: groupTarget.bounds.gridWidth,
// 					gridHeight: groupTarget.bounds.gridHeight,
// 					pixelX: groupTarget.bounds.pixelX,
// 					pixelY: groupTarget.bounds.pixelY,
// 				},
// 				deltaPixelX,
// 				deltaPixelY,
// 				cellWidth,
// 				cellHeight,
// 				excludeIds: groupTarget.selectedIds,
// 				searchRadius: GROUP_SNAP_SEARCH_RADIUS,
// 				isAreaFree: state.isAreaFree,
// 				findNearestFree: state.findNearestFree,
// 			});

// 			groupMoveSession.clicking = false;
// 			groupMoveSession.pointerId = -1;
// 			groupMoveSession.groupTarget = null;

// 			const elements = result.committed
// 				? groupTarget.commit(result.resolvedGridX, result.resolvedGridY)
// 				: groupTarget.rollback();
// 			const rect = {
// 				x: result.resolvedPixelX,
// 				y: result.resolvedPixelY,
// 				width: groupTarget.bounds.pixelWidth,
// 				height: groupTarget.bounds.pixelHeight,
// 			};
// 			return [
// 				{ type: "element.previewBulk", elements },
// 				{ type: "ui.setMarqueeRect", rect },
// 			];
// 		}
// 		return null;
// 	};

// 	const onMarqueePointerCancel: CanvasCallback = () => {
// 		if (selectionSession.active) {
// 			selectionSession.active = false;
// 			return { type: "ui.setMarqueeRect", rect: null };
// 		}
// 		if (groupMoveSession.clicking && groupMoveSession.groupTarget) {
// 			const elements: AnyCanvasElementDisplay[] =
// 				groupMoveSession.groupTarget.rollback();
// 			groupMoveSession.clicking = false;
// 			groupMoveSession.pointerId = -1;
// 			groupMoveSession.groupTarget = null;
// 			return [
// 				{ type: "element.previewBulk", elements },
// 				{ type: "ui.setMarqueeRect", rect: null },
// 			];
// 		}
// 		return null;
// 	};

// 	const onMarqueeBlur: CanvasCallback = () => {
// 		if (selectionSession.active || groupMoveSession.active) {
// 			selectionSession.active = false;
// 			groupMoveSession.clicking = false;
// 			groupMoveSession.pointerId = -1;
// 			groupMoveSession.groupTarget = null;
// 			return { type: "ui.setMarqueeRect", rect: null };
// 		}
// 		return null;
// 	};

// 	const onMarqueeOutsidePointerDown: CanvasCallback = (context) => {
// 		if (context.event.kind !== "pointerDown") return null;
// 		if (isCanvasElementTarget(context.event.target)) return null;
// 		const committedRect = context.marqueeRect;
// 		if (!committedRect) return null;
// 		const target = context.event.target as Node | null;
// 		if (!target || !context.container.contains(target)) {
// 			return { type: "selection.clear" };
// 		}
// 		const inside = pointInsideRect(
// 			{ x: context.pointer.worldX, y: context.pointer.worldY },
// 			committedRect,
// 		);
// 		if (!inside) {
// 			return { type: "selection.clear" };
// 		}
// 		return null;
// 	};

// 	return {
// 		onMarqueePointerDown,
// 		onMarqueePointerMove,
// 		onMarqueePointerUp,
// 		onMarqueePointerCancel,
// 		onMarqueeBlur,
// 		onMarqueeOutsidePointerDown,
// 	};
// }
