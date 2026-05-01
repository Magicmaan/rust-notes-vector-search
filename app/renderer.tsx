import React from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import App from "./app";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
	initSettingsPersistence,
	useSettingsStore,
} from "./providers/settings/store";

function registerDevtoolsShortcut(): void {
	window.addEventListener("keydown", (event) => {
		const isF12 = event.key === "F12";
		const isCtrlShiftI = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "i";
		if (!isF12 && !isCtrlShiftI) {
			return;
		}
		event.preventDefault();
		void invoke("open_devtools");
	});
}

async function bootstrap() {
	await useSettingsStore.getState().hydrate();
	initSettingsPersistence();
	registerDevtoolsShortcut();

	ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
		<React.StrictMode>
			<ErrorBoundary>
				<App />
			</ErrorBoundary>
		</React.StrictMode>,
	);
}

void bootstrap();
