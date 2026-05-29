import type { AnyCanvasElementDisplay } from "@/types";

export type ResizeAnchor = {
	horizontal: "left" | "right";
	vertical: "top" | "bottom";
};

export type ResizePlacement = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type NoteInteractionState =
	| "idle"
	| "pressed"
	| "dragging"
	| "resizing"
	| "cancelling";

export type NoteSession = {
	id: string;
	pointerId: number;
	elementId: string;
	state: NoteInteractionState;
	baseline: AnyCanvasElementDisplay;
	startScreenX: number;
	startScreenY: number;
	resizeAnchor: ResizeAnchor;
	resizeHeading: "left" | "right" | "top" | "bottom";
	resizeLastPlacement: ResizePlacement | null;
	resizeMoved: boolean;
};

export type NotePluginState = {
	session: NoteSession | null;
};
