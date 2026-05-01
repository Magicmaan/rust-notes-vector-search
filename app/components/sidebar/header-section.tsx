import React from "react";
import {
	KeyboardArrowDown as ChevronDown,
	Search,
} from "@project-lary/react-material-symbols-400-rounded";

import { Input } from "../ui/input";
import Sidebar from "../ui/sidebar";

export function SidebarHeaderSection() {
	return (
		<Sidebar.Header className="px-3 pb-2 pt-3 gap-2">
			<div className="flex items-center gap-2">
				<Sidebar.Trigger className="static ml-0 mt-0 size-8 border border-primary-400/80 bg-primary-400/55 text-foreground-muted hover:text-foreground-normal hover:bg-primary-400/80 shadow-none" />
				<button
					type="button"
					className="inline-flex flex-1 items-center gap-2 rounded-lg border border-primary-400/90 bg-primary-300/70 px-2.5 py-1.5 text-[18px] font-medium tracking-tight text-foreground-bold"
				>
					<span className="size-2.5 rounded-full bg-[color-mix(in_oklch,var(--accent-cool-300),white_24%)]" />
					ThoughtSpace
					<ChevronDown className="size-4 text-foreground-muted" />
				</button>
			</div>
		</Sidebar.Header>
	);
}
