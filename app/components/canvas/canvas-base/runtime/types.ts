import type { AnyCanvasElementDisplay } from "@/types";

export type RuntimeCallbackKind =
	| "pointerDown"
	| "pointerMove"
	| "pointerUp"
	| "pointerCancel"
	| "wheel"
	| "keyDown"
	| "keyUp"
	| "blur";

type RuntimeInputEventBase<T extends RuntimeCallbackKind> = {
	pointerId: number;
	clientX: number;
	clientY: number;
	button: number;
	target: EventTarget | null;
	shiftKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
	deltaY: number;
	code: string;
	key: string;
	timestamp: number;
};

export type RuntimeInputEvent = RuntimeInputEventBase<RuntimeCallbackKind> & {
	kind: RuntimeCallbackKind;
};

export type RuntimeSnapshot = {
	marqueeRect: { x: number; y: number; width: number; height: number } | null;
	isPanning: boolean;
	spaceHeld: boolean;
	lockout: boolean;
};

export type FrameContext = {
	event: RuntimeInputEvent;
	gridSize: [number, number];
	container: HTMLDivElement;
	transform: HTMLDivElement | null;
	viewport: {
		zoomLevel: number;
		offsetX: number;
		offsetY: number;
	};
	pointer: {
		screenX: number;
		screenY: number;
		worldX: number;
		worldY: number;
	};
	flags: {
		spaceHeld: boolean;
		isPanning: boolean;
	};
	marqueeRect: { x: number; y: number; width: number; height: number } | null;
};

export type CanvasOperation =
	| { type: "setFlag"; key: "spaceHeld"; value: boolean }
	| { type: "setFlag"; key: "isPanning"; value: boolean }
	| { type: "setPanState"; value: boolean }
	| { type: "setCssVar"; name: string; value: string }
	| {
			type: "setViewportTransform";
			zoomLevel: number;
			offsetX: number;
			offsetY: number;
	  }
	| {
			type: "setViewportOffset";
			offsetX: number;
			offsetY: number;
	  }
	| {
			type: "setMarqueeRect";
			rect: { x: number; y: number; width: number; height: number } | null;
	  }
	| {
			type: "setSelection";
			ids: string[];
	  }
	| {
			type: "clearSelection";
	  }
	| {
			type: "updateElementsBulk";
			elements: AnyCanvasElementDisplay[];
	  }
	| {
			type: "applyBackground";
			zoomLevel: number;
			offsetX: number;
			offsetY: number;
	  };

export type CanvasCallback = (
	context: FrameContext,
) => CanvasOperation | CanvasOperation[] | null | undefined;
