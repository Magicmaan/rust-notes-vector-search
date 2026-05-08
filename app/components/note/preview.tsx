import { clsx } from "clsx";
import { useCallback, useMemo, useRef } from "react";
import type { NoteDisplay } from "../../types";
import { useEditorGridStore } from "@/providers/editor/store";
import { useShallow } from "zustand/react/shallow";
import NoteMenubar from "./menubar";
import { useGridMetrics } from "./hooks/useGridMetrics";
import { usePositionRendering } from "./hooks/usePositionRendering";
import { useDragInteraction } from "./hooks/useDragInteraction";
import { useResizeInteraction } from "./hooks/useResizeInteraction";
import { useExpandNavigation } from "./hooks/useExpandNavigation";
import {
	BarChart as BarChart3,
	Help as CircleHelp,
	Lightbulb,
	Map as MapPinned,
	Edit as PenLine,
	Balance as Scale,
	StarShine as Sparkles,
	MyLocation as Target,
	Warning as TriangleAlert,
	Person as UserRound,
} from "@project-lary/react-material-symbols-400-rounded";
import {
	getThoughtSpaceCardMock,
	type CanvasCardIconKey,
} from "@/components/canvas/mock-cards";
import React from "react";
import Editor from "./editor";

const CARD_ICON_MAP: Record<
	CanvasCardIconKey,
	React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
	target: Target,
	user: UserRound,
	lightbulb: Lightbulb,
	chart: BarChart3,
	scale: Scale,
	roadmap: MapPinned,
	warning: TriangleAlert,
	spark: Sparkles,
	pen: PenLine,
	question: CircleHelp,
};

export default function NotePreview({ element }: { element: NoteDisplay }) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const selectedNoteIds = useEditorGridStore((s) => s.selectedNoteIds);
	const isSelected = selectedNoteIds.includes(element.id);
	const isMultiSelected = isSelected && selectedNoteIds.length > 1;

	const { updateElement, isAreaFree, findNearestFree, gridSize, other } =
		useEditorGridStore(
			useShallow((s) => ({
				updateElement: s.updateElement,
				isAreaFree: s.isAreaFree,
				findNearestFree: s.findNearestFree,
				gridSize: s.gridSize,
				other: s.helpers,
			})),
		);

	// Grid calculations: cell dimensions, zoom, pixel positions
	const grid = useGridMetrics({
		gridSizeWidth: gridSize[0],
		gridSizeHeight: gridSize[1],
		elementWidth: element.width,
		elementHeight: element.height,
		elementX: element.x,
		elementY: element.y,
	});

	const transformedGridPosition = other.toGridOffset(element.x, element.y);
	const transformedgridSize = other.toGridSize(element.width, element.height);

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

	// Position rendering: DOM updates and RAF scheduling
	const positioning = usePositionRendering({
		wrapperRef,
		pixelSize: grid.pixelSize,
		cellWidth: gridSize[0],
		cellHeight: gridSize[1],
		element: elementPosition,
	});

	// Drag interaction: pointer events, snapping, collision detection
	const { handlePointerDown: handleDragPointerDown } = useDragInteraction({
		wrapperRef,
		element,
		grid,
		store: interactionStore,
		positioning,
	});

	// Resize interaction: pointer events, dimension snapping, collision detection
	const { handlePointerDown: handleResizePointerDown } = useResizeInteraction({
		wrapperRef,
		element,
		grid,
		store: interactionStore,
		positioning,
	});

	// Combined pointer handler: left-click (button 0) for drag, right-click (button 2) for resize
	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			// Right-click triggers resize
			if (e.button === 2) {
				handleResizePointerDown(e);
			} else {
				// Left-click or other buttons trigger drag positioning
				handleDragPointerDown(e);
			}
		},
		[handleDragPointerDown, handleResizePointerDown],
	);

	// Navigation: double-click to expand
	const expandNav = useExpandNavigation(element.id);
	const mockCard = useMemo(
		() => getThoughtSpaceCardMock(element.id),
		[element.id],
	);
	const mockIcon = mockCard ? CARD_ICON_MAP[mockCard.icon] : null;
	const MockIcon = mockIcon;
	const isRoadmapCard = mockCard?.kind === "roadmap";

	// biome-ignore lint/correctness/useExhaustiveDependencies: Events should handle
	const initialTransforms = useMemo(() => {
		const transforms = {
			"--offset-x": `${grid.offset.x}px`,
			"--offset-y": `${grid.offset.y}px`,
			"--width": `${grid.pixelSize.x}px`,
			"--height": `${grid.pixelSize.y}px`,
			transform: `translate3d(var(--offset-x), var(--offset-y), 0)`,
			width: `var(--width)`,
			height: `var(--height)`,
			willChange: "auto",
		} as React.CSSProperties;
		return transforms;
	}, []);

	return (
		// biome-ignore lint/a11y/useFocusableInteractive: <explanation>
		// biome-ignore lint/a11y/useSemanticElements: <explanation>
		<div
			ref={wrapperRef}
			role="button"
			className={clsx(
				"absolute note flex p-1 group",
				isRoadmapCard && "ts-note-roadmap",
			)}
			id={`note-${element.id}`}
			onPointerDown={handlePointerDown}
			onDragStart={(e) => e.preventDefault()}
			data-dragging="false"
			data-selected={isSelected}
			data-multi-selected={isMultiSelected}
			data-resizing="none"
			data-card-kind={mockCard?.kind ?? "text"}
			data-card-state={mockCard?.state ?? "default"}
			style={
				{
					...initialTransforms,

					"--background": element.backgroundColor ?? "var(--note-default)",
					"--border-radius": "var(--note-default-border-radius)",
					"--border": "color-mix(in oklch, var(--background), white 50%)",
					"--border-highlight": "color-mix(in oklch, var(--border), white 50%)",
					"--background-hover": element.backgroundColor
						? `color-mix(in oklch, ${element.backgroundColor}, white 8%)`
						: "var(--note-default-hover)",
					"--background-active": element.backgroundColor
						? `color-mix(in oklch, ${element.backgroundColor}, white 20%)`
						: "var(--note-default-active)",
					"--border-active":
						"color-mix(in oklch, var(--accent-cool-400), var(--border) 55%)",
					"--border-highlight-active":
						"color-mix(in oklch, var(--border-active), white 50%)",
					userSelect: "none",
					WebkitUserSelect: "none",
				} as React.CSSProperties
			}
		>
			<button
				type="button"
				onDoubleClick={expandNav.onDoubleClick}
				className={clsx(
					"group select-none pointer-events-auto z-100 note-surface",
					"w-full h-full flex-1",
					"transition-[colors,border, outline] duration-200",
					"bg-(--background) rounded-(--border-radius) border-border border-t-(--border-highlight) ",
					// group multi select styles
					"outline-4 outline-transparent",
					"group-data-[selected=true]:outline-4 group-data-[selected=true]:outline-offset-4 group-data-[selected=true]:outline-[#0000ff]",
				)}
				style={{
					borderWidth: "calc(8px * var(--inverse-zoom))",
				}}
				key={element.id}
				id={`note-${element.id}`}
			>
				<div
					className="note-surface-content flex h-full flex-col gap-2 p-4 font-['Manrope','Avenir_Next','SF_Pro_Display','Segoe_UI',sans-serif] text-start"
					style={{
						anchorName: "--rvh",
					}}
				>
					<Editor note={element} preview />
				</div>
			</button>

			<NoteMenubar element={element} />
		</div>
	);
}
