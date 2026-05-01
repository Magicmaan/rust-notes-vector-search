import React from "react";
import { useMemo, useState } from "react";
import {
	Add as Plus,
	KeyboardArrowDown as ChevronDown,
	Tag as Hash,
	Tune as SlidersHorizontal,
} from "@project-lary/react-material-symbols-400-rounded";

import { Switch } from "../ui/switch";
import { GroupTitle } from "./group-title";
import { SPACES, TAGS } from "./constants";

export function SidebarFlexMiddleSection() {
	const [gridSize] = useState(120);
	const [snapToGrid, setSnapToGrid] = useState(true);
	const [showPlaceholders, setShowPlaceholders] = useState(true);
	const [linkPreviews, setLinkPreviews] = useState(true);

	const tagPills = useMemo(
		() =>
			TAGS.map((tag) => (
				<button
					type="button"
					key={tag.id}
					className="inline-flex items-center gap-1 rounded-md border border-primary-400/80 bg-primary-400/45 px-2.5 py-1 text-[13px] text-foreground-normal/95 hover:bg-primary-400/70 transition-colors"
				>
					<Hash className="size-3.5 text-foreground-muted" />
					<span>{tag.id}</span>
					<span className="rounded-full bg-primary-500/70 px-1.5 text-[11px] text-foreground-muted">
						{tag.count}
					</span>
				</button>
			)),
		[],
	);

	return (
		<>
			<div className="mt-4">
				<GroupTitle
					right={
						<button
							type="button"
							className="text-foreground-muted hover:text-foreground-normal transition-colors"
							aria-label="Add space"
						>
							<Plus className="size-4" />
						</button>
					}
				>
					Spaces
				</GroupTitle>
			</div>

			<div className="mt-4">
				<GroupTitle
					right={
						<button
							type="button"
							className="text-foreground-muted hover:text-foreground-normal transition-colors"
							aria-label="Collapse tags"
						>
							<ChevronDown className="size-4" />
						</button>
					}
				>
					Tags
				</GroupTitle>
				<div className="flex flex-wrap gap-2 px-1">
					{tagPills}
					<button
						type="button"
						className="inline-flex items-center gap-1 rounded-md border border-dashed border-primary-400/85 bg-primary-400/25 px-2.5 py-1 text-[13px] text-foreground-muted hover:bg-primary-400/45 transition-colors"
					>
						<Plus className="size-3.5" />
						New tag
					</button>
				</div>
			</div>

			<div className="mt-4 rounded-xl border border-primary-400/70 bg-primary-400/30 px-3 py-3">
				<div className="mb-3 flex items-center justify-between text-[14px] font-medium text-foreground-bold">
					<span className="inline-flex items-center gap-2">
						<SlidersHorizontal className="size-4 text-foreground-muted" />
						Canvas Settings
					</span>
					<ChevronDown className="size-4 text-foreground-muted" />
				</div>
				<div className="space-y-2.5 text-[14px] text-foreground-normal/92">
					<div className="flex items-center justify-between">
						<span>Grid size</span>
						<button
							type="button"
							className="inline-flex items-center gap-1 rounded-md border border-primary-400/90 bg-primary-300/70 px-2 py-1 text-[13px] text-foreground-muted"
						>
							{gridSize}
							<ChevronDown className="size-3.5" />
						</button>
					</div>
					<div className="flex items-center justify-between">
						<span>Snap to grid</span>
						<Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
					</div>
					<div className="flex items-center justify-between">
						<span>Show placeholders</span>
						<Switch
							checked={showPlaceholders}
							onCheckedChange={setShowPlaceholders}
						/>
					</div>
					<div className="flex items-center justify-between">
						<span>Link previews</span>
						<Switch checked={linkPreviews} onCheckedChange={setLinkPreviews} />
					</div>
				</div>
			</div>
		</>
	);
}
