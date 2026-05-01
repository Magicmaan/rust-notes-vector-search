import React from "react";
import { useState } from "react";
import type { ComponentType } from "react";
import { useEditorGridStore } from "@/providers/editor/store";
import GridSettingsMenu from "./grid-settings-menu";
import DragValueControl from "./zoom-control";
import {
	Add,
	Grid3x3,
	Mouse,
	PanTool,
	Redo,
	Square,
	Undo,
} from "@project-lary/react-material-symbols-400-rounded";
type ToolKey = "pointer" | "hand" | "grid" | "shape" | "link";

const TOOLBAR_TOOLS: Array<{
	key: ToolKey;
	icon: ComponentType<{ className?: string }>;
}> = [
	{ key: "pointer", icon: Mouse },
	{ key: "hand", icon: PanTool },
	{ key: "grid", icon: Grid3x3 },
	{ key: "shape", icon: Square },
	{ key: "link", icon: Add },
];

export default function CanvasChromeOverlay() {
	const zoomLevel = useEditorGridStore((s) => s.zoomLevel);
	const setZoomLevelFromCentre = useEditorGridStore(
		(s) => s.setZoomLevelFromCentre,
	);

	const [activeTool, setActiveTool] = useState<ToolKey>("pointer");
	const [showMinimap, setShowMinimap] = useState(true);

	return (
		<div className="pointer-events-none absolute inset-0 z-20 isolate [--ts-edge-gap:20px]">
			<div className="pointer-events-auto absolute right-(--ts-edge-gap) top-(--ts-edge-gap) flex flex-row items-end gap-2">
				<div className="rounded-md border border-border bg-background-400 has-[button:active]:bg-background-300 has-[button:active]:animate-scale-bounce p-2 px-2.5 h-10 flex flex-row items-center gap-2 text-foreground-muted font-semibold">
					<button
						aria-label="Undo (Ctrl+Z)"
						title="Undo (Ctrl+Z)"
						type="button"
						className="hover:text-foreground transition-all duration-300 group active:animate-scale-bounce cursor-pointer"
					>
						<Undo className="size-5" />
					</button>
					<span className="w-px bg-debug-2 h-full" />
					<button
						aria-label="Redo (Ctrl+Shift+Z)"
						title="Redo (Ctrl+Shift+Z)"
						type="button"
						className="hover:text-foreground transition-all duration-300 group active:animate-scale-bounce cursor-pointer"
					>
						<Redo className="size-5" />
					</button>
				</div>
				<DragValueControl
					decimalPrecision={0}
					value={zoomLevel}
					onChange={(value) => {
						requestAnimationFrame(() => {
							setZoomLevelFromCentre(value);
						});
					}}
					asChild
				>
					<button
						type="button"
						className="rounded-md border border-border bg-background-400 backdrop-blur-sm p-2 px-2.5 h-10 text-foreground-muted font-semibold hover:text-foreground transition-all duration-300 data-[dragging=true]:animate-scale-bounce data-[dragging=true]:border-border-light data-[dragging=true]:bg-background-300"
					>
						{Math.round(zoomLevel * 100)}%
					</button>
				</DragValueControl>
				<GridSettingsMenu
					showMinimap={showMinimap}
					onShowMinimapChange={setShowMinimap}
				/>
			</div>
			<div className="pointer-events-auto absolute left-1/2 bottom-[var(--ts-edge-gap)] -translate-x-1/2 rounded-xl border border-primary-200/35 bg-primary-500/30 px-2 py-1 backdrop-blur-sm">
				<div className="flex items-center gap-2">
					{TOOLBAR_TOOLS.map((tool) => {
						const Icon = tool.icon;
						const active = tool.key === activeTool;
						return (
							<button
								type="button"
								key={tool.key}
								onClick={() => setActiveTool(tool.key)}
								className={
									active
										? "inline-flex h-[1.95rem] w-[1.95rem] items-center justify-center rounded-[0.6rem] border border-[color-mix(in_oklch,var(--accent-cool-300),transparent_25%)] [background:color-mix(in_oklch,var(--background-200),black_3%)] text-foreground-bold shadow-[0_0_0_2px_color-mix(in_oklch,var(--accent-cool-400),transparent_60%)] transition-all duration-150 ease-in hover:border-[color-mix(in_oklch,var(--accent-cool-300),transparent_48%)] hover:[background:color-mix(in_oklch,var(--background-200),black_6%)] hover:[color:var(--foreground-normal)]"
										: "inline-flex h-[1.95rem] w-[1.95rem] items-center justify-center rounded-[0.6rem] border border-[color-mix(in_oklch,var(--background-100),transparent_75%)] [background:color-mix(in_oklch,var(--background-300),black_5%)] text-[color-mix(in_oklch,var(--foreground-normal),var(--background-300)_34%)] transition-all duration-150 ease-in hover:border-[color-mix(in_oklch,var(--accent-cool-300),transparent_48%)] hover:[background:color-mix(in_oklch,var(--background-200),black_6%)] hover:[color:var(--foreground-normal)]"
								}
							>
								<Icon className="size-4" />
							</button>
						);
					})}
				</div>
			</div>

			{showMinimap ? (
				<div className="pointer-events-auto absolute bottom-(--ts-edge-gap) right-(--ts-edge-gap) w-1/4 aspect-video">
					<div className="h-full w-full rounded-md border border-primary-200/35 ts-minimap" />
				</div>
			) : null}
		</div>
	);
}
