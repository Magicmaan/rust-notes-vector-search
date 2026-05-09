import React from "react";
import { clsx } from "clsx";
import { useCallback, useEffect, useRef } from "react";
import Note from "@/components/note";
import { useEditorGridStore } from "@/providers/editor/store";
import CanvasChromeOverlay from "./chrome-overlay";
import { useCanvasRuntime } from "./hooks/useCanvasRuntime";
import CanvasGridBackgroundElement from "../elements/background";
import { getChildrenWithData } from "@/lib/utils/utils";

type ViewportSize = {
	width: number;
	height: number;
};

// The Canvas element renders the canvas state
export default function Canvas({ children }: { children?: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	const transformRef = useRef<HTMLDivElement>(null);
	const lastViewportSizeRef = useRef<ViewportSize | null>(null);
	const gridSize = useEditorGridStore((s) => s.gridSize);
	const setViewportSize = useEditorGridStore((s) => s.setViewportSize);
	const elementIds = useEditorGridStore((s) => s.elementIds);

	const runtimeSnapshot = useCanvasRuntime({
		containerRef: ref,
		transformRef,
		gridSize,
	});

	// get children with data attribute layer
	const [baseLayerChildren, overlayLayerChildren] = React.useMemo(() => {
		const base: React.ReactNode[] = [];
		const overlay: React.ReactNode[] = [];

		const [overlayLayerChildren, remainingChildren] = getChildrenWithData(
			children,
			"data-layer",
			"1",
		);

		base.push(...remainingChildren);
		overlay.push(...overlayLayerChildren);

		return [base, overlay];
	}, [children]);

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

	useEffect(() => {
		syncViewportSize();
		if (!ref.current) {
			return;
		}

		const resizeObserver = new ResizeObserver(syncViewportSize);
		resizeObserver.observe(ref.current);

		const onWindowResize = () => syncViewportSize();

		window.addEventListener("resize", onWindowResize);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", onWindowResize);
		};
	}, [syncViewportSize]);

	return (
		<div className="h-full w-full relative overflow-visible pointer-events-auto">
			{/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
			<div
				ref={ref}
				className={clsx(
					"h-full w-full relative bg-(--canvas-background) overflow-hidden",
				)}
				id="editor-grid-container"
				onContextMenu={(event) => {
					event.preventDefault();
				}}
				style={{
					touchAction: "none",
				}}
			>
				<CanvasGridBackgroundElement />
				<div
					id="editor-grid-transform"
					ref={transformRef}
					className="absolute inset-0 left-0 top-0 w-full h-full overflow-visible"
					style={
						{
							transform: `translate3d(var(--grid-offset-x), var(--grid-offset-y), 0) scale(var(--zoom-level, 1))`,
							transformOrigin: "0 0",
							zIndex: 1,
							"--inverse-zoom": "calc(1 / var(--zoom-level, 1))",
						} as React.CSSProperties
					}
				>
					<div className="w-auto h-auto">
						{elementIds.map((id) => (
							<Note id={id} key={id} fullscreen={false} />
						))}
					</div>
					{runtimeSnapshot.marqueeRect ? (
						<div
							className="pointer-events-none absolute z-15 rounded-[10px] border border-[color-mix(in_oklch,var(--accent-cool-400),white_18%)] [background:color-mix(in_oklch,var(--accent-cool-400),transparent_82%)] [box-shadow:0_0_0_1px_color-mix(in_oklch,var(--accent-cool-300),transparent_70%),inset_0_0_0_1px_color-mix(in_oklch,var(--accent-cool-300),transparent_78%)]"
							style={{
								left: `${runtimeSnapshot.marqueeRect.x}px`,
								top: `${runtimeSnapshot.marqueeRect.y}px`,
								width: `${runtimeSnapshot.marqueeRect.width}px`,
								height: `${runtimeSnapshot.marqueeRect.height}px`,
							}}
						/>
					) : null}
				</div>
				<CanvasChromeOverlay />
				{baseLayerChildren}
				<div className="absolute inset-0 z-[120] pointer-events-none">
					<div
						className={clsx(
							"h-full w-full transition-opacity duration-200 hover:opacity-60",
							overlayLayerChildren.length > 0
								? "pointer-events-auto"
								: "pointer-events-none",
						)}
					>
						{overlayLayerChildren}
					</div>
				</div>
			</div>
		</div>
	);
}
