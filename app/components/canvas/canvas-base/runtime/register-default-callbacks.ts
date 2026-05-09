import { CanvasRuntime } from "./canvas-runtime";
import { createPanCallbacks } from "./callbacks/pan-callbacks";
import { onZoomWheel } from "./callbacks/zoom-callbacks";
import { createMarqueeCallbacks } from "./callbacks/marquee-callbacks";

export function registerDefaultCanvasCallbacks(runtime: CanvasRuntime) {
	const {
		onPanBlur,
		onPanKeyDown,
		onPanKeyUp,
		onPanPointerCancel,
		onPanPointerDown,
		onPanPointerMove,
		onPanPointerUp,
	} = createPanCallbacks();
	const {
		onMarqueeBlur,
		onMarqueeOutsidePointerDown,
		onMarqueePointerCancel,
		onMarqueePointerDown,
		onMarqueePointerMove,
		onMarqueePointerUp,
	} = createMarqueeCallbacks();

	const cleanups = [
		runtime.registerCallback("keyDown", onPanKeyDown),
		runtime.registerCallback("keyUp", onPanKeyUp),
		runtime.registerCallback("pointerDown", onPanPointerDown),
		runtime.registerCallback("pointerMove", onPanPointerMove),
		runtime.registerCallback("pointerUp", onPanPointerUp),
		runtime.registerCallback("pointerCancel", onPanPointerCancel),
		runtime.registerCallback("blur", onPanBlur),
		runtime.registerCallback("wheel", onZoomWheel),
		runtime.registerCallback("pointerDown", onMarqueePointerDown),
		runtime.registerCallback("pointerMove", onMarqueePointerMove),
		runtime.registerCallback("pointerUp", onMarqueePointerUp),
		runtime.registerCallback("pointerCancel", onMarqueePointerCancel),
		runtime.registerCallback("blur", onMarqueeBlur),
		runtime.registerCallback("pointerDown", onMarqueeOutsidePointerDown),
	];

	return () => {
		for (const cleanup of cleanups) {
			cleanup();
		}
	};
}
