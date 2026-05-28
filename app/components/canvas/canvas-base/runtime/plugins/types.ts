import { CanvasRuntime } from "../canvas-runtime";
import type {
	CanvasCallback,
	OperationResult,
	FrameContext,
	InputEventContext,
	CanvasEventInputKind,
} from "../types";

type newSelectionSessionBase = {
	clicking: boolean;
	dragging: boolean;
	pointerId?: number;
	startWorldX: number;
	startWorldY: number;
	startScreenX: number;
	startScreenY: number;
	startedWithShift: boolean;
	selectedIdsAtStart: string[];
};

// conditional type
// RuntimeCallbackKind:  CanvasCallback
// RuntimeRenderCallbackKind: CanvasRenderCallback
type PluginHandlers = Partial<Record<CanvasEventInputKind, CanvasCallback[]>>;

/**
 * A Base Plugin class to extend from.
 * A lot of logic is handled like callback assignment and semi selection state.
 * To create a plugin, extend and override the individual handler functions i.e. onPointerDown, onPointerMove
 */
export class PluginBase<State = any> {
	name: string = "Unnamed Plugin";
	description: string = "No description provided.";
	version: string = "1.0.0";

	state: State = {} as State;
	protected runtime: CanvasRuntime | null = null;

	getState() {
		return this.state;
	}
	setState(newState: Partial<State>) {
		this.state = { ...this.state, ...newState };
	}

	protected selection: newSelectionSessionBase = {
		clicking: false,
		dragging: false,
		pointerId: undefined,
		startWorldX: 0,
		startWorldY: 0,
		startScreenX: 0,
		startScreenY: 0,
		startedWithShift: false,
		selectedIdsAtStart: [],
	} as newSelectionSessionBase;

	setSelectionState(selectionState: Partial<newSelectionSessionBase>) {
		this.selection = { ...this.selection, ...selectionState };
	}

	getSelectionState() {
		return this.selection;
	}

	/**
	 * Defines the handlers for different runtime callback kinds. By default, it binds the class methods to the respective callback kinds.
	 * Override this method to customise what handlers are registered
	 * @returns returns dictionary of class handles
	 */
	// Callback kinds can come from either runtime callback kinds or render callback kinds
	// Use a union so the key type is not reduced to `never` when the two sets differ
	getHandlers(): PluginHandlers {
		return {
			pointerDown: [this.onPointerDown.bind(this)],
			pointerMove: [this.onPointerMove.bind(this)],
			pointerUp: [this.onPointerUp.bind(this)],
			pointerCancel: [this.onPointerCancel.bind(this)],
			wheel: [this.onWheel.bind(this)],
			keyDown: [this.onKeyDown.bind(this)],
			keyUp: [this.onKeyUp.bind(this)],
			blur: [this.onBlur.bind(this)],
		};
	}

	/** handlers unregister callbacks */
	unregisterCallbacks: (() => void)[] | null = null;

	/**
	 * ran on mount of canvas, registers callbacks to the runtime
	 * @param runtime Canvas runtime
	 */
	mount(runtime: CanvasRuntime) {
		this.runtime = runtime;
		if (this.unregisterCallbacks) {
			this.unregisterCallbacks = null;
		}

		const handlers = this.getHandlers();

		const callbacks = [];
		for (const kind in handlers) {
			const handlerList = handlers[kind as CanvasEventInputKind];
			if (!handlerList) continue;
			for (const handler of handlerList) {
				callbacks.push(
					runtime.registerCallback(kind as CanvasEventInputKind, handler),
				);
			}
		}
		this.unregisterCallbacks = callbacks;
	}

	/**
	 * ran on unmount of canvas, unregisters callbacks from the runtime
	 */
	unmount() {
		this.runtime = null;
		if (this.unregisterCallbacks) {
			for (const cleanup of this.unregisterCallbacks) {
				console.log("Cleaning up plugin callback:", this.name);
				cleanup();
			}
			this.unregisterCallbacks = null;
		}
	}
	protected onRender(context: FrameContext<{}>): void {}
	protected onPointerDown(
		ctx: FrameContext<InputEventContext>,
	): OperationResult | undefined {
		return null;
	}
	protected onPointerMove(
		ctx: FrameContext<InputEventContext>,
	): OperationResult | undefined {
		return null;
	}
	protected onPointerUp(
		ctx: FrameContext<InputEventContext>,
	): OperationResult | undefined {
		return null;
	}
	protected onPointerCancel(
		ctx: FrameContext<InputEventContext>,
	): OperationResult | undefined {
		return null;
	}
	protected onWheel(
		ctx: FrameContext<InputEventContext>,
	): OperationResult | undefined {
		return null;
	}
	protected onKeyDown(
		ctx: FrameContext<InputEventContext>,
	): OperationResult | undefined {
		return null;
	}
	protected onKeyUp(
		ctx: FrameContext<InputEventContext>,
	): OperationResult | undefined {
		return null;
	}
	protected onBlur(
		ctx: FrameContext<InputEventContext>,
	): OperationResult | undefined {
		return null;
	}
}

// export class TestPlugin extends PluginBase<{}> {
// 	name = "Test Plugin";
// 	description = "A plugin for testing purposes.";
// 	version = "0.1.0";

// 	protected override onPointerDown(ctx: FrameContext) {
// 		console.log("Pointer down event received in TestPlugin:", ctx);
// 		return null;
// 	}
// }
