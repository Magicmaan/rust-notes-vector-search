export function resolveSelectionOnPointerDown(
	selected: string[],
	elementId: string,
	shiftKey: boolean,
): string[] {
	const isSelected = selected.includes(elementId);
	if (shiftKey) {
		return isSelected
			? selected.filter((id) => id !== elementId)
			: [...selected, elementId];
	}
	if (!isSelected || selected.length > 1) {
		return [elementId];
	}
	return selected;
}
