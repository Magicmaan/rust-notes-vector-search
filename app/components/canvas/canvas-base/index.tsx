import React from "react";
import { clsx } from "clsx";
import { useCallback, useEffect, useRef } from "react";
import Note from "@/components/note";
import { useEventBus, useEventListener } from "@/events";
import { useEditorGridStore } from "@/providers/editor/store";
import CanvasChromeOverlay from "./chrome-overlay";
import { useMarqueeSelection } from "./hooks/useMarqueeSelection";
import { applyCanvasBackgroundCssVariables } from "../elements/background/grid-background";
import { useCanvasPanEvents } from "./hooks/useCanvasPanEvents";
import { useCanvasZoomEvents } from "./hooks/useCanvasZoomEvents";
import { useSpacePanSession } from "./hooks/useSpacePanSession";

type ViewportSize = {
	width: number;
	height: number;
};

export default function Canvas({ children }: { children?: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	const transformRef = useRef<HTMLDivElement>(null);
	const lastViewportSizeRef = useRef<ViewportSize | null>(null);
	const gridSize = useEditorGridStore((s) => s.gridSize);
	const setViewportSize = useEditorGridStore((s) => s.setViewportSize);
	const elementIds = useEditorGridStore((s) => s.elementIds);

	const emit = useEventBus().emit;
	const { marqueeRect, handlePointerDownCapture } = useMarqueeSelection({
		containerRef: ref,
		transformRef,
	});

	useCanvasPanEvents({
		containerRef: ref,
		transformRef,
		gridSize,
	});

	useCanvasZoomEvents({
		containerRef: ref,
		transformRef,
		gridSize,
	});

	useSpacePanSession({
		containerRef: ref,
		emit,
	});

	const syncViewportSize = useCallback(() => {
		if (!ref.current) {
			return;
		}

		const nextSize = {
			width: ref.current.clientWidth,
			height: ref.current.clientHeight,
		};

		if (nextSize.width <= 0 || nextSize.height <= 0) {
			return;
		}

		const lastSize = lastViewportSizeRef.current;
		if (
			lastSize &&
			lastSize.width === nextSize.width &&
			lastSize.height === nextSize.height
		) {
			return;
		}

		lastViewportSizeRef.current = nextSize;
		setViewportSize(nextSize);
	}, [setViewportSize]);

	useEventListener("canvas:viewport:resize", () => {
		syncViewportSize();
	});

	useEffect(() => {
		syncViewportSize();
		if (!ref.current) {
			return;
		}

		const resizeObserver = new ResizeObserver(syncViewportSize);
		resizeObserver.observe(ref.current);

		const onWindowResize = () => {
			emit("canvas:viewport:resize", {
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		window.addEventListener("resize", onWindowResize);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", onWindowResize);
		};
	}, [emit, syncViewportSize]);

	// background is now managed by InfiniteBackground component

	const handleWheel = useCallback(
		(e: React.WheelEvent<HTMLDivElement>) => {
			if (!ref.current) {
				return;
			}

			const rect = ref.current.getBoundingClientRect();
			const pointerX = e.clientX - rect.left;
			const pointerY = e.clientY - rect.top;
			const stepCount = e.deltaY === 0 ? 0 : e.deltaY < 0 ? 1 : -1;
			emit("canvas:zoom:wheel", {
				pointerX,
				pointerY,
				stepCount,
			});
		},
		[emit],
	);

	// background is updated lazily via events but its applied on mount to ensure it has a good default.
	// see useCanvasPanEvents & useCanvasZoomEvents for updates on interaction
	useEffect(() => {
		const state = useEditorGridStore.getState();
		applyCanvasBackgroundCssVariables(
			ref.current,
			{
				zoomLevel: state.zoomLevel,
				offsetX: state.offsetX,
				offsetY: state.offsetY,
			},
			gridSize,
		);
	}, [gridSize]);

	// canvas zoom is handled through useCanvasZoomEvents, this updates the zoom lazily and puts it into css variables --zoom-level
	// this same mechanism is used for panning inside useCanvasPanEvents, where offsetX and offsetY are updated lazily and put into --grid-offset-x and --grid-offset-y

	return (
		<div className="h-full w-full relative overflow-visible pointer-events-auto">
			<div
				ref={ref}
				className={clsx(
					"h-full w-full relative bg-(--canvas-background) overflow-hidden thoughtspace-editor-grid",
				)}
				id="editor-grid-container"
				onWheel={handleWheel}
				onPointerDownCapture={handlePointerDownCapture}
				style={{
					touchAction: "none",
				}}
			>
				<div
					id="editor-grid-transform"
					ref={transformRef}
					className="absolute inset-0 left-0 top-0 w-full h-full overflow-visible"
					style={
						{
							transform: `translate3d(var(--grid-offset-x), var(--grid-offset-y), 0) scale(var(--zoom-level, 1))`,
							transformOrigin: "0 0",
							zIndex: 1,
							"--inverse-zoom": "calc(1 / (1 + var(--zoom-level, 1)))",
						} as React.CSSProperties
					}
				>
					<div className="w-auto h-auto">
						{elementIds.map((id) => (
							<Note id={id} key={id} fullscreen={false} />
						))}
					</div>
					{marqueeRect ? (
						<div
							className="pointer-events-none absolute z-15 rounded-[10px] border border-[color-mix(in_oklch,var(--accent-cool-400),white_18%)] [background:color-mix(in_oklch,var(--accent-cool-400),transparent_82%)] [box-shadow:0_0_0_1px_color-mix(in_oklch,var(--accent-cool-300),transparent_70%),inset_0_0_0_1px_color-mix(in_oklch,var(--accent-cool-300),transparent_78%)]"
							style={{
								left: `${marqueeRect.x}px`,
								top: `${marqueeRect.y}px`,
								width: `${marqueeRect.width}px`,
								height: `${marqueeRect.height}px`,
							}}
						/>
					) : null}
				</div>
				<CanvasChromeOverlay />
				{children}
			</div>
		</div>
	);
}
