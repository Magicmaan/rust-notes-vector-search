import type { AnyCanvasElementDisplay } from "@/types";

export type ElementRuntimeEventKind =
	| "pointerDown"
	| "pointerMove"
	| "pointerUp"
	| "pointerCancel"
	| "blur"
	| "tick";

export type ElementRuntimeEvent = {
	kind: ElementRuntimeEventKind;
	pointerId: number;
	clientX: number;
	clientY: number;
	button: number;
	shiftKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
	target: EventTarget | null;
	timestamp: number;
};

export type ElementFrameContext = {
	event: ElementRuntimeEvent;
	element: AnyCanvasElementDisplay;
	grid: {
		cellWidth: number;
		cellHeight: number;
	};
	viewport: {
		zoomLevel: number;
		isPanning: boolean;
		lockout: boolean;
	};
	selection: {
		isSelected: boolean;
		isMultiSelected: boolean;
	};
};

export type ElementOperation =
	| { type: "setDataAttr"; name: string; value: string }
	| { type: "removeDataAttr"; name: string };

export interface ElementPlugin {
	name: string;
	onEvent?: (
		context: ElementFrameContext,
	) => ElementOperation | ElementOperation[] | null | undefined;
}
