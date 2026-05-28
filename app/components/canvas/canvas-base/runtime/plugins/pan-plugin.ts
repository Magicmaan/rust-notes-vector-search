import {
	VIEWPORT_CSS_VAR_OFFSET_X,
	VIEWPORT_CSS_VAR_OFFSET_Y,
} from "../../constants/viewport-css-vars";
import type { CanvasOperation, FrameContext } from "../types";
import { PluginBase } from "./types";

type PanPluginState = {};

function isInsideCanvas(target: EventTarget | null, container: HTMLDivElement) {
	return Boolean(target && container.contains(target as Node));
}

export class PanPlugin extends PluginBase<PanPluginState> {
	name = "Pan Plugin";
	description = "Handles space+drag canvas panning.";
	version = "0.1.0";

	state: PanPluginState = {};
	private originX = 0;
	private originY = 0;

	private endPan(context: FrameContext, commit: boolean): CanvasOperation[] {
		if (!this.selection.clicking) return [];

		const deltaX = context.pointer.screenX - this.selection.startScreenX;
		const deltaY = context.pointer.screenY - this.selection.startScreenY;
		this.setSelectionState({
			clicking: false,
			dragging: false,
			pointerId: undefined,
		});

		if (!commit) {
			return [
				{ type: "interaction.setPanning", value: false },
				{ type: "viewport.endPan", commit: false },
				{
					type: "ui.setCssVar",
					name: VIEWPORT_CSS_VAR_OFFSET_X,
					value: `${this.originX}px`,
				},
				{
					type: "ui.setCssVar",
					name: VIEWPORT_CSS_VAR_OFFSET_Y,
					value: `${this.originY}px`,
				},
				{
					type: "ui.applyBackground",
					zoomLevel: context.viewport.zoomLevel,
					offsetX: this.originX,
					offsetY: this.originY,
				},
			];
		}

		const committedOffsetX = this.originX + deltaX;
		const committedOffsetY = this.originY + deltaY;
		return [
			{ type: "interaction.setPanning", value: false },
			{ type: "viewport.endPan", commit: true },
			{
				type: "viewport.setOffset",
				offsetX: committedOffsetX,
				offsetY: committedOffsetY,
			},
			{
				type: "ui.applyBackground",
				zoomLevel: context.viewport.zoomLevel,
				offsetX: committedOffsetX,
				offsetY: committedOffsetY,
			},
		];
	}

	protected override onKeyDown(context: FrameContext): CanvasOperation | null {
		if (context.event.code === "Space" || context.event.key === " ") {
			return {
				type: "interaction.setSpaceHeld",
				value: true,
			} as CanvasOperation;
		}
		return null;
	}

	protected override onKeyUp(context: FrameContext): CanvasOperation | null {
		if (context.event.code === "Space" || context.event.key === " ") {
			return {
				type: "interaction.setSpaceHeld",
				value: false,
			} as CanvasOperation;
		}
		return null;
	}

	protected override onPointerDown(
		context: FrameContext,
	): CanvasOperation[] | null {
		if (!context.flags.spaceHeld || context.event.button !== 0) {
			return null;
		}
		if (!isInsideCanvas(context.event.target, context.container)) {
			return null;
		}

		this.setSelectionState({
			clicking: true,
			dragging: false,
			pointerId: context.event.pointerId,
			startScreenX: context.pointer.screenX,
			startScreenY: context.pointer.screenY,
		});
		this.originX = context.viewport.offsetX;
		this.originY = context.viewport.offsetY;
		return [
			{ type: "interaction.setPanning", value: true },
			{ type: "viewport.beginPan" },
		];
	}

	protected override onPointerMove(
		context: FrameContext,
	): CanvasOperation[] | null {
		if (
			!this.selection.clicking ||
			context.event.pointerId !== this.selection.pointerId
		) {
			return null;
		}

		const deltaX = context.pointer.screenX - this.selection.startScreenX;
		const deltaY = context.pointer.screenY - this.selection.startScreenY;
		const offsetX = this.originX + deltaX;
		const offsetY = this.originY + deltaY;
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
				type: "ui.applyBackground",
				zoomLevel: context.viewport.zoomLevel,
				offsetX,
				offsetY,
			},
		];
	}

	protected override onPointerUp(context: FrameContext) {
		if (
			!this.selection.clicking ||
			context.event.pointerId !== this.selection.pointerId
		) {
			return null;
		}
		return this.endPan(context, true);
	}

	protected override onPointerCancel(context: FrameContext) {
		if (
			!this.selection.clicking ||
			context.event.pointerId !== this.selection.pointerId
		) {
			return null;
		}
		return this.endPan(context, false);
	}

	protected override onBlur(context: FrameContext) {
		if (!this.selection.clicking) {
			return null;
		}
		return this.endPan(context, false);
	}
}
