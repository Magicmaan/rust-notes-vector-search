import { cloneElementWithGeometry, type AnyCanvasElementDisplay } from "@/types";
import { resolveMovementCommit } from "@/lib/movement-commit";
import { DRAG_THRESHOLD_PX } from "@/lib/drag-config";
import type { CanvasOperation, FrameContext } from "../types";
import { PluginBase } from "./types";

const NOTE_SNAP_SEARCH_RADIUS = 20;
const RESIZE_THRESHOLD_PX = 4;
const RESIZE_MIN_CELL_WIDTH = 2;
const RESIZE_MIN_CELL_HEIGHT = 2;

type ResizeAnchor = {
	horizontal: "left" | "right";
	vertical: "top" | "bottom";
};

type ResizePlacement = {
	x: number;
	y: number;
	width: number;
	height: number;
	pixelX: number;
	pixelY: number;
	pixelWidth: number;
	pixelHeight: number;
};

type InteractionMode = "drag" | "resize" | null;

type NotePluginState = {
	activeElementId: string | null;
	baselineElement: AnyCanvasElementDisplay | null;
	mode: InteractionMode;
	resizeAnchor: ResizeAnchor;
	resizeHeading: "left" | "right" | "top" | "bottom";
	resizeLastPlacement: ResizePlacement | null;
};

function snapToMultiple(num: number, multiple: number) {
	return Math.round(num / multiple) * multiple;
}

function clampMinDimension(value: number, minVal: number) {
	return Math.max(minVal, value);
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
	return startA < endB && endA > startB;
}

function resolveNoteElement(target: EventTarget | null): {
	node: HTMLElement;
	elementId: string;
} | null {
	if (!(target instanceof Node)) {
		return null;
	}
	const source = target instanceof Element ? target : target.parentElement;
	const node = source?.closest("[data-canvas-element-id]") as HTMLElement | null;
	if (!node) return null;
	if (node.getAttribute("data-canvas-element") !== "note") return null;
	const elementId = node.getAttribute("data-canvas-element-id");
	if (!elementId) return null;
	return { elementId, node };
}

function resolveResizeAnchor(node: HTMLElement, clientX: number, clientY: number): ResizeAnchor {
	const rect = node.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		return { horizontal: "right", vertical: "bottom" };
	}
	const localX = clientX - rect.left;
	const localY = clientY - rect.top;
	return {
		horizontal: localX <= rect.width / 2 ? "left" : "right",
		vertical: localY <= rect.height / 2 ? "top" : "bottom",
	};
}

function getResizeHeading(deltaX: number, deltaY: number): "left" | "right" | "top" | "bottom" {
	if (Math.abs(deltaX) >= Math.abs(deltaY)) {
		return deltaX < 0 ? "left" : "right";
	}
	return deltaY < 0 ? "top" : "bottom";
}

function createResizeAttrsOperation(
	elementId: string,
	state: "none" | string,
	heading: "none" | "left" | "right" | "top" | "bottom",
): CanvasOperation {
	return { type: "ui.setResizeAttrs", elementId, state, heading };
}

export class NotePlugin extends PluginBase<NotePluginState> {
	name = "Note Plugin";
	description = "Handles note selection, movement, and resize interactions.";
	version = "0.2.0";

	state: NotePluginState = {
		activeElementId: null,
		baselineElement: null,
		mode: null,
		resizeAnchor: { horizontal: "right", vertical: "bottom" },
		resizeHeading: "right",
		resizeLastPlacement: null,
	};

	protected override onPointerDown(
		context: FrameContext,
	): CanvasOperation | CanvasOperation[] | null {
		if (context.flags.isPanning || context.flags.spaceHeld) return null;
		if (this.selection.clicking) return null;

		const resolved = resolveNoteElement(context.event.target);
		if (!resolved) return null;
		const element = context.ports.query.getElement(resolved.elementId);
		if (!element || element.variant !== "note") return null;
		const { node } = resolved;

		const selected = context.ports.read.getState().selectedNoteIds;
		const isSelected = selected.includes(element.id);
		let nextSelection = selected;

		if (context.event.shiftKey) {
			nextSelection = isSelected
				? selected.filter((id) => id !== element.id)
				: [...selected, element.id];
		} else if (!isSelected || selected.length > 1) {
			nextSelection = [element.id];
		}

		this.state.activeElementId = element.id;
		this.state.baselineElement = element;
		this.selection.clicking = true;
		this.selection.dragging = false;
		this.selection.pointerId = context.event.pointerId;
		this.selection.startScreenX = context.pointer.screenX;
		this.selection.startScreenY = context.pointer.screenY;

		if (context.event.button === 2) {
			this.state.mode = "resize";
			this.state.resizeAnchor = resolveResizeAnchor(
				node,
				context.pointer.screenX,
				context.pointer.screenY,
			);
			this.state.resizeHeading = "right";
			this.state.resizeLastPlacement = {
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
				pixelX: element.x * context.gridSize[0],
				pixelY: element.y * context.gridSize[1],
				pixelWidth: element.width * context.gridSize[0],
				pixelHeight: element.height * context.gridSize[1],
			};
			const ops: CanvasOperation[] = [
				createResizeAttrsOperation(element.id, "start", "none"),
			];
			if (nextSelection !== selected) {
				ops.push({ type: "selection.set", ids: nextSelection });
			}
			return ops;
		}

		if (context.event.button !== 0) {
			this.resetSession();
			return null;
		}

		this.state.mode = "drag";
		if (nextSelection === selected) return null;
		return { type: "selection.set", ids: nextSelection };
	}

