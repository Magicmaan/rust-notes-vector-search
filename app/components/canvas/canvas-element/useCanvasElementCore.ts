import { useCallback, useEffect, useMemo, useRef } from "react";
import type { AnyCanvasElementDisplay } from "@/types";
import { useEditorGridStore } from "@/providers/editor/store";
import { useShallow } from "zustand/react/shallow";
import { useGridMetrics } from "./hooks/useGridMetrics";

function isCanvasLockoutActive(node: HTMLDivElement | null) {
	if (!node) return false;
	const container = node.closest("#editor-grid-container");
	return container?.getAttribute("data-canvas-lockout") === "true";
}

export function useCanvasElementCore(
	element: AnyCanvasElementDisplay,
	options?: { enableResize?: boolean },
) {
	const wrapperRef = useRef<HTMLDivElement>(null);

	const selectedNoteIds = useEditorGridStore((s) => s.selectedNoteIds);
	const setSelectedNoteIds = useEditorGridStore((s) => s.setSelectedNoteIds);
	const isSelected = selectedNoteIds.includes(element.id);
	const isMultiSelected = isSelected && selectedNoteIds.length > 1;

	const { gridSize } = useEditorGridStore(
		useShallow((s) => ({
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

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (isCanvasLockoutActive(wrapperRef.current)) {
				e.preventDefault();
				return;
			}
			if (e.button !== 0) {
				return;
			}
			if (e.shiftKey) {
				if (isSelected) {
					setSelectedNoteIds(selectedNoteIds.filter((id) => id !== element.id));
					return;
				}
				setSelectedNoteIds([...selectedNoteIds, element.id]);
				return;
			}
			if (!isSelected || selectedNoteIds.length > 1) {
				setSelectedNoteIds([element.id]);
			}
		},
		[element.id, isSelected, selectedNoteIds, setSelectedNoteIds],
	);

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

	useEffect(() => {
		if (!wrapperRef.current) return;
		wrapperRef.current.dataset.resizable = options?.enableResize === false ? "false" : "true";
	}, [options?.enableResize]);

	return {
		wrapperRef,
		isSelected,
		isMultiSelected,
		initialTransforms,
		handlePointerDown,
	};
}
