import React from "react";
import { useEditorGridStore } from "@/providers/editor/store";
import { memo, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import type { NoteDisplay } from "@/types";
import NotePreview from "@/components/note/preview";
import NoteHeader from "./header";
import NoteContent from "./content";
import { ScrollArea } from "../ui/scroll-area";
import { Close as X } from "@project-lary/react-material-symbols-400-rounded";

type NoteProps = {
	id?: string;
	fullscreen: boolean;
};

function Note({ id: _id, fullscreen }: NoteProps) {
	const params = useParams();
	const id = _id || params.id;
	const selectElement = useCallback(
		(
			s: ReturnType<typeof useEditorGridStore.getState>,
		): NoteDisplay | undefined => (id ? s.elements[id] : undefined),
		[id],
	);

	const elem = useEditorGridStore(selectElement);
	const nav = useNavigate();
	if (!id) {
		console.error("No note ID provided");
		return null;
	}
	if (!elem) {
		console.error(`No note found with ID: ${id}`);
		return null;
	}

	if (!fullscreen) {
		return <NotePreview element={elem} />;
	}
	return (
		<div
			className="w-full h-full max-h-full flex flex-col items-center justify-center fullscreen-note note relative rounded-lg pt-8 gap-4"
			id={`note-${id}`}
			key={id}
		>
			<div className="flex flex-1 w-full">
				<button
					type="button"
					className="bg-background-100 text-foreground-bold p-2 rounded pointer-events-auto cursor-pointer w-min flex items-end justify-end"
					onClick={() => nav("/editor")}
				>
					<X className="size-5" />
				</button>
			</div>
			<NoteHeader />
			<ScrollArea className={"text-2xl overflow-clip"}>
				<div className="bg-background-500 rounded-lg p-4">
					<NoteContent />
				</div>
			</ScrollArea>
		</div>
	);
}

export default memo(Note);
