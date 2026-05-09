import React, { useMemo } from "react";
import type { NoteDisplay } from "@/types";
import NoteMenubar from "@/components/note/menubar";
import { getThoughtSpaceCardMock } from "../canvas-base/mock-cards";
import CanvasElementFrame from "../canvas-element/frame";
import Editor from "@/components/note/editor";
import clsx from "clsx";

type CanvasNoteElementProps = {
	element: NoteDisplay;
};

export default function CanvasNoteElement({ element }: CanvasNoteElementProps) {
	const mockCard = useMemo(
		() => getThoughtSpaceCardMock(element.id),
		[element.id],
	);
	const isRoadmapCard = mockCard?.kind === "roadmap";

	return (
		<CanvasElementFrame
			element={element}
			frameClassName={clsx(isRoadmapCard && "ts-note-roadmap")}
			surfaceClassName={clsx(
				"select-none",
				"transition-[colors,border,outline] duration-200",
				"bg-(--background) rounded-(--border-radius) border-border border-t-(--border-highlight)",
				"outline-4 outline-transparent",
				"group-data-[selected=true]:outline-4 group-data-[selected=true]:outline-offset-4 group-data-[selected=true]:outline-[#0000ff]",
			)}
			surfaceStyle={{
				borderWidth: "calc(8px * var(--inverse-zoom))",
			}}
		>
			<NoteMenubar element={element} />
			<div
				className="canvas-element-content-content flex h-full flex-col gap-2 p-4 font-['Manrope','Avenir_Next','SF_Pro_Display','Segoe_UI',sans-serif] text-start"
				style={{ anchorName: "--rvh" }}
			>
				<Editor note={element} preview />
			</div>
		</CanvasElementFrame>
	);
}
