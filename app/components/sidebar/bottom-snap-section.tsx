import React from "react";
import { DEFAULT_NOTE_COLORS } from "./constants";

type SidebarBottomSnapSectionProps = {
	defaultNoteColor: string;
	onSetDefaultNoteColor: (color: string) => void;
	error: string | null;
};

export function SidebarBottomSnapSection({
	defaultNoteColor,
	onSetDefaultNoteColor,
	error,
}: SidebarBottomSnapSectionProps) {
	return (
		<div className="mt-auto pt-4">
			<div className="px-1 text-sm flex flex-col gap-2">
				<span className="text-[13px] text-foreground-muted">Default note color</span>
				<div className="flex flex-wrap gap-2">
					{DEFAULT_NOTE_COLORS.map((color) => {
						const isActive = defaultNoteColor === color;
						return (
							<button
								type="button"
								key={color}
								onClick={() => onSetDefaultNoteColor(color)}
								aria-label={`Set default note color to ${color}`}
								className={
									isActive
										? "size-6 rounded-md border-2 border-foreground-normal shadow-[0_0_0_2px_color-mix(in_oklch,var(--accent-cool-400),transparent_55%)]"
										: "size-6 rounded-md border border-foreground-muted/60"
								}
								style={{ backgroundColor: color }}
							/>
						);
					})}
				</div>
			</div>

			{error ? (
				<div className="mt-3 break-words rounded-md border border-red-400/40 bg-red-500/10 px-2 py-1.5 text-xs text-red-200">
					{error}
				</div>
			) : null}
		</div>
	);
}
