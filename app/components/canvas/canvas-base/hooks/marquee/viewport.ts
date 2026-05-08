import { useEditorGridStore } from "@/providers/editor/store";
import {
	getEffectiveViewportTransform,
	worldPointFromClient,
	type ViewportTransform,
} from "@/components/canvas/canvas-base/util/viewport-transform";

function toViewportTransform(
	state: ReturnType<typeof useEditorGridStore.getState>,
): ViewportTransform {
	return {
		offsetX: state.offsetX,
		offsetY: state.offsetY,
		zoomLevel: state.zoomLevel,
	};
}

export function toPointerWorldPoint({
	clientX,
	clientY,
	container,
	transform,
	state,
}: {
	clientX: number;
	clientY: number;
	container: HTMLDivElement;
	transform: HTMLDivElement | null;
	state: ReturnType<typeof useEditorGridStore.getState>;
}) {
	const viewport = getEffectiveViewportTransform(
		transform,
		toViewportTransform(state),
	);
	return worldPointFromClient(clientX, clientY, container, viewport);
}
