import { useCallback, useRef, useEffect } from "react";

export interface PositioningCallbacks {
	renderAtPixelPosition: (pixelX: number, pixelY: number) => void;
	renderFromStore: () => void;
	scheduleRenderFromSession: () => void;
	cancelPendingFrame: () => void;
}

interface UsePositionRenderingInput {
	wrapperRef: React.RefObject<HTMLDivElement | null>;
	pixelSize: { x: number; y: number };
	cellWidth: number;
	cellHeight: number;
	element: { x: number; y: number };
}

/**
 * Position rendering hook: Handle CSS variable updates, RAF scheduling, and DOM snapshots.
 * Separated from drag logic to isolate rendering concerns.
 */
export function usePositionRendering(
	input: UsePositionRenderingInput,
): PositioningCallbacks {
	const { wrapperRef, pixelSize, cellWidth, cellHeight, element } = input;

	const rafRef = useRef<number | null>(null);
	const elementRef = useRef(element);
	const sessionDeltaRef = useRef({ x: 0, y: 0 });

	useEffect(() => {
		elementRef.current = element;
	}, [element]);

	const renderAtPixelPosition = useCallback(
		(pixelX: number, pixelY: number) => {
			if (!wrapperRef.current) return;
			wrapperRef.current.style.setProperty("--offset-x", `${pixelX}px`);
			wrapperRef.current.style.setProperty("--offset-y", `${pixelY}px`);
			wrapperRef.current.style.setProperty("--width", `${pixelSize.x}px`);
			wrapperRef.current.style.setProperty("--height", `${pixelSize.y}px`);
		},
		[pixelSize, wrapperRef],
	);

	const renderFromStore = useCallback(() => {
		const current = elementRef.current;
		renderAtPixelPosition(current.x * cellWidth, current.y * cellHeight);
	}, [cellWidth, cellHeight, renderAtPixelPosition]);

	const cancelPendingFrame = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
	}, []);

	// Schedule render on next available frame, avoiding queue buildup
	const scheduleRenderFromSession = useCallback(() => {
		if (rafRef.current !== null) {
			return;
		}

		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = null;
			const session = sessionDeltaRef.current;
			renderAtPixelPosition(
				elementRef.current.x * cellWidth + session.x,
				elementRef.current.y * cellHeight + session.y,
			);
		});
	}, [cellWidth, cellHeight, renderAtPixelPosition]);

	return {
		renderAtPixelPosition,
		renderFromStore,
		scheduleRenderFromSession,
		cancelPendingFrame,
	};
}
