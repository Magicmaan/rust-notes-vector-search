import { join } from "node:path";
import { app, BrowserWindow, shell } from "electron";
import { registerAppHandlers } from "@/lib/conveyor/handlers/app-handler";
import { registerSettingsHandlers } from "@/lib/conveyor/handlers/settings-handler";
import { registerWindowHandlers } from "@/lib/conveyor/handlers/window-handler";
import appIcon from "@/resources/build/icon.png?asset";
import { registerResourcesProtocol } from "./protocols";

export function createAppWindow(): void {
	// Register custom protocol for resources
	registerResourcesProtocol();

	// Create the main window.
	const mainWindow = new BrowserWindow({
		width: 900,
		height: 670,
		show: false,
		backgroundColor: "#1c1c1c",
		icon: appIcon,
		frame: false,
		titleBarStyle: "hidden",
		title: "Electron React App",
		maximizable: true,
		resizable: true,
		webPreferences: {
			preload: join(__dirname, "../preload/preload.js"),
			sandbox: false,
			nodeIntegrationInWorker: true,
		},
	});

	// Register IPC events for the main window.
	registerWindowHandlers(mainWindow);
	registerAppHandlers(app);
	registerSettingsHandlers(app);

	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
	});

	if (!app.isPackaged) {
		mainWindow.webContents.once("did-finish-load", () => {
			mainWindow.webContents.openDevTools({ mode: "detach" });
		});
	}

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
		mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}
}