	protected override onPointerMove(
		context: FrameContext,
	): CanvasOperation | CanvasOperation[] | null {
		if (
			!this.selection.clicking ||
			context.event.pointerId !== this.selection.pointerId
		) {
			return null;
		}
		const baseline = this.state.baselineElement;
		if (!baseline) return null;

		if (this.state.mode === "drag") {
			const deltaPixelX = context.pointer.screenX - this.selection.startScreenX;
			const deltaPixelY = context.pointer.screenY - this.selection.startScreenY;
			const distance = Math.hypot(deltaPixelX, deltaPixelY);
			if (distance >= DRAG_THRESHOLD_PX) {
				this.selection.dragging = true;
			}
			if (!this.selection.dragging) return null;

			const [cellWidth, cellHeight] = context.gridSize;
			const preview = cloneElementWithGeometry(baseline, {
				x: Math.round((baseline.x * cellWidth + deltaPixelX) / cellWidth),
				y: Math.round((baseline.y * cellHeight + deltaPixelY) / cellHeight),
			});

			return {
				type: "element.previewBulk",
				elements: [preview],
			};
		}

		if (this.state.mode === "resize") {
			const [cellWidth, cellHeight] = context.gridSize;
			const safeZoom = Math.max(context.viewport.zoomLevel, 0.001);
			const deltaX =
				(context.pointer.screenX - this.selection.startScreenX) / safeZoom;
			const deltaY =
				(context.pointer.screenY - this.selection.startScreenY) / safeZoom;
			const distance = Math.hypot(deltaX, deltaY);
			if (!this.selection.dragging && distance < RESIZE_THRESHOLD_PX) {
				return null;
			}
			if (!this.selection.dragging) {
				this.selection.dragging = true;
				this.state.resizeHeading = getResizeHeading(deltaX, deltaY);
			}

			const anchor = this.state.resizeAnchor;
			const startPixelX = baseline.x * cellWidth;
			const startPixelY = baseline.y * cellHeight;
			const startPixelWidth = baseline.width * cellWidth;
			const startPixelHeight = baseline.height * cellHeight;
			const startRight = startPixelX + startPixelWidth;
			const startBottom = startPixelY + startPixelHeight;

			const candidatePixelWidth =
				anchor.horizontal === "left"
					? startPixelWidth - deltaX
					: startPixelWidth + deltaX;
			const candidatePixelHeight =
				anchor.vertical === "top"
					? startPixelHeight - deltaY
					: startPixelHeight + deltaY;

			const minPixelWidth = RESIZE_MIN_CELL_WIDTH * cellWidth;
			const minPixelHeight = RESIZE_MIN_CELL_HEIGHT * cellHeight;
			const clampedPixelWidth = Math.max(minPixelWidth, candidatePixelWidth);
			const clampedPixelHeight = Math.max(minPixelHeight, candidatePixelHeight);
			const clampedPixelX =
				anchor.horizontal === "left"
					? startRight - clampedPixelWidth
					: startPixelX;
			const clampedPixelY =
				anchor.vertical === "top"
					? startBottom - clampedPixelHeight
					: startPixelY;

			const snappedPixelWidth = snapToMultiple(clampedPixelWidth, cellWidth);
			const snappedPixelHeight = snapToMultiple(clampedPixelHeight, cellHeight);
			const snappedWidth = clampMinDimension(
				snappedPixelWidth / cellWidth,
				RESIZE_MIN_CELL_WIDTH,
			);
			const snappedHeight = clampMinDimension(
				snappedPixelHeight / cellHeight,
				RESIZE_MIN_CELL_HEIGHT,
			);
			const snappedX =
				anchor.horizontal === "left"
					? (startRight - snappedWidth * cellWidth) / cellWidth
					: clampedPixelX / cellWidth;
			const snappedY =
				anchor.vertical === "top"
					? (startBottom - snappedHeight * cellHeight) / cellHeight
					: clampedPixelY / cellHeight;

			const occupyingIds = context.ports.query.findOccupyingIds(
				snappedX,
				snappedY,
				snappedWidth,
				snappedHeight,
				baseline.id,
			);

			let resolved = {
				x: snappedX,
				y: snappedY,
				width: snappedWidth,
				height: snappedHeight,
			};

			if (occupyingIds.length > 0) {
				const fixedRight = snappedX + snappedWidth;
				const fixedBottom = snappedY + snappedHeight;
				const fallbackPlacement =
					this.state.resizeLastPlacement ?? {
						x: baseline.x,
						y: baseline.y,
						width: baseline.width,
						height: baseline.height,
					};
				let horizontalX = snappedX;
				let horizontalWidth = snappedWidth;
				let constrainedRight = fixedRight;
				let constrainedLeft = snappedX;

				for (const id of occupyingIds) {
					const collider = context.ports.query.getElement(id);
					if (!collider) continue;
					const overlapsY = rangesOverlap(
						snappedY,
						snappedY + snappedHeight,
						collider.y,
						collider.y + collider.height,
					);
					if (!overlapsY) continue;
					constrainedRight = Math.min(constrainedRight, collider.x);
					constrainedLeft = Math.max(
						constrainedLeft,
						collider.x + collider.width,
					);
				}

				if (anchor.horizontal === "right") {
					const maxRightWidth = constrainedRight - snappedX;
					if (
						Number.isFinite(maxRightWidth) &&
						maxRightWidth >= RESIZE_MIN_CELL_WIDTH
					) {
						horizontalWidth = clampMinDimension(
							maxRightWidth,
							RESIZE_MIN_CELL_WIDTH,
						);
					} else {
						horizontalX = fallbackPlacement.x;
						horizontalWidth = fallbackPlacement.width;
					}
				} else {
					const maxAllowedLeft = fixedRight - RESIZE_MIN_CELL_WIDTH;
					if (
						Number.isFinite(constrainedLeft) &&
						constrainedLeft <= maxAllowedLeft
					) {
						const cappedLeft = Math.min(constrainedLeft, maxAllowedLeft);
						horizontalX = cappedLeft;
						horizontalWidth = clampMinDimension(
							fixedRight - cappedLeft,
							RESIZE_MIN_CELL_WIDTH,
						);
					} else {
						horizontalX = fallbackPlacement.x;
						horizontalWidth = fallbackPlacement.width;
					}
				}

				let verticalY = snappedY;
				let verticalHeight = snappedHeight;
				let constrainedBottom = fixedBottom;
				let constrainedTop = snappedY;

				for (const id of occupyingIds) {
					const collider = context.ports.query.getElement(id);
					if (!collider) continue;
					const overlapsX = rangesOverlap(
						horizontalX,
						horizontalX + horizontalWidth,
						collider.x,
						collider.x + collider.width,
					);
					if (!overlapsX) continue;
					constrainedBottom = Math.min(constrainedBottom, collider.y);
					constrainedTop = Math.max(
						constrainedTop,
						collider.y + collider.height,
					);
				}

				if (anchor.vertical === "bottom") {
					const maxBottomHeight = constrainedBottom - snappedY;
					if (
						Number.isFinite(maxBottomHeight) &&
						maxBottomHeight >= RESIZE_MIN_CELL_HEIGHT
					) {
						verticalHeight = clampMinDimension(
							maxBottomHeight,
							RESIZE_MIN_CELL_HEIGHT,
						);
					} else {
						verticalY = fallbackPlacement.y;
						verticalHeight = fallbackPlacement.height;
					}
				} else {
					const maxAllowedTop = fixedBottom - RESIZE_MIN_CELL_HEIGHT;
					if (
						Number.isFinite(constrainedTop) &&
						constrainedTop <= maxAllowedTop
					) {
						const cappedTop = Math.min(constrainedTop, maxAllowedTop);
						verticalY = cappedTop;
						verticalHeight = clampMinDimension(
							fixedBottom - cappedTop,
							RESIZE_MIN_CELL_HEIGHT,
						);
					} else {
						verticalY = fallbackPlacement.y;
						verticalHeight = fallbackPlacement.height;
					}
				}

				resolved.x = horizontalX;
				resolved.width = horizontalWidth;
				resolved.y = verticalY;
				resolved.height = verticalHeight;
			}

			if (
				!Number.isFinite(resolved.x) ||
				!Number.isFinite(resolved.width) ||
				resolved.width < RESIZE_MIN_CELL_WIDTH
			) {
				const fallbackPlacement =
					this.state.resizeLastPlacement ?? {
						x: baseline.x,
						y: baseline.y,
						width: baseline.width,
						height: baseline.height,
					};
				resolved.x = fallbackPlacement.x;
				resolved.width = fallbackPlacement.width;
			}

			if (
				!Number.isFinite(resolved.y) ||
				!Number.isFinite(resolved.height) ||
				resolved.height < RESIZE_MIN_CELL_HEIGHT
			) {
				const fallbackPlacement =
					this.state.resizeLastPlacement ?? {
						x: baseline.x,
						y: baseline.y,
						width: baseline.width,
						height: baseline.height,
					};
				resolved.y = fallbackPlacement.y;
				resolved.height = fallbackPlacement.height;
			}

			const preview = cloneElementWithGeometry(baseline, {
				x: resolved.x,
				y: resolved.y,
				width: resolved.width,
				height: resolved.height,
			});
			this.state.resizeLastPlacement = {
				x: resolved.x,
				y: resolved.y,
				width: resolved.width,
				height: resolved.height,
				pixelX: resolved.x * cellWidth,
				pixelY: resolved.y * cellHeight,
				pixelWidth: resolved.width * cellWidth,
				pixelHeight: resolved.height * cellHeight,
			};
			return [
				createResizeAttrsOperation(
					baseline.id,
					"active",
					this.state.resizeHeading,
				),
				{
				type: "element.previewBulk",
				elements: [preview],
				},
			];
		}

		return null;
	}

