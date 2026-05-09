import { CanvasRuntime } from "./canvas-runtime";
import {
	onPanBlur,
	onPanKeyDown,
	onPanKeyUp,
	onPanPointerCancel,
	onPanPointerDown,
	onPanPointerMove,
	onPanPointerUp,
} from "./callbacks/pan-callbacks";
import { onZoomWheel } from "./callbacks/zoom-callbacks";
import {
	onMarqueeBlur,
	onMarqueeOutsidePointerDown,
	onMarqueePointerCancel,
	onMarqueePointerDown,
	onMarqueePointerMove,
	onMarqueePointerUp,
} from "./callbacks/marquee-callbacks";

export function registerDefaultCanvasCallbacks(runtime: CanvasRuntime) {
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
