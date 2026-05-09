import { useEditorGridStore } from "@/providers/editor/store";
import { applyCanvasBackgroundCssVariables } from "../../elements/background/grid-background";
import {
	VIEWPORT_CSS_VAR_OFFSET_X,
	VIEWPORT_CSS_VAR_OFFSET_Y,
	VIEWPORT_CSS_VAR_ZOOM,
} from "../constants/viewport-css-vars";
import { worldPointFromClient } from "../util/viewport-transform";
import type {
	CanvasCallback,
	CanvasOperation,
	FrameContext,
	RuntimeCallbackKind,
	RuntimeInputEvent,
	RuntimeSnapshot,
} from "./types";

type RuntimeState = {
	spaceHeld: boolean;
	isPanning: boolean;
	lockout: boolean;
	marqueeRect: { x: number; y: number; width: number; height: number } | null;
};

type RuntimeListener = () => void;

export class CanvasRuntime {
	private container: HTMLDivElement | null = null;
	private transform: HTMLDivElement | null = null;
	private state: RuntimeState = {
		spaceHeld: false,
		isPanning: false,
		lockout: false,
		marqueeRect: null,
	};
	private callbacks: Record<RuntimeCallbackKind, Set<CanvasCallback>> = {
		pointerDown: new Set(),
		pointerMove: new Set(),
		pointerUp: new Set(),
		pointerCancel: new Set(),
		wheel: new Set(),
		keyDown: new Set(),
		keyUp: new Set(),
		blur: new Set(),
	};
	private listeners = new Set<RuntimeListener>();
	private gridSize: [number, number] = [16, 16];
	private snapshot: RuntimeSnapshot = {
		marqueeRect: null,
		isPanning: false,
		spaceHeld: false,
		lockout: false,
	};

	mount(input: {
		container: HTMLDivElement;
		transform: HTMLDivElement;
		gridSize: [number, number];
	}) {
		this.container = input.container;
		this.transform = input.transform;
		this.gridSize = input.gridSize;
		const store = useEditorGridStore.getState();
			this.syncViewportCss({
				offsetX: store.offsetX,
				offsetY: store.offsetY,
				zoomLevel: store.zoomLevel,
			});
			this.applyBackgroundFromStore();
			this.syncLockout(false);
		}

	unmount() {
		this.syncLockout(false);
		this.container = null;
		this.transform = null;
	}

	updateGridSize(gridSize: [number, number]) {
		this.gridSize = gridSize;
		this.applyBackgroundFromStore();
	}

	getSnapshot() {
		return this.snapshot;
	}

