const canvasHTMLEvents = {
	"canvas:pointer:down": {
		pointerId: 0,
		clientX: 0,
		clientY: 0,
		targetTag: "",
	},
	"canvas:pointer:up": MouseEvent,
	"canvas:pointer:move": {
		pointerId: 0,
		clientX: 0,
		clientY: 0,
		deltaX: 0,
		deltaY: 0,
		targetTag: "",
	},
	"canvas:blur": FocusEvent,
	"canvas:focus": FocusEvent,
};

export type AppEventSchema = {
	"canvas:viewport:resize": {
		width: number;
		height: number;
	};
	"canvas:zoom:wheel": {
		pointerX: number;
		pointerY: number;
		stepCount: number;
	};
	"canvas:pan:start": {
		pointerId: number;
		startX: number;
		startY: number;
	};
	"canvas:pan:update": {
		pointerId: number;
		deltaX: number;
		deltaY: number;
	};
	"canvas:pan:end": {
		pointerId: number;
		commit: boolean;
		deltaX: number;
		deltaY: number;
	};
	"note:drag:start": {
		noteId: string;
		pointerId: number;
		startClientX: number;
		startClientY: number;
	};
	"note:drag:update": {
		noteId: string;
		pointerId: number;
		deltaPixelX: number;
		deltaPixelY: number;
	};
	"note:drag:end": {
		noteId: string;
		pointerId: number;
		didDrag: boolean;
		commitRequested: boolean;
		commitApplied: boolean;
	};
	"note:resize:start": {
		noteId: string;
		pointerId: number;
		anchor: {
			horizontal: "left" | "right";
			vertical: "top" | "bottom";
		};
	};
	"note:resize:update": {
		noteId: string;
		pointerId: number;
		deltaPixelWidth: number;
		deltaPixelHeight: number;
	};
	"note:resize:end": {
		noteId: string;
		pointerId: number;
		didResize: boolean;
		commitRequested: boolean;
		commitApplied: boolean;
	};
};

export type AppEventName = keyof AppEventSchema;
export type AppEventPayload<T extends AppEventName> = AppEventSchema[T];

export interface EventBus {
	emit: <TEvent extends AppEventName>(
		name: TEvent,
		payload: AppEventPayload<TEvent>,
	) => void;
	subscribe: <TEvent extends AppEventName>(
		name: TEvent,
		handler: (payload: AppEventPayload<TEvent>) => void,
	) => () => void;
}
