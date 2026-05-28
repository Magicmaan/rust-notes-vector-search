import { useEditorGridStore } from "@/providers/editor/store";
import type { RuntimePorts } from "./types";

export function createZustandRuntimePorts(): RuntimePorts {
	return {
		read: {
			getState: () => {
				const state = useEditorGridStore.getState();
				return {
					gridSize: state.gridSize,
					zoomLevel: state.zoomLevel,
					offsetX: state.offsetX,
					offsetY: state.offsetY,
					isPanning: state.isPanning,
					selectedNoteIds: state.selectedNoteIds,
					elements: state.elements,
					elementIds: state.elementIds,
				};
			},
			subscribeViewport: (listener) =>
				useEditorGridStore.subscribe((next, prev) => {
					if (
						next.zoomLevel !== prev.zoomLevel ||
						next.offsetX !== prev.offsetX ||
						next.offsetY !== prev.offsetY
					) {
						listener();
					}
				}),
		},
		write: {
			setSelectedNoteIds: (ids) =>
				useEditorGridStore.getState().setSelectedNoteIds(ids),
			clearSelectedNoteIds: () =>
				useEditorGridStore.getState().clearSelectedNoteIds(),
			updateElementsBulk: (elements) =>
				useEditorGridStore.getState().updateElementsBulk(elements),
			setViewportOffset: (offsetX, offsetY) =>
				useEditorGridStore.getState().setViewportOffset({ x: offsetX, y: offsetY }),
			setViewportTransform: (zoomLevel, offsetX, offsetY) =>
				useEditorGridStore.getState().setViewportTransform({
					zoomLevel,
					offsetX,
					offsetY,
				}),
			startPan: () => useEditorGridStore.getState().startPan(),
			endPan: (commit) => useEditorGridStore.getState().endPan(commit),
		},
		query: {
			getElement: (id) => useEditorGridStore.getState().getElement(id),
			findOccupyingIds: (x, y, width, height, excludeIds) =>
				useEditorGridStore
					.getState()
					.findOccupyingIds(x, y, width, height, excludeIds),
			isAreaFree: (x, y, width, height, excludeIds) =>
				useEditorGridStore
					.getState()
					.isAreaFree(x, y, width, height, excludeIds),
			findNearestFree: (x, y, width, height, excludeIds, maxRadius) =>
				useEditorGridStore
					.getState()
					.findNearestFree(x, y, width, height, excludeIds, maxRadius),
		},
	};
}
