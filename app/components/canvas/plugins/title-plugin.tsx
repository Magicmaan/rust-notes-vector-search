import React from "react";
import type { CanvasElementDefinition } from "./types";
import type { CanvasElementDisplay } from "@/types";
import CanvasElementBase from "../canvas-element-base";

function TitleContent({ element }: { element: CanvasElementDisplay<"title"> }) {
	const titleSize = element.content.sizePx ?? 48;
	const titleWeight = element.content.weight ?? 700;
	return (
		<CanvasElementBase
			element={element}
			enableResize={false}
			surfaceClassName="bg-transparent border-none rounded-none"
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
		</CanvasElementBase>
	);
}

export const titleElementDefinition: CanvasElementDefinition<
	CanvasElementDisplay<"title">
> = {
	variant: "title",
	canResize: () => false,
	render: ({ element }) => <TitleContent element={element} />,
};
