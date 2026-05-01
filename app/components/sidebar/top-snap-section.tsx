import React from "react";
import Sidebar from "../ui/sidebar";
import { PRIMARY_NAV } from "./constants";

type SidebarTopSnapSectionProps = {
	onNavigateCanvas: () => void;
};

export function SidebarTopSnapSection({
	onNavigateCanvas,
}: SidebarTopSnapSectionProps) {
	return (
		<div className="flex flex-col gap-2">
			{PRIMARY_NAV.map((item) => {
				const Icon = item.icon;
				return (
					<Sidebar.MenuItem
						className="flex flex-row text-md"
						type="button"
						title={item.label}
						key={item.id}
						onClick={() => {
							if (item.id === "canvas") onNavigateCanvas();
						}}
					>
						<Icon className="size-5 text-foreground-muted group-hover:text-foreground-normal" />
						<span className="flex-1">{item.label}</span>
					</Sidebar.MenuItem>
				);
			})}
		</div>
	);
}
