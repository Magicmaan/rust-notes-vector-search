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
};

type GridBackgroundCssVariableName =
	| "--grid-cell-w"
	| "--grid-cell-h"
	| "--grid-space-x"
	| "--grid-space-y"
	| "--grid-phase-x"
	| "--grid-phase-y"
	| "--grid-zoom";

const GRID_BACKGROUND_CSS_VARIABLE_ORDER: readonly GridBackgroundCssVariableName[] =
	[
		"--grid-cell-w",
		"--grid-cell-h",
		"--grid-space-x",
		"--grid-space-y",
		"--grid-phase-x",
		"--grid-phase-y",
		"--grid-zoom",
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
	// cell size is the base size of the grid cells before zoom is applied
	const cellWidth = Math.max(1, Math.round(gridSize[0] || 1));
	const cellHeight = Math.max(1, Math.round(gridSize[1] || 1));

	const zoom = Math.max(0.001, viewport.zoomLevel || 1);

	// space is the distance between grid lines, which scales with zoom
	const spaceX = Math.max(1, cellWidth * zoom);
	const spaceY = Math.max(1, cellHeight * zoom);

	// phase is the offset of grid lines. Allows for them to move smoothly with panning, and keeps them aligned with content
	const phaseX = positiveModulo(viewport.offsetX, spaceX);
	const phaseY = positiveModulo(viewport.offsetY, spaceY);

	return {
		cellWidth,
		cellHeight,
		spaceX,
		spaceY,
		phaseX,
		phaseY,
		zoom,
	};
}

// generates the CSS variables based on canvas state
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

// used to apply CSS variables during movement, without causing too many React updates
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
	};

	for (const variableName of GRID_BACKGROUND_CSS_VARIABLE_ORDER) {
		setCssVariableIfChanged(
			container.style,
			variableName,
			valuesByVariable[variableName],
		);
	}
}
