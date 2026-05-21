import type { AnyCanvasElementDisplay } from "@/types";

export type CanvasEventInputKind =
	| "pointerDown"
	| "pointerMove"
	| "pointerUp"
	| "pointerCancel"
	| "wheel"
	| "keyDown"
	| "keyUp"
	| "blur";

export type RuntimeEventKind = "mount";

export type RuntimeRenderCallbackKind = "render";

export type RuntimeInputEventBase<T extends CanvasEventInputKind> = {
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
	kind: T;
};

export type RuntimeInputEvent = RuntimeInputEventBase<CanvasEventInputKind> & {
	kind: CanvasEventInputKind;
};

export type RuntimeSnapshot = {
	marqueeRect: { x: number; y: number; width: number; height: number } | null;
	isPanning: boolean;
	spaceHeld: boolean;
	lockout: boolean;
};

export type FrameContext<T> = {
	gridSize: [number, number];
	container: HTMLDivElement;
	transform: HTMLDivElement | null;
	viewport: {
		zoomLevel: number;
		offsetX: number;
		offsetY: number;
	};
} & T;

export type InputEventContext = {
	event: RuntimeInputEvent;
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

// Canvas operations are the way a plugin can cause changes to the canvas state. They are returned from plugin callbacks and then executed by the runtime.
// A plugin has free access to its own internal state, and can read the canvas state from FrameContext
// TODO: Very much improve to a more typical operation pattern, with more specific operation types and payloads, and better typing. Need to do a light reading on ASTs (Abstract Syntax Trees) and how to design an operation system that is easy to use and extend, but also very type safe and specific.
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

//   updateElement
//   updateElements
//   viewportDelta
//   setSelected
export type CanvasCallback = (
	context: FrameContext<InputEventContext>,
) => CanvasOperation | CanvasOperation[] | null | undefined;

export type CanvasRenderCallback = (context: FrameContext<null>) => void;
