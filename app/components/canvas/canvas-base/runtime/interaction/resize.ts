import { clampMinDimension, rangesOverlap, snapToMultiple } from "./collision";
const DEFAULT_MIN_CELL_WIDTH = 2;
const DEFAULT_MIN_CELL_HEIGHT = 2;

export type ResizeAnchor = {
	horizontal: "left" | "right";
	vertical: "top" | "bottom";
};

export type ResizePlacement = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type ResizeBaseline = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
};

export type ResizeResolverInput = {
	anchor: ResizeAnchor;
	baseline: ResizeBaseline;
	deltaX: number;
	deltaY: number;
	cellWidth: number;
	cellHeight: number;
	findOccupyingIds: (
		x: number,
		y: number,
		width: number,
		height: number,
		excludeId: string,
	) => string[];
	getElement: (id: string) =>
		| { x: number; y: number; width: number; height: number }
		| undefined;
	fallbackPlacement: ResizePlacement;
	minCellWidth?: number;
	minCellHeight?: number;
};

export function resolveResizePlacement(input: ResizeResolverInput): ResizePlacement {
	const {
		anchor,
		baseline,
		deltaX,
		deltaY,
		cellWidth,
		cellHeight,
		findOccupyingIds,
		getElement,
		fallbackPlacement,
		minCellWidth = DEFAULT_MIN_CELL_WIDTH,
		minCellHeight = DEFAULT_MIN_CELL_HEIGHT,
	} = input;

	const startPixelX = baseline.x * cellWidth;
	const startPixelY = baseline.y * cellHeight;
	const startPixelWidth = baseline.width * cellWidth;
	const startPixelHeight = baseline.height * cellHeight;
	const startRight = startPixelX + startPixelWidth;
	const startBottom = startPixelY + startPixelHeight;

	const candidatePixelWidth =
		anchor.horizontal === "left"
			? startPixelWidth - deltaX
			: startPixelWidth + deltaX;
	const candidatePixelHeight =
		anchor.vertical === "top"
			? startPixelHeight - deltaY
			: startPixelHeight + deltaY;

	const minPixelWidth = minCellWidth * cellWidth;
	const minPixelHeight = minCellHeight * cellHeight;
	const clampedPixelWidth = Math.max(minPixelWidth, candidatePixelWidth);
	const clampedPixelHeight = Math.max(minPixelHeight, candidatePixelHeight);
	const clampedPixelX =
		anchor.horizontal === "left" ? startRight - clampedPixelWidth : startPixelX;
	const clampedPixelY =
		anchor.vertical === "top" ? startBottom - clampedPixelHeight : startPixelY;

	const snappedPixelWidth = snapToMultiple(clampedPixelWidth, cellWidth);
	const snappedPixelHeight = snapToMultiple(clampedPixelHeight, cellHeight);
	const snappedWidth = clampMinDimension(
		snappedPixelWidth / cellWidth,
		minCellWidth,
	);
	const snappedHeight = clampMinDimension(
		snappedPixelHeight / cellHeight,
		minCellHeight,
	);
	const snappedX =
		anchor.horizontal === "left"
			? (startRight - snappedWidth * cellWidth) / cellWidth
			: clampedPixelX / cellWidth;
	const snappedY =
		anchor.vertical === "top"
			? (startBottom - snappedHeight * cellHeight) / cellHeight
			: clampedPixelY / cellHeight;

	const occupyingIds = findOccupyingIds(
		snappedX,
		snappedY,
		snappedWidth,
		snappedHeight,
		baseline.id,
	);

	let resolved = {
		x: snappedX,
		y: snappedY,
		width: snappedWidth,
		height: snappedHeight,
	};

	if (occupyingIds.length > 0) {
		const fixedRight = snappedX + snappedWidth;
		const fixedBottom = snappedY + snappedHeight;
		let horizontalX = snappedX;
		let horizontalWidth = snappedWidth;
		let constrainedRight = fixedRight;
		let constrainedLeft = snappedX;

		for (const id of occupyingIds) {
			const collider = getElement(id);
			if (!collider) continue;
			const overlapsY = rangesOverlap(
				{ start: snappedY, end: snappedY + snappedHeight },
				{ start: collider.y, end: collider.y + collider.height },
			);
			if (!overlapsY) continue;
			constrainedRight = Math.min(constrainedRight, collider.x);
			constrainedLeft = Math.max(constrainedLeft, collider.x + collider.width);
		}

		if (anchor.horizontal === "right") {
			const maxRightWidth = constrainedRight - snappedX;
			if (
				Number.isFinite(maxRightWidth) &&
				maxRightWidth >= minCellWidth
			) {
				horizontalWidth = clampMinDimension(
					maxRightWidth,
					minCellWidth,
				);
			} else {
				horizontalX = fallbackPlacement.x;
				horizontalWidth = fallbackPlacement.width;
			}
		} else {
			const maxAllowedLeft = fixedRight - minCellWidth;
			if (
				Number.isFinite(constrainedLeft) &&
				constrainedLeft <= maxAllowedLeft
			) {
				const cappedLeft = Math.min(constrainedLeft, maxAllowedLeft);
				horizontalX = cappedLeft;
					horizontalWidth = clampMinDimension(
						fixedRight - cappedLeft,
						minCellWidth,
					);
			} else {
				horizontalX = fallbackPlacement.x;
				horizontalWidth = fallbackPlacement.width;
			}
		}

		let verticalY = snappedY;
		let verticalHeight = snappedHeight;
		let constrainedBottom = fixedBottom;
		let constrainedTop = snappedY;

		for (const id of occupyingIds) {
			const collider = getElement(id);
			if (!collider) continue;
			const overlapsX = rangesOverlap(
				{ start: horizontalX, end: horizontalX + horizontalWidth },
				{ start: collider.x, end: collider.x + collider.width },
			);
			if (!overlapsX) continue;
			constrainedBottom = Math.min(constrainedBottom, collider.y);
			constrainedTop = Math.max(constrainedTop, collider.y + collider.height);
		}

		if (anchor.vertical === "bottom") {
			const maxBottomHeight = constrainedBottom - snappedY;
			if (
				Number.isFinite(maxBottomHeight) &&
				maxBottomHeight >= minCellHeight
			) {
				verticalHeight = clampMinDimension(
					maxBottomHeight,
					minCellHeight,
				);
			} else {
				verticalY = fallbackPlacement.y;
				verticalHeight = fallbackPlacement.height;
			}
		} else {
			const maxAllowedTop = fixedBottom - minCellHeight;
			if (
				Number.isFinite(constrainedTop) &&
				constrainedTop <= maxAllowedTop
			) {
				const cappedTop = Math.min(constrainedTop, maxAllowedTop);
				verticalY = cappedTop;
					verticalHeight = clampMinDimension(
						fixedBottom - cappedTop,
						minCellHeight,
					);
			} else {
				verticalY = fallbackPlacement.y;
				verticalHeight = fallbackPlacement.height;
			}
		}

		resolved.x = horizontalX;
		resolved.width = horizontalWidth;
		resolved.y = verticalY;
		resolved.height = verticalHeight;
	}

	if (
		!Number.isFinite(resolved.x) ||
		!Number.isFinite(resolved.width) ||
		resolved.width < minCellWidth
	) {
		resolved.x = fallbackPlacement.x;
		resolved.width = fallbackPlacement.width;
	}

	if (
		!Number.isFinite(resolved.y) ||
		!Number.isFinite(resolved.height) ||
		resolved.height < minCellHeight
	) {
		resolved.y = fallbackPlacement.y;
		resolved.height = fallbackPlacement.height;
	}

	return resolved;
}
