import React from "react";
import type { CanvasElementDisplay } from "@/types";
import CanvasElementFrame from "../canvas-element/frame";

type CanvasTitleElementProps = {
	element: CanvasElementDisplay<"title">;
};

export default function CanvasTitleElement({
	element,
}: CanvasTitleElementProps) {
	const titleSize = element.content.sizePx ?? 48;
	const titleWeight = element.content.weight ?? 700;

	return (
		<CanvasElementFrame
			element={element}
			enableResize={false}
			surfaceClassName="bg-transparent border-none rounded-none "
			frameClassName="z-10"
			surfaceStyle={{
				outline: "none",
				border: "none",
				background: "transparent",
				overflow: "visible",
			}}
		>
			<div className="h-full w-full flex items-start overflow-visible">
				<h2
					className="leading-[0.95] tracking-tight text-foreground-bold whitespace-nowrap overflow-visible"
					style={{
						fontSize: `${titleSize}px`,
						fontWeight: titleWeight,
						margin: 0,
						padding: 0,
						background: "transparent",
						transform: "scale(var(--inverse-zoom))",
						transformOrigin: "center",
					}}
				>
					{element.content.text}
				</h2>
			</div>
		</CanvasElementFrame>
	);
}
