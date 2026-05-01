import { ConveyorApi } from "@/lib/preload/shared";
import type { Settings } from "@/lib/settings/schema";

export class SettingsApi extends ConveyorApi {
	load = () => this.invoke("settings-load");
	save = (settings: Settings) => this.invoke("settings-save", settings);
	path = () => this.invoke("settings-path");
}
