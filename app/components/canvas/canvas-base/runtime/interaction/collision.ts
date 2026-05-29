export type AxisRange = { start: number; end: number };

export function rangesOverlap(a: AxisRange, b: AxisRange) {
	return a.start < b.end && a.end > b.start;
}

export function clampMinDimension(value: number, minVal: number) {
	return Math.max(minVal, value);
}

export function snapToMultiple(num: number, multiple: number) {
	return Math.round(num / multiple) * multiple;
}
