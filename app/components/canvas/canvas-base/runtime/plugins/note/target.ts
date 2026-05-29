export function resolveNoteElement(target: EventTarget | null): {
	node: HTMLElement;
	elementId: string;
} | null {
	if (!(target instanceof Node)) return null;
	const source = target instanceof Element ? target : target.parentElement;
	const node = source?.closest(
		"[data-canvas-element-id]",
	) as HTMLElement | null;
	if (!node) return null;
	if (node.getAttribute("data-canvas-element") !== "note") return null;
	const elementId = node.getAttribute("data-canvas-element-id");
	if (!elementId) return null;
	return { elementId, node };
}

export function resolveResizeAnchor(
	node: HTMLElement,
	clientX: number,
	clientY: number,
): { horizontal: "left" | "right"; vertical: "top" | "bottom" } {
	const rect = node.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		return { horizontal: "right", vertical: "bottom" };
	}
	const localX = clientX - rect.left;
	const localY = clientY - rect.top;
	return {
		horizontal: localX <= rect.width / 2 ? "left" : "right",
		vertical: localY <= rect.height / 2 ? "top" : "bottom",
	};
}

export function getResizeHeading(
	deltaX: number,
	deltaY: number,
): "left" | "right" | "top" | "bottom" {
	if (Math.abs(deltaX) >= Math.abs(deltaY)) {
		return deltaX < 0 ? "left" : "right";
	}
	return deltaY < 0 ? "top" : "bottom";
}
