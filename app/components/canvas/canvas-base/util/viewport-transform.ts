import {
	VIEWPORT_CSS_VAR_OFFSET_X,
	VIEWPORT_CSS_VAR_OFFSET_Y,
	VIEWPORT_CSS_VAR_ZOOM,
} from "../constants/viewport-css-vars";

export interface ViewportTransform {
	zoomLevel: number;
	offsetX: number;
	offsetY: number;
}

export function parseViewportNumber(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	const parsed = Number.parseFloat(trimmed);
	if (!Number.isFinite(parsed)) {
		return null;
	}

	return parsed;
}

export function getEffectiveViewportTransform(
	transformElement: HTMLDivElement | null,
	fallback: ViewportTransform,
): ViewportTransform {
	if (!transformElement) {
		return fallback;
	}

	const cssOffsetX = parseViewportNumber(
		transformElement.style.getPropertyValue(VIEWPORT_CSS_VAR_OFFSET_X),
	);
	const cssOffsetY = parseViewportNumber(
		transformElement.style.getPropertyValue(VIEWPORT_CSS_VAR_OFFSET_Y),
	);
	const cssScale = parseViewportNumber(
		transformElement.style.getPropertyValue(VIEWPORT_CSS_VAR_ZOOM),
	);

	return {
		zoomLevel: cssScale ?? fallback.zoomLevel,
		offsetX: cssOffsetX ?? fallback.offsetX,
		offsetY: cssOffsetY ?? fallback.offsetY,
	};
}

export function worldPointFromClient(
	clientX: number,
	clientY: number,
	container: HTMLDivElement,
	viewport: ViewportTransform,
) {
	const rect = container.getBoundingClientRect();
	const screenX = clientX - rect.left;
	const screenY = clientY - rect.top;
	const safeZoom = Math.max(viewport.zoomLevel, 0.0001);

	return {
		x: (screenX - viewport.offsetX) / safeZoom,
		y: (screenY - viewport.offsetY) / safeZoom,
	};
}
