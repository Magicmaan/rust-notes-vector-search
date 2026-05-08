import { useCallback, useEffect, useRef } from "react";
import { useEventListener } from "@/events";
import { useEditorGridStore } from "@/providers/editor/store";
import {
	MAX_ZOOM,
	MIN_ZOOM,
	ZOOM_STEP,
} from "@/providers/editor/slices/viewportSlice";
import { getEffectiveViewportTransform } from "../util/viewport-transform";
import {
	applyCanvasBackgroundCssVariables,
	type GridBackgroundViewport,
} from "../../elements/background/grid-background";
import {
	VIEWPORT_CSS_VAR_OFFSET_X,
	VIEWPORT_CSS_VAR_OFFSET_Y,
	VIEWPORT_CSS_VAR_ZOOM,
} from "../constants/viewport-css-vars";

function clampZoom(zoom: number) {
	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function screenToWorld({
	screenX,
	screenY,
	offsetX,
	offsetY,
	zoom,
}: {
	screenX: number;
	screenY: number;
	offsetX: number;
	offsetY: number;
	zoom: number;
}) {
	return {
		x: (screenX - offsetX) / zoom,
		y: (screenY - offsetY) / zoom,
	};
}

function worldToScreen({
	worldX,
	worldY,
	offsetX,
	offsetY,
	zoom,
}: {
	worldX: number;
	worldY: number;
	offsetX: number;
	offsetY: number;
	zoom: number;
}) {
	return {
		x: worldX * zoom + offsetX,
		y: worldY * zoom + offsetY,
	};
}

type PendingWheelZoom = {
	pointerX: number;
	pointerY: number;
	stepCount: number;
};

type ViewportTransform = GridBackgroundViewport;

const WHEEL_COMMIT_IDLE_MS = 90;

function applyZoomSteps(startZoom: number, stepCount: number): number {
	if (!Number.isFinite(startZoom) || stepCount === 0) {
		return startZoom;
	}

	const scalePerStep = 1 + ZOOM_STEP;
	if (scalePerStep <= 0 || !Number.isFinite(scalePerStep)) {
		return startZoom;
	}

	const scaleMultiplier = scalePerStep ** stepCount;
	return clampZoom(startZoom * scaleMultiplier);
}

function computeMouseAnchoredZoomTransform({
	pointerX,
	pointerY,
	stepCount,
	viewport,
}: {
	pointerX: number;
	pointerY: number;
	stepCount: number;
	viewport: ViewportTransform;
}): ViewportTransform | null {
	if (
		!Number.isFinite(pointerX) ||
		!Number.isFinite(pointerY) ||
		!Number.isFinite(viewport.zoomLevel) ||
		!Number.isFinite(viewport.offsetX) ||
		!Number.isFinite(viewport.offsetY) ||
		viewport.zoomLevel <= 0
	) {
		return null;
	}

	const targetZoom = applyZoomSteps(viewport.zoomLevel, stepCount);
	if (targetZoom === viewport.zoomLevel) {
		return null;
	}

	const worldPoint = screenToWorld({
		screenX: pointerX,
		screenY: pointerY,
		offsetX: viewport.offsetX,
		offsetY: viewport.offsetY,
		zoom: viewport.zoomLevel,
	});

	const anchored = worldToScreen({
		worldX: worldPoint.x,
		worldY: worldPoint.y,
		offsetX: 0,
		offsetY: 0,
		zoom: targetZoom,
	});

	return {
		zoomLevel: targetZoom,
		offsetX: pointerX - anchored.x,
		offsetY: pointerY - anchored.y,
	};
}

export function useCanvasZoomEvents({
	containerRef,
	transformRef,
	gridSize,
}: {
	containerRef: React.RefObject<HTMLDivElement | null>;
	transformRef: React.RefObject<HTMLDivElement | null>;
	gridSize: [number, number];
}) {
	const pendingWheelZoomRef = useRef<PendingWheelZoom | null>(null);
	const wheelFrameRef = useRef<number | null>(null);
	const wheelIdleTimeoutRef = useRef<number | null>(null);
	const wheelPreviewTransformRef = useRef<ViewportTransform | null>(null);

	const commitWheelPreview = useCallback(() => {
		const preview = wheelPreviewTransformRef.current;
		if (!preview) {
			return;
		}

		const state = useEditorGridStore.getState();
		if (
			state.zoomLevel !== preview.zoomLevel ||
			state.offsetX !== preview.offsetX ||
			state.offsetY !== preview.offsetY
		) {
			state.setViewportTransform(preview);
		}

		wheelPreviewTransformRef.current = null;
	}, []);

	useEventListener("canvas:zoom:wheel", ({ pointerX, pointerY, stepCount }) => {
		if (
			!Number.isFinite(pointerX) ||
			!Number.isFinite(pointerY) ||
			stepCount === 0
		) {
			return;
		}

		const pendingWheelZoom = pendingWheelZoomRef.current;
		if (pendingWheelZoom) {
			pendingWheelZoom.pointerX = pointerX;
			pendingWheelZoom.pointerY = pointerY;
			pendingWheelZoom.stepCount += stepCount;
		} else {
			pendingWheelZoomRef.current = {
				pointerX,
				pointerY,
				stepCount,
			};
		}

		if (wheelFrameRef.current !== null) {
			return;
		}

		if (wheelIdleTimeoutRef.current !== null) {
			window.clearTimeout(wheelIdleTimeoutRef.current);
		}
		wheelIdleTimeoutRef.current = window.setTimeout(() => {
			wheelIdleTimeoutRef.current = null;
			commitWheelPreview();
		}, WHEEL_COMMIT_IDLE_MS);

		wheelFrameRef.current = requestAnimationFrame(() => {
			wheelFrameRef.current = null;
			const pendingWheelZoom = pendingWheelZoomRef.current;
			pendingWheelZoomRef.current = null;

			if (!pendingWheelZoom) {
				return;
			}

			const state = useEditorGridStore.getState();
			const effectiveViewport = getEffectiveViewportTransform(
				transformRef.current,
				{
					zoomLevel: state.zoomLevel,
					offsetX: state.offsetX,
					offsetY: state.offsetY,
				},
			);

			const nextTransform = computeMouseAnchoredZoomTransform({
				pointerX: pendingWheelZoom.pointerX,
				pointerY: pendingWheelZoom.pointerY,
				stepCount: pendingWheelZoom.stepCount,
				viewport: effectiveViewport,
			});

			if (!nextTransform) {
				return;
			}

			wheelPreviewTransformRef.current = nextTransform;
			if (transformRef.current) {
				transformRef.current.style.setProperty(
					VIEWPORT_CSS_VAR_OFFSET_X,
					`${nextTransform.offsetX}px`,
				);
				transformRef.current.style.setProperty(
					VIEWPORT_CSS_VAR_OFFSET_Y,
					`${nextTransform.offsetY}px`,
				);
				transformRef.current.style.setProperty(
					VIEWPORT_CSS_VAR_ZOOM,
					String(nextTransform.zoomLevel),
				);
			}
			applyCanvasBackgroundCssVariables(
				containerRef.current,
				nextTransform,
				gridSize,
			);
		});
	});

	useEffect(() => {
		return () => {
			if (wheelFrameRef.current !== null) {
				cancelAnimationFrame(wheelFrameRef.current);
				wheelFrameRef.current = null;
			}
			if (wheelIdleTimeoutRef.current !== null) {
				window.clearTimeout(wheelIdleTimeoutRef.current);
				wheelIdleTimeoutRef.current = null;
			}
			pendingWheelZoomRef.current = null;
			wheelPreviewTransformRef.current = null;
		};
	}, []);
}
