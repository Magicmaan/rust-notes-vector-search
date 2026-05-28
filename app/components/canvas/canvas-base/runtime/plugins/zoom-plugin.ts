import {
	MAX_ZOOM,
	MIN_ZOOM,
	ZOOM_STEP,
} from "@/providers/editor/slices/viewportSlice";
import {
	VIEWPORT_CSS_VAR_OFFSET_X,
	VIEWPORT_CSS_VAR_OFFSET_Y,
	VIEWPORT_CSS_VAR_ZOOM,
} from "../../constants/viewport-css-vars";
import type { CanvasOperation, FrameContext } from "../types";
import { PluginBase } from "./types";

type ZoomPluginState = {};

function clampZoom(zoom: number) {
	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function applyZoomSteps(startZoom: number, stepCount: number): number {
	if (!Number.isFinite(startZoom) || stepCount === 0) {
		return startZoom;
	}
	return clampZoom(startZoom * (1 + ZOOM_STEP) ** stepCount);
}

export class ZoomPlugin extends PluginBase<ZoomPluginState> {
	name = "Zoom Plugin";
	description = "Handles wheel-based canvas zoom interactions.";
	version = "0.1.0";

	state: ZoomPluginState = {};

	protected override onWheel(
		context: FrameContext,
	): CanvasOperation[] | null {
		if (context.flags.isPanning) {
			return null;
		}

		const deltaY = context.event.deltaY;
		if (deltaY === 0) {
			return null;
		}

		const stepCount = deltaY < 0 ? 1 : -1;
		const targetZoom = applyZoomSteps(context.viewport.zoomLevel, stepCount);
		if (targetZoom === context.viewport.zoomLevel) {
			return null;
		}

		const worldX = context.pointer.worldX;
		const worldY = context.pointer.worldY;
		const offsetX =
			context.viewport.offsetX +
			worldX * (context.viewport.zoomLevel - targetZoom);
		const offsetY =
			context.viewport.offsetY +
			worldY * (context.viewport.zoomLevel - targetZoom);

		return [
			{
				type: "ui.setCssVar",
				name: VIEWPORT_CSS_VAR_OFFSET_X,
				value: `${offsetX}px`,
			},
			{
				type: "ui.setCssVar",
				name: VIEWPORT_CSS_VAR_OFFSET_Y,
				value: `${offsetY}px`,
			},
			{
				type: "ui.setCssVar",
				name: VIEWPORT_CSS_VAR_ZOOM,
				value: String(targetZoom),
			},
			{
				type: "viewport.setTransform",
				zoomLevel: targetZoom,
				offsetX,
				offsetY,
			},
			{
				type: "ui.applyBackground",
				zoomLevel: targetZoom,
				offsetX,
				offsetY,
			},
		];
	}
}
