export type GridBackgroundViewport = {
	zoomLevel: number;
	offsetX: number;
	offsetY: number;
};

type GridBackgroundMetrics = {
	cellWidth: number;
	cellHeight: number;
	spaceX: number;
	spaceY: number;
	phaseX: number;
	phaseY: number;
	zoom: number;
	lodAlpha: number;
	lodSpacing: number;
};

type GridBackgroundCssVariableName =
	| "--grid-cell-w"
	| "--grid-cell-h"
	| "--grid-space-x"
	| "--grid-space-y"
	| "--grid-phase-x"
	| "--grid-phase-y"
	| "--grid-zoom"
	| "--grid-lod-alpha"
	| "--grid-lod-spacing";

const GRID_BACKGROUND_CSS_VARIABLE_ORDER: readonly GridBackgroundCssVariableName[] =
	[
		"--grid-cell-w",
		"--grid-cell-h",
		"--grid-space-x",
		"--grid-space-y",
		"--grid-phase-x",
		"--grid-phase-y",
		"--grid-zoom",
		"--grid-lod-alpha",
		"--grid-lod-spacing",
	];

function positiveModulo(value: number, modulus: number): number {
	if (!Number.isFinite(value) || !Number.isFinite(modulus) || modulus <= 0) {
		return 0;
	}

	const remainder = value % modulus;
	return remainder < 0 ? remainder + modulus : remainder;
}

export function getCanvasBackgroundMetrics(
	viewport: GridBackgroundViewport,
	gridSize: [number, number],
): GridBackgroundMetrics {
	const cellWidth = Math.max(1, Math.round(gridSize[0] || 1));
	const cellHeight = Math.max(1, Math.round(gridSize[1] || 1));
	const zoom = Math.max(0.001, viewport.zoomLevel || 1);
	const spaceX = Math.max(1, cellWidth * zoom);
	const spaceY = Math.max(1, cellHeight * zoom);
	const phaseX = positiveModulo(viewport.offsetX, spaceX);
	const phaseY = positiveModulo(viewport.offsetY, spaceY);

	// LOD should reduce dots primarily when zoomed out (<1), not when zoomed in.
	const zoomOutDistance = zoom < 1 ? Math.abs(Math.log2(zoom)) : 0;
	const lodAlpha = Math.max(0.28, Math.min(1, 1 - zoomOutDistance * 0.35));
	const lodSpacing = Math.max(1, Math.min(2.2, 1 + zoomOutDistance * 0.6));

	return {
		cellWidth,
		cellHeight,
		spaceX,
		spaceY,
		phaseX,
		phaseY,
		zoom,
		lodAlpha,
		lodSpacing,
	};
}

export function getCanvasBackgroundCssVariables(
	viewport: GridBackgroundViewport,
	gridSize: [number, number],
): Record<string, string> {
	const metrics = getCanvasBackgroundMetrics(viewport, gridSize);

	return {
		"--grid-cell-w": `${metrics.cellWidth}px`,
		"--grid-cell-h": `${metrics.cellHeight}px`,
		"--grid-space-x": `${metrics.spaceX}px`,
		"--grid-space-y": `${metrics.spaceY}px`,
		"--grid-phase-x": `${metrics.phaseX}px`,
		"--grid-phase-y": `${metrics.phaseY}px`,
		"--grid-zoom": String(metrics.zoom),
		"--grid-lod-alpha": String(metrics.lodAlpha),
		"--grid-lod-spacing": String(metrics.lodSpacing),
	};
}

function setCssVariableIfChanged(
	style: CSSStyleDeclaration,
	name: GridBackgroundCssVariableName,
	value: string,
) {
	if (style.getPropertyValue(name) === value) {
		return;
	}
	style.setProperty(name, value);
}

export function applyCanvasBackgroundCssVariables(
	container: HTMLDivElement | null,
	viewport: GridBackgroundViewport,
	gridSize: [number, number],
) {
	if (!container) {
		return;
	}

	const metrics = getCanvasBackgroundMetrics(viewport, gridSize);
	const valuesByVariable: Record<GridBackgroundCssVariableName, string> = {
		"--grid-cell-w": `${metrics.cellWidth}px`,
		"--grid-cell-h": `${metrics.cellHeight}px`,
		"--grid-space-x": `${metrics.spaceX}px`,
		"--grid-space-y": `${metrics.spaceY}px`,
		"--grid-phase-x": `${metrics.phaseX}px`,
		"--grid-phase-y": `${metrics.phaseY}px`,
		"--grid-zoom": String(metrics.zoom),
		"--grid-lod-alpha": String(metrics.lodAlpha),
		"--grid-lod-spacing": String(metrics.lodSpacing),
	};

	for (const variableName of GRID_BACKGROUND_CSS_VARIABLE_ORDER) {
		setCssVariableIfChanged(
			container.style,
			variableName,
			valuesByVariable[variableName],
		);
	}
}
