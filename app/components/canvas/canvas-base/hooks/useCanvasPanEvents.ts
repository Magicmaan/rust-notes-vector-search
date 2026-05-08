import { useCallback, useEffect, useRef } from "react";
import { useEventListener } from "@/events";
import { useEditorGridStore } from "@/providers/editor/store";
import {
	setContainerOffset,
	startPan as panStart,
	updatePan as panUpdate,
	endPan as panEnd,
} from "../pan-controller";
import { getEffectiveViewportTransform } from "../util/viewport-transform";
import {
	applyCanvasBackgroundCssVariables,
	type GridBackgroundViewport,
} from "../../elements/background/grid-background";

type ViewportTransform = GridBackgroundViewport;
type PendingPanDelta = { deltaX: number; deltaY: number };

export function useCanvasPanEvents({
	containerRef,
	transformRef,
	gridSize,
}: {
	containerRef: React.RefObject<HTMLDivElement | null>;
	transformRef: React.RefObject<HTMLDivElement | null>;
	gridSize: [number, number];
}) {
	const panOriginRef = useRef<ViewportTransform | null>(null);
	const pendingPanDeltaRef = useRef<PendingPanDelta | null>(null);
	const panBackgroundFrameRef = useRef<number | null>(null);

	const cancelPendingPanBackgroundFrame = useCallback(() => {
		if (panBackgroundFrameRef.current !== null) {
			cancelAnimationFrame(panBackgroundFrameRef.current);
			panBackgroundFrameRef.current = null;
		}
		pendingPanDeltaRef.current = null;
	}, []);

	const schedulePanBackgroundUpdate = () => {
		if (panBackgroundFrameRef.current !== null) {
			return;
		}

		panBackgroundFrameRef.current = requestAnimationFrame(() => {
			panBackgroundFrameRef.current = null;
			const panOrigin = panOriginRef.current;
			const pendingPanDelta = pendingPanDeltaRef.current;
			pendingPanDeltaRef.current = null;

			if (!panOrigin || !pendingPanDelta) {
				return;
			}

			applyCanvasBackgroundCssVariables(
				containerRef.current,
				{
					zoomLevel: panOrigin.zoomLevel,
					offsetX: panOrigin.offsetX + pendingPanDelta.deltaX,
					offsetY: panOrigin.offsetY + pendingPanDelta.deltaY,
				},
				gridSize,
			);
		});
	};

	useEffect(() => {
		return () => {
			cancelPendingPanBackgroundFrame();
		};
	}, [cancelPendingPanBackgroundFrame]);

	useEventListener("canvas:pan:start", () => {
		cancelPendingPanBackgroundFrame();
		setContainerOffset(
			document.getElementById("editor-grid-transform") as HTMLElement | null,
		);
		panStart();

		const state = useEditorGridStore.getState();
		panOriginRef.current = getEffectiveViewportTransform(transformRef.current, {
			zoomLevel: state.zoomLevel,
			offsetX: state.offsetX,
			offsetY: state.offsetY,
		});
	});

	useEventListener("canvas:pan:update", ({ deltaX, deltaY }) => {
		panUpdate(deltaX, deltaY);

		pendingPanDeltaRef.current = { deltaX, deltaY };
		schedulePanBackgroundUpdate();
	});

	useEventListener("canvas:pan:end", ({ commit, deltaX, deltaY }) => {
		cancelPendingPanBackgroundFrame();
		panEnd(commit, { x: deltaX, y: deltaY });
		panOriginRef.current = null;

		const state = useEditorGridStore.getState();
		const effectiveViewport = getEffectiveViewportTransform(
			transformRef.current,
			{
				zoomLevel: state.zoomLevel,
				offsetX: state.offsetX,
				offsetY: state.offsetY,
			},
		);
		applyCanvasBackgroundCssVariables(
			containerRef.current,
			effectiveViewport,
			gridSize,
		);
	});
}
