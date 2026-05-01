import { Note, NoteDisplay } from "@/app/types";
import React from "react";

interface NoteContextType {
	note: Note | null;
	setNote: React.Dispatch<React.SetStateAction<Note | null>>;
	updateNoteContent: (content: string) => void;
	updateNoteTitle: (title: string) => void;

	loadNote: (id: Note) => void;
}

const NoteContext = React.createContext<NoteContextType | undefined>(undefined);

export default function NoteContextProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [note, setNote] = React.useState<Note | null>(null);

	const updateNoteContent = (content: string) => {
		setNote((prev) =>
			prev ? { ...prev, content, updatedAt: new Date() } : null,
		);
	};

	const updateNoteTitle = (title: string) => {
		setNote((prev) =>
			prev ? { ...prev, title, updatedAt: new Date() } : null,
		);
	};

	const loadNote = (note: Note) => {
		setNote(note);
	};

	return (
		<NoteContext.Provider
			value={{ note, setNote, updateNoteContent, updateNoteTitle, loadNote }}
		>
			{children}
		</NoteContext.Provider>
	);
}
