import React, { useMemo } from "react";
import type { CanvasElementDefinition, CanvasUIPlugin } from "./types";
import type { NoteDisplay } from "@/types";
import NoteMenubar from "@/components/note/menubar";
import Editor from "@/components/note/editor";
import clsx from "clsx";
import { getThoughtSpaceCardMock } from "../canvas-base/mock-cards";
import CanvasElementBase from "../canvas-element-base";

function NoteContent({
	element,
	tools,
}: {
	element: NoteDisplay;
	tools: React.ReactNode;
}) {
	const mockCard = useMemo(
		() => getThoughtSpaceCardMock(element.id),
		[element.id],
	);
	const isRoadmapCard = mockCard?.kind === "roadmap";
	return (
		<CanvasElementBase
			element={element}
			enableResize
			frameClassName={clsx(isRoadmapCard && "ts-note-roadmap")}
			surfaceClassName={clsx(
				"select-none",
				"transition-[colors,border,outline] duration-200",
				"bg-(--background) rounded-(--border-radius) border-border border-t-(--border-highlight)",
				"outline-4 outline-transparent",
				"group-data-[selected=true]:outline-4 group-data-[selected=true]:outline-offset-4 group-data-[selected=true]:outline-[#0000ff]",
			)}
			surfaceStyle={{ borderWidth: "calc(8px * var(--inverse-zoom))" }}
			tools={tools}
		>
			<div
				className="canvas-element-content-content flex h-full flex-col gap-2 p-4 font-['Manrope','Avenir_Next','SF_Pro_Display','Segoe_UI',sans-serif] text-start"
				style={{ anchorName: "--rvh" }}
			>
				<Editor note={element} preview />
			</div>
		</CanvasElementBase>
	);
}

export const noteElementDefinition: CanvasElementDefinition<NoteDisplay> = {
	variant: "note",
	canResize: (_element, options) => options?.enableResize ?? true,
	render: ({ element, tools }) => (
		<NoteContent element={element} tools={tools} />
	),
};

export const noteUIPlugin: CanvasUIPlugin<NoteDisplay> = {
	variant: "note",
	renderTools: ({ element }) => <NoteMenubar element={element} />,
};