	protected override onPointerUp(
		context: FrameContext,
	): CanvasOperation | CanvasOperation[] | null {
		if (
			!this.selection.clicking ||
			context.event.pointerId !== this.selection.pointerId
		) {
			return null;
		}
		const baseline = this.state.baselineElement;
		const mode = this.state.mode;
		const didMove = this.selection.dragging;
		const activeElementId = this.state.activeElementId;

		this.selection.clicking = false;
		this.selection.pointerId = -1;
		this.selection.dragging = false;
		this.state.activeElementId = null;
		this.state.mode = null;

		if (!baseline || !didMove) {
			this.state.baselineElement = null;
			if (!activeElementId) return null;
			return createResizeAttrsOperation(activeElementId, "none", "none");
		}

		if (mode === "drag") {
			const [cellWidth, cellHeight] = context.gridSize;
			const deltaPixelX = context.pointer.screenX - this.selection.startScreenX;
			const deltaPixelY = context.pointer.screenY - this.selection.startScreenY;
			const result = resolveMovementCommit({
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
			this.state.baselineElement = null;
			return {
				type: "element.commitBulk",
				elements: [
					cloneElementWithGeometry(baseline, {
						x: result.resolvedGridX,
						y: result.resolvedGridY,
					}),
				],
			};
		}

		if (mode === "resize" && this.state.resizeLastPlacement) {
			const p = this.state.resizeLastPlacement;
			this.state.baselineElement = null;
			const ops: CanvasOperation[] = [
				{
					type: "element.commitBulk",
					elements: [
						cloneElementWithGeometry(baseline, {
							x: p.x,
							y: p.y,
							width: p.width,
							height: p.height,
						}),
					],
				},
			];
			if (activeElementId) {
				ops.push(createResizeAttrsOperation(activeElementId, "stop", "none"));
			}
			return ops;
		}

		this.state.baselineElement = null;
		if (!activeElementId) return null;
		return createResizeAttrsOperation(activeElementId, "none", "none");
	}

	protected override onPointerCancel(): CanvasOperation | CanvasOperation[] | null {
		if (!this.selection.clicking) return null;
		const baseline = this.state.baselineElement;
		const activeElementId = this.state.activeElementId;
		this.resetSession();
		if (!baseline) {
			return activeElementId
				? createResizeAttrsOperation(activeElementId, "none", "none")
				: null;
		}
		const ops: CanvasOperation[] = [
			{
				type: "element.rollbackSession",
				elements: [baseline],
			},
		];
		if (activeElementId) {
			ops.push(createResizeAttrsOperation(activeElementId, "none", "none"));
		}
		return ops;
	}

	protected override onBlur(): CanvasOperation | CanvasOperation[] | null {
		return this.onPointerCancel();
	}

	private resetSession() {
		this.selection.clicking = false;
		this.selection.dragging = false;
		this.selection.pointerId = -1;
		this.state.activeElementId = null;
		this.state.baselineElement = null;
		this.state.mode = null;
		this.state.resizeLastPlacement = null;
	}
}
