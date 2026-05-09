import {
	VIEWPORT_CSS_VAR_OFFSET_X,
	VIEWPORT_CSS_VAR_OFFSET_Y,
} from "../../constants/viewport-css-vars";
import type { CanvasCallback, CanvasOperation, FrameContext } from "../types";

type PanSession = {
	active: boolean;
	pointerId: number;
	startX: number;
	startY: number;
	originX: number;
	originY: number;
};

type PanCallbacks = {
	onPanKeyDown: CanvasCallback;
	onPanKeyUp: CanvasCallback;
	onPanPointerDown: CanvasCallback;
	onPanPointerMove: CanvasCallback;
	onPanPointerUp: CanvasCallback;
	onPanPointerCancel: CanvasCallback;
	onPanBlur: CanvasCallback;
};

function isInsideCanvas(target: EventTarget | null, container: HTMLDivElement) {
	return Boolean(target && container.contains(target as Node));
}

export function createPanCallbacks(): PanCallbacks {
	const session: PanSession = {
		active: false,
		pointerId: -1,
		startX: 0,
		startY: 0,
		originX: 0,
		originY: 0,
	};

	const endPan = (context: FrameContext, commit: boolean): CanvasOperation[] => {
		if (!session.active) return [];
		const deltaX = context.pointer.screenX - session.startX;
		const deltaY = context.pointer.screenY - session.startY;
		session.active = false;
		session.pointerId = -1;
		if (!commit) {
			return [
				{ type: "setFlag", key: "isPanning", value: false },
				{ type: "setPanState", value: false },
				{
					type: "setCssVar",
					name: VIEWPORT_CSS_VAR_OFFSET_X,
					value: `${session.originX}px`,
				},
				{
					type: "setCssVar",
					name: VIEWPORT_CSS_VAR_OFFSET_Y,
					value: `${session.originY}px`,
				},
				{
					type: "applyBackground",
					zoomLevel: context.viewport.zoomLevel,
					offsetX: session.originX,
					offsetY: session.originY,
				},
			];
		}
		const committedOffsetX = session.originX + deltaX;
		const committedOffsetY = session.originY + deltaY;
		return [
			{ type: "setFlag", key: "isPanning", value: false },
			{ type: "setPanState", value: false },
			{
				type: "setViewportOffset",
				offsetX: committedOffsetX,
				offsetY: committedOffsetY,
			},
			{
				type: "applyBackground",
				zoomLevel: context.viewport.zoomLevel,
				offsetX: committedOffsetX,
				offsetY: committedOffsetY,
			},
		];
	};

	const onPanKeyDown: CanvasCallback = (context) => {
		if (context.event.code === "Space" || context.event.key === " ") {
			return { type: "setFlag", key: "spaceHeld", value: true };
		}
		return null;
	};

	const onPanKeyUp: CanvasCallback = (context) => {
		if (context.event.code === "Space" || context.event.key === " ") {
			return { type: "setFlag", key: "spaceHeld", value: false };
		}
		return null;
	};

	const onPanPointerDown: CanvasCallback = (context) => {
		if (!context.flags.spaceHeld || context.event.button !== 0) {
			return null;
		}
		if (!isInsideCanvas(context.event.target, context.container)) {
			return null;
		}
		session.active = true;
		session.pointerId = context.event.pointerId;
		session.startX = context.pointer.screenX;
		session.startY = context.pointer.screenY;
		session.originX = context.viewport.offsetX;
		session.originY = context.viewport.offsetY;
		return [
			{ type: "setFlag", key: "isPanning", value: true },
			{ type: "setPanState", value: true },
		];
	};

	const onPanPointerMove: CanvasCallback = (context) => {
		if (!session.active || context.event.pointerId !== session.pointerId) {
			return null;
		}
		const deltaX = context.pointer.screenX - session.startX;
		const deltaY = context.pointer.screenY - session.startY;
		const offsetX = session.originX + deltaX;
		const offsetY = session.originY + deltaY;
		const ops: CanvasOperation[] = [
			{
				type: "setCssVar",
				name: VIEWPORT_CSS_VAR_OFFSET_X,
				value: `${offsetX}px`,
			},
			{
				type: "setCssVar",
				name: VIEWPORT_CSS_VAR_OFFSET_Y,
				value: `${offsetY}px`,
			},
			{
				type: "applyBackground",
				zoomLevel: context.viewport.zoomLevel,
				offsetX,
				offsetY,
			},
		];
		return ops;
	};

	const onPanPointerUp: CanvasCallback = (context) => {
		if (!session.active || context.event.pointerId !== session.pointerId) {
			return null;
		}
		return endPan(context, true);
	};

	const onPanPointerCancel: CanvasCallback = (context) => {
		if (!session.active || context.event.pointerId !== session.pointerId) {
			return null;
		}
		return endPan(context, false);
	};

	const onPanBlur: CanvasCallback = (context) => {
		if (!session.active) {
			return null;
		}
		return endPan(context, false);
	};

	return {
		onPanKeyDown,
		onPanKeyUp,
		onPanPointerDown,
		onPanPointerMove,
		onPanPointerUp,
		onPanPointerCancel,
		onPanBlur,
	};
}
