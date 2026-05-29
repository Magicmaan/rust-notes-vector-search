import clsx from "clsx";
import React from "react";
import type { AnyCanvasElementDisplay } from "@/types";
import { useCanvasElementCore } from "../canvas-element/useCanvasElementCore";

export type CanvasElementBaseProps = {
	element: AnyCanvasElementDisplay;
	enableResize?: boolean;
	resizeState?: string;
	resizeHeading?: "none" | "left" | "right" | "top" | "bottom";
	frameClassName?: string;
	surfaceClassName?: string;
	surfaceStyle?: React.CSSProperties;
	tools?: React.ReactNode;
	children: React.ReactNode;
};

export default function CanvasElementBase({
	element,
	enableResize = true,
	resizeState = "none",
	resizeHeading = "none",
	frameClassName,
	surfaceClassName,
	surfaceStyle,
	tools,
	children,
}: CanvasElementBaseProps) {
	const {
		wrapperRef,
		isSelected,
		isMultiSelected,
		initialTransforms,
	} = useCanvasElementCore(element, { enableResize });

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: pointer handling is owned by runtime hooks
		<div
			ref={wrapperRef}
			className={clsx(
				"absolute canvas-element-wrapper flex p-1 group",
				frameClassName,
			)}
			id={`canvas-element-${element.id}`}
			data-canvas-element={element.variant}
			data-canvas-element-id={element.id}
			onDragStart={(e) => e.preventDefault()}
			data-dragging="false"
			data-selected={isSelected}
			data-multi-selected={isMultiSelected}
			data-resizing={resizeState}
			data-resize-heading={resizeHeading}
			data-element-kind={element.variant}
			data-element-state="default"
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
			<div
				className={clsx(
					"group pointer-events-auto canvas-element-content w-full h-full flex-1",
					surfaceClassName,
				)}
				style={surfaceStyle}
			>
				{children}
			</div>
			{tools}
		</div>
	);
}
