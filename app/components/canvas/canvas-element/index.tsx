import type { AnyCanvasElementDisplay, NoteDisplay } from "@/types";
import CanvasNoteElement from "@/components/canvas/elements/note";
import CanvasTitleElement from "@/components/canvas/elements/title";
import React from "react";

type CanvasElementRendererProps = {
	element: AnyCanvasElementDisplay;
};

export default function CanvasElementRenderer({
	element,
}: CanvasElementRendererProps) {
	switch (element.variant) {
		case "title":
			return <CanvasTitleElement element={element} />;
		case "note":
			return <CanvasNoteElement element={element as NoteDisplay} />;
	}
}
