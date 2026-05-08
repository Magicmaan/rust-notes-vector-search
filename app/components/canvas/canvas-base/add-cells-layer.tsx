import React from "react";
import { useCallback, useMemo } from "react";
import { NoteDisplay, type Note as NoteType } from "@/types";
import { useEditorGridStore } from "@/providers/editor/store";
import { useSettingsStore } from "@/providers/settings/store";
import { getStaticAddCells } from "./static-cells";
import { AnimatePresence, motion } from "motion/react";
const DEFAULT_PLACEHOLDER_NOTE_SPAN = 1;

export function AddCellButton({
	x,
	y,
	gridSize,
	onAdd,
}: {
	x: number;
	y: number;
	gridSize: [number, number];
	onAdd: (x: number, y: number) => void;
}) {
	return (
		<AnimatePresence mode={"wait"}>
			<motion.button
				exit={{ opacity: 0, scale: 0.0 }}
				type="button"
				onMouseDown={(e) => e.stopPropagation()}
				onClick={(e) => {
					e.stopPropagation();
					onAdd(x, y);
				}}
				className="absolute pointer-events-auto text-foreground-normal text-xs leading-none p-1 flex animate-bounce-fade-in ease-in"
				style={{
					left: `${x * gridSize[0]}px`,
					top: `${y * gridSize[1]}px`,
					height: gridSize[1],
					width: gridSize[0],
				}}
			>
				<div className="w-full h-full flex-1 border border-dashed border-foreground-muted/60 bg-background-200/20 rounded-xl opacity-70 flex items-center justify-center">
					<span className="text-foreground-muted/90 text-3xl leading-none">+</span>
				</div>
			</motion.button>
		</AnimatePresence>
	);
}

function createId() {
	return (
		globalThis.crypto?.randomUUID?.() ??
		`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
	);
}

export default function AddCellsLayer() {
	const gridSize = useEditorGridStore((s) => s.gridSize);
	const elements = useEditorGridStore((s) => s.elements);
	const elementsVersion = useEditorGridStore((s) => s.elementsVersion);
	const addElement = useEditorGridStore((s) => s.addElement);
	const isAreaFree = useEditorGridStore((s) => s.isAreaFree);
	const defaultNoteColor = useSettingsStore((s) => s.settings.defaultNoteColor);

	const staticAddCells = useMemo(() => {
		if (elementsVersion < 0) {
			return [];
		}

		return getStaticAddCells(elements);
	}, [elements, elementsVersion]);

	const addPlaceholderAtCell = useCallback(
		(x: number, y: number) => {
			if (
				!isAreaFree(
					x,
					y,
					DEFAULT_PLACEHOLDER_NOTE_SPAN,
					DEFAULT_PLACEHOLDER_NOTE_SPAN,
				)
			) {
				return;
			}

			const id = createId();
			const now = new Date();
			const placeholderNote: NoteType = {
				id,
				title: "Placeholder Note",
				content: "Placeholder content",
				createdAt: now,
				updatedAt: now,
			};
			let noteWidthCells = DEFAULT_PLACEHOLDER_NOTE_SPAN;

			if (x % 2 === 0) {
				noteWidthCells = 2;
			}
			addElement(
				new NoteDisplay({
					x,
					y,
					width: noteWidthCells,
					height: DEFAULT_PLACEHOLDER_NOTE_SPAN,
					note: placeholderNote,
					backgroundColor: defaultNoteColor,
				}),
			);
		},
		[addElement, defaultNoteColor, isAreaFree],
	);

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			data-elements-version={elementsVersion}
		>
			{staticAddCells.map((cell) => (
				<AddCellButton
					key={`${cell.x}-${cell.y}`}
					x={cell.x}
					y={cell.y}
					gridSize={gridSize}
					onAdd={addPlaceholderAtCell}
				/>
			))}
		</div>
	);
}
