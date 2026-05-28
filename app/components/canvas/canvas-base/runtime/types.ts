import type { AnyCanvasElementDisplay, CanvasElementVariant } from "@/types";
import type { ExcludeIds } from "@/lib/movement-commit";

export type CanvasEventInputKind =
	| "pointerDown"
	| "pointerMove"
	| "pointerUp"
	| "pointerCancel"
	| "wheel"
	| "keyDown"
	| "keyUp"
	| "blur";

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

export type RuntimeTargetInfo = {
	elementId: string | null;
	variant: CanvasElementVariant | null;
	insideCanvas: boolean;
};

export type RuntimeReadState = {
	gridSize: [number, number];
	zoomLevel: number;
	offsetX: number;
	offsetY: number;
	isPanning: boolean;
	selectedNoteIds: string[];
	elements: Record<string, AnyCanvasElementDisplay>;
	elementIds: string[];
};

export type RuntimePorts = {
	read: {
		getState: () => RuntimeReadState;
		subscribeViewport: (listener: () => void) => () => void;
	};
	write: {
		setSelectedNoteIds: (ids: string[]) => void;
		clearSelectedNoteIds: () => void;
		updateElementsBulk: (elements: AnyCanvasElementDisplay[]) => void;
		setViewportOffset: (offsetX: number, offsetY: number) => void;
		setViewportTransform: (zoomLevel: number, offsetX: number, offsetY: number) => void;
		startPan: () => void;
		endPan: (commit: boolean) => void;
	};
	query: {
		getElement: (id: string) => AnyCanvasElementDisplay | undefined;
		findOccupyingIds: (
			x: number,
			y: number,
			width: number,
			height: number,
			excludeIds?: ExcludeIds,
		) => string[];
		isAreaFree: (
			x: number,
			y: number,
			width: number,
			height: number,
			excludeIds?: ExcludeIds,
		) => boolean;
		findNearestFree: (
			x: number,
			y: number,
			width: number,
			height: number,
			excludeIds?: ExcludeIds,
			maxRadius?: number,
		) => { x: number; y: number } | null;
	};
};

export type FrameContext<T = InputEventContext> = {
	gridSize: [number, number];
	container: HTMLDivElement;
	transform: HTMLDivElement | null;
	viewport: {
		zoomLevel: number;
		offsetX: number;
		offsetY: number;
	};
	ports: RuntimePorts;
} & T;

export type InputEventContext = {
	event: RuntimeInputEvent;
	target: RuntimeTargetInfo;
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
	| { type: "selection.set"; ids: string[] }
	| { type: "selection.clear" }
	| { type: "selection.toggle"; id: string }
	| { type: "element.previewBulk"; elements: AnyCanvasElementDisplay[] }
	| { type: "element.commitBulk"; elements: AnyCanvasElementDisplay[] }
	| { type: "element.rollbackSession"; elements: AnyCanvasElementDisplay[] }
	| { type: "viewport.setOffset"; offsetX: number; offsetY: number }
	| {
			type: "viewport.setTransform";
			zoomLevel: number;
			offsetX: number;
			offsetY: number;
	  }
	| { type: "viewport.beginPan" }
	| { type: "viewport.endPan"; commit: boolean }
	| { type: "interaction.setLockout"; value: boolean }
	| { type: "interaction.setSpaceHeld"; value: boolean }
	| { type: "interaction.setPanning"; value: boolean }
	| {
			type: "ui.setMarqueeRect";
			rect: { x: number; y: number; width: number; height: number } | null;
	  }
	| {
			type: "ui.setCssVar";
			name: string;
			value: string;
	  }
	| {
			type: "ui.applyBackground";
			zoomLevel: number;
			offsetX: number;
			offsetY: number;
	  }
	| {
			type: "ui.setResizeAttrs";
			elementId: string;
			state: string;
			heading: "none" | "left" | "right" | "top" | "bottom";
	  };

export type OperationResult = CanvasOperation | CanvasOperation[] | null;

export type CanvasCallback = (
	context: FrameContext<InputEventContext>,
) => OperationResult;

export type RuntimeExecutionTrace = {
	eventKind: CanvasEventInputKind;
	operations: CanvasOperation[];
};
