import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { App } from "electron";
import {
	defaultSettings,
	normalizeSettings,
	parseSettings,
	type Settings,
} from "@/lib/settings/schema";

const SETTINGS_FILE_NAME = "settings.json";

export class SettingsService {
	private readonly configPath: string;

	constructor(app: App) {
		this.configPath = join(app.getPath("userData"), SETTINGS_FILE_NAME);
	}

	getPath(): string {
		return this.configPath;
	}

	load(): Settings {
		try {
			const raw = readFileSync(this.configPath, "utf-8");
			const parsed = JSON.parse(raw) as unknown;
			return normalizeSettings(parsed);
		} catch (error) {
			if (isMissingFileError(error)) {
				return { ...defaultSettings };
			}

			if (error instanceof SyntaxError) {
				return { ...defaultSettings };
			}

			console.warn("[SettingsService] Failed to load settings, using defaults", error);
			return { ...defaultSettings };
		}
	}

	save(settings: Settings): Settings {
		const normalized = normalizeSettings(settings);
		const validated = parseSettings(normalized);
		const filePath = this.configPath;
		const fileDir = dirname(filePath);
		const tempPath = `${filePath}.tmp`;
		const payload = `${JSON.stringify(validated, null, 2)}\n`;

		mkdirSync(fileDir, { recursive: true });
		writeFileSync(tempPath, payload, "utf-8");
		renameSync(tempPath, filePath);

		return validated;
	}
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
	return (
		error instanceof Error &&
		"code" in error &&
		(error as NodeJS.ErrnoException).code === "ENOENT"
	);
}
