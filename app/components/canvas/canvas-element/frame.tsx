import clsx from "clsx";
import React from "react";
import type { AnyCanvasElementDisplay } from "@/types";
import { useCanvasElementCore } from "./useCanvasElementCore";
import { getChildrenWithType } from "@/lib/utils/utils";
import NoteMenubar from "@/components/note/menubar";

export type CanvasElementFrameProps = {
	element: AnyCanvasElementDisplay;
	enableResize?: boolean;
	frameClassName?: string;
	surfaceClassName?: string;
	surfaceStyle?: React.CSSProperties;
	children: React.ReactNode;
};

export default function CanvasElementFrame({
	element,
	enableResize = true,
	frameClassName,
	surfaceClassName,
	surfaceStyle,
	children,
}: CanvasElementFrameProps) {
	const {
		wrapperRef,
		isSelected,
		isMultiSelected,
		initialTransforms,
		handlePointerDown,
	} = useCanvasElementCore(element, { enableResize });

	const [menubar, remainingChildren] = getChildrenWithType(
		children,
		NoteMenubar,
	);

	return (
		// biome-ignore lint/a11y/useFocusableInteractive: <explanation>
		<div
			ref={wrapperRef}
			role="button"
			className={clsx(
				"absolute canvas-element-wrapper flex p-1 group",
				frameClassName,
			)}
			id={`note-${element.id}`}
			data-canvas-element={element.variant}
			onPointerDown={handlePointerDown}
			onDragStart={(e) => e.preventDefault()}
			data-dragging="false"
			data-selected={isSelected}
			data-multi-selected={isMultiSelected}
			data-resizing="none"
			data-card-kind={element.variant}
			data-card-state="default"
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
					"group pointer-events-auto  canvas-element-content w-full h-full flex-1",
					surfaceClassName,
				)}
				style={surfaceStyle}
			>
				{remainingChildren}
			</div>
			{menubar}
		</div>
	);
}
