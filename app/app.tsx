import { BrowserRouter, Route, Routes } from "react-router";
import AppSidebar from "./components/app-sidebar";
import CanvasPage from "./pages/canvas";
import HomePage from "./pages/home";
import Note from "./components/note";
import NoteContextProvider from "./components/note/context";
import { useEffect, useRef } from "react";
import { useEditorGridStore } from "./providers/editor/store";
import { CookiesProvider } from "react-cookie";
import { useSettingsStore } from "./providers/settings/store";
import { buildInitialThoughtSpaceDisplays } from "./components/canvas/canvas-base/mock-cards";
import { EventBusProvider } from "./events";
import Sidebar from "./components/ui/sidebar";
import React from "react";

// https://reactrouter.com/start/declarative/routing
export default function App() {
	const setElements = useEditorGridStore((s) => s.setElements);
	const setViewportTransform = useEditorGridStore(
		(s) => s.setViewportTransform,
	);
	const defaultNoteColor = useSettingsStore((s) => s.settings.defaultNoteColor);
	const hasInitializedElements = useRef(false);

	useEffect(() => {
		if (hasInitializedElements.current) {
			return;
		}

		hasInitializedElements.current = true;
		const noteDisplays = buildInitialThoughtSpaceDisplays(defaultNoteColor);
		setElements(noteDisplays);
		setViewportTransform({
			zoomLevel: 1,
			offsetX: 48,
			offsetY: 22,
		});
	}, [defaultNoteColor, setElements, setViewportTransform]);

	useEffect(() => {
		document.documentElement.dataset.theme = "dark";
		document.documentElement.dataset.resolvedTheme = "dark";
		document.documentElement.classList.add("dark");
		document.documentElement.classList.remove("light");
	}, []);

	return (
		<main className="relative">
			<div
				className="relative flex h-full isolate"
				data-theme="dark"
				data-resolved-theme="dark"
			>
				<CookiesProvider>
					<EventBusProvider>
						<BrowserRouter>
							<Sidebar.Provider className="p-4 bg-primary-400 h-screen max-h-screen">
								<AppSidebar />
								<div
									className="flex-1  rounded-lg overflow-clip bg-primary-300 border-4 border-border"
									id="app-content"
								>
									<Sidebar.Trigger className="peer-data-[state=expanded]:opacity-0 peer-data-[state=expanded]:pointer-events-none transition-opacity duration-200" />
									<Routes>
										<Route path="/" element={<HomePage />} />
										<Route path="/editor" element={<CanvasPage />} />

										<Route
											path="/note/:id"
											element={
												<NoteContextProvider>
													<Note fullscreen={true} />
												</NoteContextProvider>
											}
										/>
									</Routes>
								</div>
							</Sidebar.Provider>
						</BrowserRouter>
					</EventBusProvider>
				</CookiesProvider>
			</div>
		</main>
	);
}
