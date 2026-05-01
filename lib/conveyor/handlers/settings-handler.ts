import type { App } from "electron";
import { handle } from "@/lib/main/shared";
import { SettingsService } from "@/lib/main/settings-service";

export const registerSettingsHandlers = (app: App) => {
	const service = new SettingsService(app);

	handle("settings-load", () => service.load());
	handle("settings-save", (settings) => service.save(settings));
	handle("settings-path", () => service.getPath());
};
