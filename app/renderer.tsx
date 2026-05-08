import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
	initSettingsPersistence,
	useSettingsStore,
} from "./providers/settings/store";

async function bootstrap() {
	await useSettingsStore.getState().hydrate();
	initSettingsPersistence();

	ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
		<React.StrictMode>
			<ErrorBoundary>
				<head>
					<link rel="preconnect" href="https://fonts.googleapis.com" />
					<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
					<link
						href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap"
						rel="stylesheet"
					/>
				</head>
				<App />
			</ErrorBoundary>
		</React.StrictMode>,
	);
}

void bootstrap();
