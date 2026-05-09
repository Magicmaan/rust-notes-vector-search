import { useCallback, useEffect, useMemo, useRef } from "react";
import type { AnyCanvasElementDisplay } from "@/types";
import { useEditorGridStore } from "@/providers/editor/store";
import { useShallow } from "zustand/react/shallow";
import { useGridMetrics } from "./hooks/useGridMetrics";
import { usePositionRendering } from "./hooks/usePositionRendering";
import { useDragInteraction } from "./hooks/useDragInteraction";
import { useResizeInteraction } from "./hooks/useResizeInteraction";
import { CanvasElementRuntime } from "./runtime/canvas-element-runtime";
import { selectionPlugin } from "./runtime/plugins/selection-plugin";

function buildTickEvent() {
	return {
		kind: "tick" as const,
		pointerId: -1,
		clientX: 0,
		clientY: 0,
		button: 0,
		shiftKey: false,
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		target: null,
		timestamp: performance.now(),
	};
}

export function useCanvasElementCore(
	element: AnyCanvasElementDisplay,
	options?: { enableResize?: boolean },
) {
	const enableResize = options?.enableResize ?? true;
	const wrapperRef = useRef<HTMLDivElement>(null);
	const runtimeRef = useRef<CanvasElementRuntime | null>(null);
	if (!runtimeRef.current) {
		runtimeRef.current = new CanvasElementRuntime();
	}

	const selectedNoteIds = useEditorGridStore((s) => s.selectedNoteIds);
	const isSelected = selectedNoteIds.includes(element.id);
	const isMultiSelected = isSelected && selectedNoteIds.length > 1;

	const { updateElement, isAreaFree, findNearestFree, gridSize } =
		useEditorGridStore(
			useShallow((s) => ({
				updateElement: s.updateElement,
				isAreaFree: s.isAreaFree,
				findNearestFree: s.findNearestFree,
				gridSize: s.gridSize,
			})),
		);

	const grid = useGridMetrics({
		gridSizeWidth: gridSize[0],
		gridSizeHeight: gridSize[1],
		elementWidth: element.width,
		elementHeight: element.height,
		elementX: element.x,
		elementY: element.y,
	});

	const elementPosition = useMemo(
		() => ({ x: element.x, y: element.y }),
		[element.x, element.y],
	);

	const interactionStore = useMemo(
		() => ({
			getViewport: () => {
				const state = useEditorGridStore.getState();
				return { isPanning: state.isPanning, zoomLevel: state.zoomLevel };
			},
			updateElement,
			isAreaFree,
			findNearestFree,
		}),
		[findNearestFree, isAreaFree, updateElement],
	);

	const positioning = usePositionRendering({
		wrapperRef,
		pixelSize: grid.pixelSize,
		cellWidth: gridSize[0],
		cellHeight: gridSize[1],
		element: elementPosition,
	});

	const { handlePointerDown: handleDragPointerDown } = useDragInteraction({
		wrapperRef,
		element,
		grid,
		store: interactionStore,
		positioning,
	});

	const { handlePointerDown: handleResizePointerDown } = useResizeInteraction({
		wrapperRef,
		element,
		grid,
		store: interactionStore,
		positioning,
	});

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (e.button === 2) {
				if (!enableResize) {
					e.preventDefault();
					return;
				}
				handleResizePointerDown(e);
				return;
			}
			handleDragPointerDown(e);
		},
		[enableResize, handleDragPointerDown, handleResizePointerDown],
	);

	useEffect(() => {
		const runtime = runtimeRef.current;
		const wrapper = wrapperRef.current;
		if (!runtime || !wrapper) return;
		runtime.mount(wrapper);
		const unregisterSelection = runtime.registerPlugin(selectionPlugin);
		return () => {
			unregisterSelection();
			runtime.unmount();
		};
	}, []);

	useEffect(() => {
		const runtime = runtimeRef.current;
		if (!runtime) return;
		runtime.updateInput({
			element,
			grid: {
				cellWidth: grid.cellWidth,
				cellHeight: grid.cellHeight,
			},
			viewport: interactionStore.getViewport(),
			selection: {
				isSelected,
				isMultiSelected,
			},
		});
		runtime.dispatch(buildTickEvent());
	}, [element, grid.cellHeight, grid.cellWidth, interactionStore, isMultiSelected, isSelected]);

	const initialTransforms = useMemo(() => {
		return {
			"--offset-x": `${grid.offset.x}px`,
			"--offset-y": `${grid.offset.y}px`,
			"--width": `${grid.pixelSize.x}px`,
			"--height": `${grid.pixelSize.y}px`,
			transform: "translate3d(var(--offset-x), var(--offset-y), 0)",
			width: "var(--width)",
			height: "var(--height)",
			willChange: "auto",
		} as React.CSSProperties;
	}, [grid.offset.x, grid.offset.y, grid.pixelSize.x, grid.pixelSize.y]);

	return {
		wrapperRef,
		isSelected,
		isMultiSelected,
		initialTransforms,
		handlePointerDown,
	};
}
