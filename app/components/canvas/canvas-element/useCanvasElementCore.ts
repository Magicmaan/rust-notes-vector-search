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
import type { ElementRuntimeEvent } from "./runtime/types";

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

function buildRuntimePointerEvent(
	kind: ElementRuntimeEvent["kind"],
	e: React.PointerEvent<HTMLDivElement> | PointerEvent,
): ElementRuntimeEvent {
	return {
		kind,
		pointerId: e.pointerId,
		clientX: e.clientX,
		clientY: e.clientY,
		button: e.button,
		shiftKey: e.shiftKey,
		ctrlKey: e.ctrlKey,
		metaKey: e.metaKey,
		altKey: e.altKey,
		target: e.target,
		timestamp: e.timeStamp,
	};
}

function buildRuntimeBlurEvent(): ElementRuntimeEvent {
	return {
		kind: "blur",
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

function isCanvasLockoutActive(node: HTMLDivElement | null) {
	if (!node) return false;
	const container = node.closest("#editor-grid-container");
	return container?.getAttribute("data-canvas-lockout") === "true";
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

	const {
		updateElement,
		isAreaFree,
		findOccupyingIds,
		findNearestFree,
		getElement,
		gridSize,
	} =
		useEditorGridStore(
			useShallow((s) => ({
				updateElement: s.updateElement,
				isAreaFree: s.isAreaFree,
				findOccupyingIds: s.findOccupyingIds,
				findNearestFree: s.findNearestFree,
				getElement: s.getElement,
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
				return {
					isPanning: state.isPanning,
					zoomLevel: state.zoomLevel,
					lockout: isCanvasLockoutActive(wrapperRef.current),
				};
			},
			updateElement,
			isAreaFree,
			findOccupyingIds,
			findNearestFree,
			getElement,
		}),
		[findNearestFree, findOccupyingIds, getElement, isAreaFree, updateElement],
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
			const runtime = runtimeRef.current;
			runtime?.dispatch(buildRuntimePointerEvent("pointerDown", e));
			if (isCanvasLockoutActive(wrapperRef.current)) {
				e.preventDefault();
				return;
			}
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
		const onPointerUp = (event: PointerEvent) =>
			runtime.dispatch(buildRuntimePointerEvent("pointerUp", event));
		const onPointerCancel = (event: PointerEvent) =>
			runtime.dispatch(buildRuntimePointerEvent("pointerCancel", event));
		const onBlur = () => runtime.dispatch(buildRuntimeBlurEvent());
		window.addEventListener("pointerup", onPointerUp, true);
		window.addEventListener("pointercancel", onPointerCancel, true);
		window.addEventListener("blur", onBlur, true);
		return () => {
			window.removeEventListener("pointerup", onPointerUp, true);
			window.removeEventListener("pointercancel", onPointerCancel, true);
			window.removeEventListener("blur", onBlur, true);
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
