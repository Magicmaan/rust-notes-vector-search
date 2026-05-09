import { useEffect, useMemo, useSyncExternalStore } from "react";
import { CanvasRuntime } from "../runtime/canvas-runtime";
import { registerDefaultCanvasCallbacks } from "../runtime/register-default-callbacks";
import type { RuntimeInputEvent } from "../runtime/types";

function toRuntimeEventFromPointer(
	kind: RuntimeInputEvent["kind"],
	event: PointerEvent,
): RuntimeInputEvent {
	return {
		kind,
		pointerId: event.pointerId,
		clientX: event.clientX,
		clientY: event.clientY,
		button: event.button,
		target: event.target,
		shiftKey: event.shiftKey,
		ctrlKey: event.ctrlKey,
		metaKey: event.metaKey,
		altKey: event.altKey,
		deltaY: 0,
		code: "",
		key: "",
		timestamp: event.timeStamp,
	};
}

function toRuntimeEventFromWheel(event: WheelEvent): RuntimeInputEvent {
	return {
		kind: "wheel",
		pointerId: -1,
		clientX: event.clientX,
		clientY: event.clientY,
		button: 0,
		target: event.target,
		shiftKey: event.shiftKey,
		ctrlKey: event.ctrlKey,
		metaKey: event.metaKey,
		altKey: event.altKey,
		deltaY: event.deltaY,
		code: "",
		key: "",
		timestamp: event.timeStamp,
	};
}

function toRuntimeEventFromKeyboard(
	kind: "keyDown" | "keyUp",
	event: KeyboardEvent,
): RuntimeInputEvent {
	return {
		kind,
		pointerId: -1,
		clientX: 0,
		clientY: 0,
		button: 0,
		target: event.target,
		shiftKey: event.shiftKey,
		ctrlKey: event.ctrlKey,
		metaKey: event.metaKey,
		altKey: event.altKey,
		deltaY: 0,
		code: event.code,
		key: event.key,
		timestamp: event.timeStamp,
	};
}

function toRuntimeBlurEvent(): RuntimeInputEvent {
	return {
		kind: "blur",
		pointerId: -1,
		clientX: 0,
		clientY: 0,
		button: 0,
		target: null,
		shiftKey: false,
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		deltaY: 0,
		code: "",
		key: "",
		timestamp: performance.now(),
	};
}

export function useCanvasRuntime({
	containerRef,
	transformRef,
	gridSize,
}: {
	containerRef: React.RefObject<HTMLDivElement | null>;
	transformRef: React.RefObject<HTMLDivElement | null>;
	gridSize: [number, number];
}) {
	const runtime = useMemo(() => new CanvasRuntime(), []);

	const snapshot = useSyncExternalStore(
		(listener) => runtime.subscribe(listener),
		() => runtime.getSnapshot(),
		() => runtime.getSnapshot(),
	);

	useEffect(() => {
		const container = containerRef.current;
		const transform = transformRef.current;
		if (!container || !transform) return;

		runtime.mount({
			container,
			transform,
			gridSize,
		});
		const unregisterCallbacks = registerDefaultCanvasCallbacks(runtime);

		const onPointerDown = (event: PointerEvent) =>
			runtime.dispatch(toRuntimeEventFromPointer("pointerDown", event));
		const onPointerMove = (event: PointerEvent) =>
			runtime.dispatch(toRuntimeEventFromPointer("pointerMove", event));
		const onPointerUp = (event: PointerEvent) =>
			runtime.dispatch(toRuntimeEventFromPointer("pointerUp", event));
		const onPointerCancel = (event: PointerEvent) =>
			runtime.dispatch(toRuntimeEventFromPointer("pointerCancel", event));
		const onWheel = (event: WheelEvent) =>
			runtime.dispatch(toRuntimeEventFromWheel(event));
		const onKeyDown = (event: KeyboardEvent) =>
			runtime.dispatch(toRuntimeEventFromKeyboard("keyDown", event));
		const onKeyUp = (event: KeyboardEvent) =>
			runtime.dispatch(toRuntimeEventFromKeyboard("keyUp", event));
		const onBlur = () => runtime.dispatch(toRuntimeBlurEvent());

		window.addEventListener("pointerdown", onPointerDown, true);
		window.addEventListener("pointermove", onPointerMove, true);
		window.addEventListener("pointerup", onPointerUp, true);
		window.addEventListener("pointercancel", onPointerCancel, true);
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("blur", onBlur, true);
		container.addEventListener("wheel", onWheel, { passive: true });

		return () => {
			window.removeEventListener("pointerdown", onPointerDown, true);
			window.removeEventListener("pointermove", onPointerMove, true);
			window.removeEventListener("pointerup", onPointerUp, true);
			window.removeEventListener("pointercancel", onPointerCancel, true);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("blur", onBlur, true);
			container.removeEventListener("wheel", onWheel);
			unregisterCallbacks();
			runtime.unmount();
		};
	}, [containerRef, gridSize, runtime, transformRef]);

	useEffect(() => {
		runtime.updateGridSize(gridSize);
	}, [gridSize, runtime]);

	return snapshot;
}
