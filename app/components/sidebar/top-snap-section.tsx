import React from "react";
import Sidebar from "../ui/sidebar";
import { PRIMARY_NAV } from "./constants";
import { Group } from "@project-lary/react-material-symbols-400-rounded";

type SidebarTopSnapSectionProps = {
	onNavigateCanvas: () => void;
};

export function SidebarTopSnapSection({
	onNavigateCanvas,
}: SidebarTopSnapSectionProps) {
	return (
		<ol className="flex flex-col gap-2 p-2 h-full justify-start">
			{PRIMARY_NAV.map((item) => {
				const Icon = item.icon;
				return (
					<Sidebar.MenuItem>
						<Group className="size-4 text-foreground-muted" data-align="left" />
						<span className="">ThoughtSpaces</span>
					</Sidebar.MenuItem>
				);
			})}
		</ol>
	);
}
