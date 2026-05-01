import React from "react";
import {
	DarkMode as Moon,
	Settings,
} from "@project-lary/react-material-symbols-400-rounded";
import Sidebar from "../ui/sidebar";

export function SidebarFooterSection() {
	return (
		<Sidebar.Footer className="mt-auto px-3 pb-3 pt-2">
			<div className="flex items-center justify-between rounded-xl border border-primary-400/70 bg-primary-400/28 px-2 py-1.5">
				<button
					type="button"
					className="inline-flex size-8 items-center justify-center rounded-md text-foreground-muted hover:bg-primary-400/70 hover:text-foreground-normal transition-colors"
					aria-label="Help"
				>
					<span className="text-lg leading-none">?</span>
				</button>
				<button
					type="button"
					className="inline-flex size-8 items-center justify-center rounded-md text-foreground-muted hover:bg-primary-400/70 hover:text-foreground-normal transition-colors"
					aria-label="Theme"
				>
					<Moon className="size-4" />
				</button>
				<button
					type="button"
					className="inline-flex size-8 items-center justify-center rounded-md text-foreground-muted hover:bg-primary-400/70 hover:text-foreground-normal transition-colors"
					aria-label="Settings"
				>
					<Settings className="size-4" />
				</button>
			</div>
		</Sidebar.Footer>
	);
}
