export interface PointerDragDelta {
	didDrag: boolean;
	deltaClientX: number;
	deltaClientY: number;
	deltaPixelX: number;
	deltaPixelY: number;
}

interface StartPointerDragSessionInput {
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

function toPixelDelta(
	deltaClientX: number,
	deltaClientY: number,
	zoomLevel: number,
) {
	const safeZoom = Math.max(zoomLevel, 0.001);
	return {
		deltaPixelX: deltaClientX / safeZoom,
		deltaPixelY: deltaClientY / safeZoom,
	};
}

export function startPointerDragSession(
	input: StartPointerDragSessionInput,
): () => void {
	const {
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
	let didDrag = false;
	let lastDeltaClientX = 0;
	let lastDeltaClientY = 0;

	const emitMove = (deltaClientX: number, deltaClientY: number) => {
		const { deltaPixelX, deltaPixelY } = toPixelDelta(
			deltaClientX,
			deltaClientY,
			getZoomLevel(),
		);
		onMove({
			didDrag,
			deltaClientX,
			deltaClientY,
			deltaPixelX,
			deltaPixelY,
		});
	};

	const emitComplete = (deltaClientX: number, deltaClientY: number) => {
		const { deltaPixelX, deltaPixelY } = toPixelDelta(
			deltaClientX,
			deltaClientY,
			getZoomLevel(),
		);
		onComplete({
			didDrag,
			deltaClientX,
			deltaClientY,
			deltaPixelX,
			deltaPixelY,
		});
	};

	const emitCancel = () => {
		const { deltaPixelX, deltaPixelY } = toPixelDelta(
			lastDeltaClientX,
			lastDeltaClientY,
			getZoomLevel(),
		);
		onCancel({
			didDrag,
			deltaClientX: lastDeltaClientX,
			deltaClientY: lastDeltaClientY,
			deltaPixelX,
			deltaPixelY,
		});
	};

	const cleanup = () => {
		if (!active) {
			return;
		}
		active = false;
		window.removeEventListener("pointermove", onWindowPointerMove, true);
		window.removeEventListener("pointerup", onWindowPointerUp, true);
		window.removeEventListener("pointercancel", onWindowPointerCancel, true);
		window.removeEventListener("blur", onWindowBlur, true);
	};

	const onWindowPointerMove = (event: PointerEvent) => {
		if (!active || event.pointerId !== pointerId) {
			return;
		}

		if (event.buttons === 0) {
			emitComplete(lastDeltaClientX, lastDeltaClientY);
			cleanup();
			return;
		}

		const deltaClientX = event.clientX - startClientX;
		const deltaClientY = event.clientY - startClientY;
		lastDeltaClientX = deltaClientX;
		lastDeltaClientY = deltaClientY;

		const distance = Math.hypot(deltaClientX, deltaClientY);
		if (!didDrag && distance < thresholdPx) {
			return;
		}

		if (!didDrag) {
			didDrag = true;
			onDragStateChange?.(true);
		}

		emitMove(deltaClientX, deltaClientY);
	};

	const onWindowPointerUp = (event: PointerEvent) => {
		if (!active || event.pointerId !== pointerId) {
			return;
		}

		const deltaClientX = event.clientX - startClientX;
		const deltaClientY = event.clientY - startClientY;
		lastDeltaClientX = deltaClientX;
		lastDeltaClientY = deltaClientY;

		const distance = Math.hypot(deltaClientX, deltaClientY);
		if (!didDrag && distance >= thresholdPx) {
			didDrag = true;
			onDragStateChange?.(true);
		}

		emitComplete(deltaClientX, deltaClientY);
		cleanup();
	};

	const onWindowPointerCancel = (event: PointerEvent) => {
		if (!active || event.pointerId !== pointerId) {
			return;
		}
		emitCancel();
		cleanup();
	};

	const onWindowBlur = () => {
		if (!active) {
			return;
		}
		emitCancel();
		cleanup();
	};

	window.addEventListener("pointermove", onWindowPointerMove, true);
	window.addEventListener("pointerup", onWindowPointerUp, true);
	window.addEventListener("pointercancel", onWindowPointerCancel, true);
	window.addEventListener("blur", onWindowBlur, true);

	return cleanup;
}