	subscribe(listener: RuntimeListener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	registerCallback(kind: RuntimeCallbackKind, handler: CanvasCallback) {
		this.callbacks[kind].add(handler);
		return () => {
			this.callbacks[kind].delete(handler);
		};
	}

	dispatch(event: RuntimeInputEvent) {
		const context = this.buildFrameContext(event);
		if (!context) {
			return;
		}
		const operations = this.collectOperations(event.kind, context);
		this.commitOperations(operations);
	}

	private collectOperations(kind: RuntimeCallbackKind, context: FrameContext) {
		const ops: CanvasOperation[] = [];
		for (const callback of this.callbacks[kind]) {
			try {
				const result = callback(context);
				if (Array.isArray(result)) {
					ops.push(...result);
				} else if (result) {
					ops.push(result);
				}
			} catch (error) {
				console.error("[CanvasRuntime] callback failed", kind, error);
			}
		}
		return ops;
	}

	private buildFrameContext(event: RuntimeInputEvent): FrameContext | null {
		if (!this.container) {
			return null;
		}
		const store = useEditorGridStore.getState();
		const screenX = event.clientX;
		const screenY = event.clientY;
		const world = worldPointFromClient(screenX, screenY, this.container, {
			offsetX: store.offsetX,
			offsetY: store.offsetY,
			zoomLevel: store.zoomLevel,
		});
		return {
			event,
			gridSize: this.gridSize,
			container: this.container,
			transform: this.transform,
			viewport: {
				zoomLevel: store.zoomLevel,
				offsetX: store.offsetX,
				offsetY: store.offsetY,
			},
			pointer: {
				screenX,
				screenY,
				worldX: world.x,
				worldY: world.y,
			},
			flags: {
				spaceHeld: this.state.spaceHeld,
				isPanning: this.state.isPanning,
			},
			marqueeRect: this.state.marqueeRect,
		};
	}

	private commitOperations(operations: CanvasOperation[]) {
		const sorted = [...operations].sort((a, b) => {
			return this.operationOrder(a.type) - this.operationOrder(b.type);
		});

		for (const operation of sorted) {
			switch (operation.type) {
					case "setFlag":
						if (operation.key === "spaceHeld") {
							this.state.spaceHeld = operation.value;
							this.state.lockout = operation.value;
							this.syncLockout(this.state.lockout);
						}
						if (operation.key === "isPanning") {
							this.state.isPanning = operation.value;
						}
						break;
				case "setPanState": {
					const store = useEditorGridStore.getState();
					if (operation.value) {
						store.startPan();
					} else {
						store.endPan(false);
					}
					this.state.isPanning = operation.value;
					break;
				}
				case "setCssVar":
					if (this.transform) {
						this.transform.style.setProperty(operation.name, operation.value);
					}
					break;
				case "setViewportTransform": {
					const store = useEditorGridStore.getState();
					store.setViewportTransform({
						zoomLevel: operation.zoomLevel,
						offsetX: operation.offsetX,
						offsetY: operation.offsetY,
					});
					this.syncViewportCss(operation);
					break;
				}
				case "setViewportOffset": {
					const store = useEditorGridStore.getState();
					store.setViewportOffset({
						x: operation.offsetX,
						y: operation.offsetY,
					});
					this.syncViewportCss({
						zoomLevel: store.zoomLevel,
						offsetX: operation.offsetX,
						offsetY: operation.offsetY,
					});
					break;
				}
				case "setMarqueeRect":
					this.state.marqueeRect = operation.rect;
					break;
				case "setSelection": {
					const store = useEditorGridStore.getState();
					store.setSelectedNoteIds(operation.ids);
					break;
				}
				case "clearSelection": {
					const store = useEditorGridStore.getState();
					store.clearSelectedNoteIds();
					this.state.marqueeRect = null;
					break;
				}
				case "updateElementsBulk": {
					const store = useEditorGridStore.getState();
					store.updateElementsBulk(operation.elements);
					break;
				}
				case "applyBackground":
					if (this.container) {
						applyCanvasBackgroundCssVariables(
							this.container,
							{
								zoomLevel: operation.zoomLevel,
								offsetX: operation.offsetX,
								offsetY: operation.offsetY,
							},
							this.gridSize,
						);
					}
					break;
			}
		}

		this.emitChange();
	}

	private operationOrder(type: CanvasOperation["type"]) {
		switch (type) {
			case "setFlag":
				return 1;
			case "setPanState":
				return 1;
			case "setCssVar":
				return 2;
			case "setMarqueeRect":
			case "setSelection":
			case "clearSelection":
				return 3;
			case "setViewportOffset":
			case "setViewportTransform":
			case "updateElementsBulk":
				return 4;
			case "applyBackground":
				return 5;
			default:
				return 99;
		}
	}

	private emitChange() {
			this.snapshot = {
				marqueeRect: this.state.marqueeRect,
				isPanning: this.state.isPanning,
				spaceHeld: this.state.spaceHeld,
				lockout: this.state.lockout,
			};
		for (const listener of this.listeners) {
			listener();
		}
	}

	private syncViewportCss(viewport: {
		offsetX: number;
		offsetY: number;
		zoomLevel: number;
	}) {
		if (!this.transform) return;
		this.transform.style.setProperty(
			VIEWPORT_CSS_VAR_OFFSET_X,
			`${viewport.offsetX}px`,
		);
		this.transform.style.setProperty(
			VIEWPORT_CSS_VAR_OFFSET_Y,
			`${viewport.offsetY}px`,
		);
		this.transform.style.setProperty(
			VIEWPORT_CSS_VAR_ZOOM,
			String(viewport.zoomLevel),
		);
	}

	private applyBackgroundFromStore() {
		if (!this.container) return;
		const state = useEditorGridStore.getState();
		applyCanvasBackgroundCssVariables(
			this.container,
			{
				zoomLevel: state.zoomLevel,
				offsetX: state.offsetX,
				offsetY: state.offsetY,
			},
			this.gridSize,
		);
	}

	private syncLockout(lockout: boolean) {
		if (this.container) {
			this.container.setAttribute("data-canvas-lockout", String(lockout));
		}
		if (this.transform) {
			this.transform.setAttribute("data-lockout", String(lockout));
			this.transform.inert = lockout;
		}
	}
}
