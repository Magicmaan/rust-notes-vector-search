import React from "react";
import { Menu } from "@base-ui/react/menu";
import {
	GridView as Grid3X3,
	Settings as Settings2,
	Undo as RotateCcw,
	DiscoverTune,
} from "@project-lary/react-material-symbols-400-rounded";
import { useCallback, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useEditorGridStore } from "@/providers/editor/store";
import clsx from "clsx";

type GridSettingsMenuProps = {
	showMinimap: boolean;
	onShowMinimapChange: (next: boolean) => void;
};

export default function GridSettingsMenu({
	showMinimap,
	onShowMinimapChange,
}: GridSettingsMenuProps) {
	const setViewportTransform = useEditorGridStore(
		(s) => s.setViewportTransform,
	);
	const [snapToGrid, setSnapToGrid] = useState(true);

	const resetView = useCallback(() => {
		setViewportTransform({
			zoomLevel: 1,
			offsetX: 0,
			offsetY: 0,
		});
	}, [setViewportTransform]);

	return (
		<Menu.Root>
			<Menu.Trigger
				aria-label="Grid settings"
				title="Grid settings"
				className={clsx(
					"flex size-10 aspect-square border border-border rounded-md bg-background-400 justify-center items-center text-foreground-muted cursor-pointer",
					"hover:text-foreground transition-all duration-300",
					"aria-expanded:border-border-light aria-expanded:text-foreground aria-expanded:animate-scale-bounce aria-expanded:bg-background-300",
				)}
			>
				<DiscoverTune className="size-5" />
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner side="bottom" align="start" sideOffset={10}>
					<Menu.Popup className="flex min-w-[220px] flex-col gap-1 rounded-[0.8rem] border [border-color:color-mix(in_oklch,var(--background-100),transparent_70%)] [background:color-mix(in_oklch,var(--background-300),black_3%)] p-[0.55rem] shadow-[0_14px_40px_rgba(4,8,18,0.45)] backdrop-blur-[8px]">
						<h3 className="px-1 pt-1 pb-[0.45rem] text-[0.78rem] font-semibold tracking-[0.02em] text-foreground-muted uppercase">
							Grid settings
						</h3>
						<div className="flex items-center justify-between gap-[0.65rem] rounded-[0.62rem] px-[0.48rem] py-[0.4rem] text-[0.84rem] text-foreground-normal">
							<div className="flex items-center gap-2">
								<Grid3X3 className="size-4 text-foreground-muted" />
								<span>Show minimap</span>
							</div>
							<Switch
								size="sm"
								checked={showMinimap}
								onClick={(e) => e.stopPropagation()}
								onCheckedChange={onShowMinimapChange}
							/>
						</div>
						<div className="flex items-center justify-between gap-[0.65rem] rounded-[0.62rem] px-[0.48rem] py-[0.4rem] text-[0.84rem] text-foreground-normal">
							<div className="flex items-center gap-2">
								<span className="size-4 inline-block rounded-xs border border-primary-100/40" />
								<span>Snap to grid</span>
							</div>
							<Switch
								size="sm"
								checked={snapToGrid}
								onClick={(e) => e.stopPropagation()}
								onCheckedChange={setSnapToGrid}
							/>
						</div>
						<div className="my-[0.3rem] h-px [background:color-mix(in_oklch,var(--background-100),transparent_78%)]" />
						<Menu.Item
							className="inline-flex items-center gap-[0.45rem] rounded-[0.62rem] px-[0.52rem] py-[0.48rem] text-[0.84rem] text-foreground-normal transition-all duration-150 ease-in hover:[background:color-mix(in_oklch,var(--background-200),black_6%)] hover:text-foreground-bold focus-visible:[background:color-mix(in_oklch,var(--background-200),black_6%)] focus-visible:text-foreground-bold focus-visible:outline-none"
							onClick={resetView}
						>
							<RotateCcw className="size-4" />
							Reset view
						</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}
