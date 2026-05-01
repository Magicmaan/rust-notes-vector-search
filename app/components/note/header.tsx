import React from "react";
import { useRef } from "react";

export default function NoteHeader() {
	const ref = useRef<HTMLDivElement>(null);
	return (
		<div
			ref={ref}
			className="w-full h-1/3 rounded-md flex flex-col top-0 text-foreground-bold left-0"
		>
			<h3>A Note</h3>
			AHHH
		</div>
	);
}
