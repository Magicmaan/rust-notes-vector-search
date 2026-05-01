import {
	startPointerDragSession,
	type PointerDragDelta,
} from "@/lib/pointer-drag-session";

interface StartManagedPointerDragSessionInput {
	target: HTMLElement;
	pointerId: number;
	startClientX: number;
	startClientY: number;
	thresholdPx: number;
	getZoomLevel: () => number;
	onMove: (delta: PointerDragDelta) => void;
	onComplete: (delta: PointerDragDelta) => void;
	onCancel: (delta: PointerDragDelta) => void;
	onDragStateChange?: (didDrag: boolean) => void;
}

export function startManagedPointerDragSession(
	input: StartManagedPointerDragSessionInput,
): () => void {
	const {
		target,
		pointerId,
		startClientX,
		startClientY,
		thresholdPx,
		getZoomLevel,
		onMove,
		onComplete,
		onCancel,
		onDragStateChange,
	} = input;

	let active = true;

	const releasePointerCapture = () => {
		try {
			if (target.hasPointerCapture(pointerId)) {
				target.releasePointerCapture(pointerId);
			}
		} catch {
			// no-op
		}
	};

	const removeWindowListeners = startPointerDragSession({
		pointerId,
		startClientX,
		startClientY,
		thresholdPx,
		getZoomLevel,
		onMove,
		onComplete: (delta) => {
			onComplete(delta);
			cleanup();
		},
		onCancel: (delta) => {
			onCancel(delta);
			cleanup();
		},
		onDragStateChange,
	});

	const cleanup = () => {
		if (!active) {
			return;
		}
		removeWindowListeners();
		releasePointerCapture();
		active = false;
	};

	try {
		target.setPointerCapture(pointerId);
	} catch {
		// no-op
	}

	return cleanup;
}
