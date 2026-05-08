"use client";
import React from "react";
import { useNavigate } from "react-router";

import { useSettingsStore } from "@/providers/settings/store";

import { ScrollArea } from "./ui/scroll-area";
import { SidebarBottomSnapSection } from "./sidebar/bottom-snap-section";
import { SidebarFlexMiddleSection } from "./sidebar/flex-middle-section";
import { SidebarFooterSection } from "./sidebar/footer-section";
import { SidebarHeaderSection } from "./sidebar/header-section";
import { SidebarTopSnapSection } from "./sidebar/top-snap-section";
import Sidebar from "./ui/sidebar";
import {
	Group,
	Search,
} from "@project-lary/react-material-symbols-400-rounded";
import { Add } from "@project-lary/react-material-symbols-400-rounded";

import { Input } from "./ui/input";
import { GroupTitle } from "./sidebar/group-title";
import Section from "./ui/section";

function AppSidebar() {
	const nav = useNavigate();
	const defaultNoteColor = useSettingsStore((s) => s.settings.defaultNoteColor);
	const setSetting = useSettingsStore((s) => s.setSetting);
	const error = useSettingsStore((s) => s.error);

	return (
		<Sidebar className="thoughtspace-sidebar">
			<SidebarHeaderSection />

			<Sidebar.Content className="overflow-hidden px-2 pb-2">
				<ScrollArea
					className="h-full"
					contentClassName="gap-0 h-full px-0 pr-2 pb-2"
				>
					<div className="min-h-full grid grid-cols-1 grid-rows[0.25rem_0.125rem_auto_0.125rem_0.25rem] gap-4">
						<Sidebar.Group className="gap-4">
							<div className="relative bg-background-200/50 rounded-md text-foreground-muted">
								<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
								<Input
									readOnly
									value="Search"
									className="h-10 rounded-md pl-9 pr-10 text-[14px] "
								/>
								<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px]">
									⌘K
								</span>
							</div>
							<SidebarTopSnapSection onNavigateCanvas={() => nav("/editor")} />
						</Sidebar.Group>
						<Section>
							<GroupTitle
								right={
									<button
										type="button"
										className="text-foreground-muted hover:text-foreground-normal transition-colors"
										aria-label="Add space"
									>
										<Add className="size-5" />
									</button>
								}
							>
								Spaces
							</GroupTitle>
							<Sidebar.Group>
								<Sidebar.MenuItem interactable onClick={() => nav("/editor")}>
									<Group
										className="size-4 text-foreground-muted"
										data-align="left"
									/>
									<span className="">ThoughtSpaces</span>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem interactable onClick={() => nav("/editor")}>
									<Group
										className="size-5 text-foreground-muted"
										data-align="left"
									/>
									<span className="">ThoughtSpaces</span>
								</Sidebar.MenuItem>
							</Sidebar.Group>
						</Section>
						<SidebarFlexMiddleSection />
						<SidebarBottomSnapSection
							defaultNoteColor={defaultNoteColor}
							onSetDefaultNoteColor={(color) =>
								setSetting("defaultNoteColor", color)
							}
							error={error !== null ? "Failed to update setting" : null}
						/>
					</div>
				</ScrollArea>
			</Sidebar.Content>

			<SidebarFooterSection />
		</Sidebar>
	);
}

export default AppSidebar;
