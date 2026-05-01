import React from "react";
import { useRef } from "react";
import Editor from "./editor";

export default function NoteContent() {
	return (
		<div className="w-full h-full overflow-clip overflow-x-hidden">
			<Editor />
		</div>
	);
}
