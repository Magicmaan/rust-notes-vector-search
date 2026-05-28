import { applyCanvasBackgroundCssVariables } from "../../elements/background/grid-background";
import {
	VIEWPORT_CSS_VAR_OFFSET_X,
	VIEWPORT_CSS_VAR_OFFSET_Y,
	VIEWPORT_CSS_VAR_ZOOM,
} from "../constants/viewport-css-vars";
import { worldPointFromClient } from "../util/viewport-transform";
import type {
	CanvasCallback,
	CanvasEventInputKind,
	CanvasOperation,
	FrameContext,
	InputEventContext,
	RuntimeExecutionTrace,
	RuntimeInputEvent,
	RuntimePorts,
	RuntimeSnapshot,
	RuntimeTargetInfo,
} from "./types";
import { PluginHandler } from "./plugins";
import type { PluginBase } from "./plugins/types";

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
	private unsubscribeViewport: (() => void) | null = null;
	private readonly ports: RuntimePorts;
	private state: RuntimeState = {
		spaceHeld: false,
		isPanning: false,
		lockout: false,
		marqueeRect: null,
	};

	private callbacks: Record<CanvasEventInputKind, Set<CanvasCallback>> = {
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
	private pluginHandler: PluginHandler;
	private lastTrace: RuntimeExecutionTrace | null = null;

	constructor(ports: RuntimePorts, plugins: PluginBase[] = []) {
		this.ports = ports;
		this.pluginHandler = new PluginHandler(plugins);
	}

	mount(input: {
		container: HTMLDivElement;
		transform: HTMLDivElement;
		gridSize: [number, number];
	}) {
		this.container = input.container;
		this.transform = input.transform;
		this.gridSize = input.gridSize;
		const store = this.ports.read.getState();
		this.syncViewportCss({
			offsetX: store.offsetX,
			offsetY: store.offsetY,
			zoomLevel: store.zoomLevel,
		});
		this.applyBackgroundFromState();
		this.syncLockout(false);

		this.unsubscribeViewport?.();
		this.unsubscribeViewport = this.ports.read.subscribeViewport(() => {
			const next = this.ports.read.getState();
			this.syncViewportCss({
				offsetX: next.offsetX,
				offsetY: next.offsetY,
				zoomLevel: next.zoomLevel,
			});
			this.applyBackgroundFromState();
		});

		this.pluginHandler.mount(this);
	}

	unmount() {
		this.unsubscribeViewport?.();
		this.unsubscribeViewport = null;
		this.syncLockout(false);
		this.container = null;
		this.transform = null;
		this.pluginHandler.unmount();
	}

	updateGridSize(gridSize: [number, number]) {
		this.gridSize = gridSize;
		this.applyBackgroundFromState();
	}

	getSnapshot() {
		return this.snapshot;
	}

	getPorts() {
		return this.ports;
	}

	getLastTrace() {
		return this.lastTrace;
	}

	subscribe(listener: RuntimeListener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	registerCallback(kind: CanvasEventInputKind, handler: CanvasCallback) {
		this.callbacks[kind].add(handler);
		return () => {
			this.callbacks[kind].delete(handler);
		};
	}

	dispatch(event: RuntimeInputEvent) {
		const context = this.buildFrameContext(event);
		if (!context) return;
		const operations = this.runCallbacks(event.kind, context);
		this.lastTrace = { eventKind: event.kind, operations };
		this.commitOperations(operations);
	}

	private runCallbacks(
		kind: CanvasEventInputKind,
		context: FrameContext<InputEventContext>,
	): CanvasOperation[] {
		const ops: CanvasOperation[] = [];
		for (const callback of this.callbacks[kind]) {
			try {
				const result = callback(context);
				if (Array.isArray(result)) ops.push(...result);
				else if (result) ops.push(result);
			} catch (error) {
				console.error("[CanvasRuntime] callback failed", kind, error);
			}
		}
		return ops;
	}

	private buildFrameContext(
		event: RuntimeInputEvent,
	): FrameContext<InputEventContext> | null {
		if (!this.container) return null;
		const store = this.ports.read.getState();
		const screenX = event.clientX;
		const screenY = event.clientY;
		const world = worldPointFromClient(screenX, screenY, this.container, {
			offsetX: store.offsetX,
			offsetY: store.offsetY,
			zoomLevel: store.zoomLevel,
		});
		const target = this.resolveTargetInfo(event.target);
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
			ports: this.ports,
			target,
			pointer: { screenX, screenY, worldX: world.x, worldY: world.y },
			flags: { spaceHeld: this.state.spaceHeld, isPanning: this.state.isPanning },
			marqueeRect: this.state.marqueeRect,
		};
	}

	private resolveTargetInfo(target: EventTarget | null): RuntimeTargetInfo {
		if (!(target instanceof Node) || !this.container) {
			return { elementId: null, variant: null, insideCanvas: false };
		}
		const insideCanvas = this.container.contains(target);
		const source = target instanceof Element ? target : target.parentElement;
		const node = source?.closest("[data-canvas-element-id]") as HTMLElement | null;
		if (!node) {
			return { elementId: null, variant: null, insideCanvas };
		}
		const elementId = node.getAttribute("data-canvas-element-id");
		const variant =
			(node.getAttribute("data-canvas-element") as RuntimeTargetInfo["variant"]) ??
			null;
		return { elementId, variant, insideCanvas };
	}

	private commitOperations(operations: CanvasOperation[]) {
		const sorted = [...operations].sort((a, b) => this.operationOrder(a) - this.operationOrder(b));
		for (const operation of sorted) {
			switch (operation.type) {
				case "interaction.setSpaceHeld":
					this.state.spaceHeld = operation.value;
					this.state.lockout = operation.value;
					this.syncLockout(this.state.lockout);
					break;
				case "interaction.setLockout":
					this.state.lockout = operation.value;
					this.syncLockout(this.state.lockout);
					break;
				case "interaction.setPanning":
					this.state.isPanning = operation.value;
					break;
				case "viewport.beginPan":
					this.ports.write.startPan();
					this.state.isPanning = true;
					break;
				case "viewport.endPan":
					this.ports.write.endPan(operation.commit);
					this.state.isPanning = false;
					break;
				case "viewport.setTransform":
					this.ports.write.setViewportTransform(
						operation.zoomLevel,
						operation.offsetX,
						operation.offsetY,
					);
					this.syncViewportCss(operation);
					break;
				case "viewport.setOffset": {
					this.ports.write.setViewportOffset(operation.offsetX, operation.offsetY);
					const store = this.ports.read.getState();
					this.syncViewportCss({
						zoomLevel: store.zoomLevel,
						offsetX: operation.offsetX,
						offsetY: operation.offsetY,
					});
					break;
				}
				case "selection.set":
					this.ports.write.setSelectedNoteIds(operation.ids);
					break;
				case "selection.clear":
					this.ports.write.clearSelectedNoteIds();
					this.state.marqueeRect = null;
					break;
				case "selection.toggle": {
					const current = this.ports.read.getState().selectedNoteIds;
					if (current.includes(operation.id)) {
						this.ports.write.setSelectedNoteIds(current.filter((id) => id !== operation.id));
					} else {
						this.ports.write.setSelectedNoteIds([...current, operation.id]);
					}
					break;
				}
				case "element.previewBulk":
				case "element.commitBulk":
				case "element.rollbackSession":
					this.ports.write.updateElementsBulk(operation.elements);
					break;
				case "ui.setMarqueeRect":
					this.state.marqueeRect = operation.rect;
					break;
				case "ui.setCssVar":
					if (this.transform) this.transform.style.setProperty(operation.name, operation.value);
					break;
				case "ui.applyBackground":
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
				case "ui.setResizeAttrs": {
					const node = document.querySelector(
						`[data-canvas-element-id="${operation.elementId}"]`,
					) as HTMLElement | null;
					if (node) {
						node.setAttribute("data-resizing", operation.state);
						node.setAttribute("data-resize-heading", operation.heading);
					}
					break;
				}
			}
		}
		this.emitChange();
	}

	private operationOrder(operation: CanvasOperation) {
		switch (operation.type) {
			case "interaction.setSpaceHeld":
			case "interaction.setLockout":
			case "interaction.setPanning":
			case "viewport.beginPan":
			case "viewport.endPan":
				return 1;
			case "ui.setCssVar":
				return 2;
			case "selection.set":
			case "selection.clear":
			case "selection.toggle":
			case "ui.setMarqueeRect":
			case "ui.setResizeAttrs":
				return 3;
			case "element.previewBulk":
			case "element.commitBulk":
			case "element.rollbackSession":
			case "viewport.setOffset":
			case "viewport.setTransform":
				return 4;
			case "ui.applyBackground":
				return 5;
		}
	}

	private emitChange() {
		this.snapshot = {
			marqueeRect: this.state.marqueeRect,
			isPanning: this.state.isPanning,
			spaceHeld: this.state.spaceHeld,
			lockout: this.state.lockout,
		};
		for (const listener of this.listeners) listener();
	}

	private syncViewportCss(viewport: {
		offsetX: number;
		offsetY: number;
		zoomLevel: number;
	}) {
		if (!this.transform) return;
		this.transform.style.setProperty(VIEWPORT_CSS_VAR_OFFSET_X, `${viewport.offsetX}px`);
		this.transform.style.setProperty(VIEWPORT_CSS_VAR_OFFSET_Y, `${viewport.offsetY}px`);
		this.transform.style.setProperty(VIEWPORT_CSS_VAR_ZOOM, String(viewport.zoomLevel));
	}

	private applyBackgroundFromState() {
		if (!this.container) return;
		const state = this.ports.read.getState();
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
