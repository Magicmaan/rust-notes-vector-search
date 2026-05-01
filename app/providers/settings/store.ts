import { create } from "zustand";
import {
	defaultSettings,
	normalizeSettings,
	type Settings,
} from "@/lib/settings/schema";

const SAVE_DEBOUNCE_MS = 300;

type SettingsStoreState = {
	settings: Settings;
	isHydrated: boolean;
	lastSavedAt?: number;
	error?: string;
	hydrate: () => Promise<void>;
	setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
	setSettings: (settings: Partial<Settings>) => void;
	resetSettings: () => void;
};

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
	settings: { ...defaultSettings },
	isHydrated: false,
	lastSavedAt: undefined,
	error: undefined,
	hydrate: async () => {
		try {
			const loadedRaw = window.localStorage.getItem("notes-settings");
			const loaded = loadedRaw ? JSON.parse(loadedRaw) : defaultSettings;
			set(() => ({
				settings: normalizeSettings(loaded),
				isHydrated: true,
				error: undefined,
			}));
		} catch (error) {
			set(() => ({
				settings: { ...defaultSettings },
				isHydrated: true,
				error: toErrorMessage(error),
			}));
		}
	},
	setSetting: (key, value) => {
		set((state) => ({
			settings: {
				...state.settings,
				[key]: value,
			},
		}));
	},
	setSettings: (settings) => {
		set((state) => ({
			settings: normalizeSettings({
				...state.settings,
				...settings,
			}),
		}));
	},
	resetSettings: () => {
		set(() => ({
			settings: { ...defaultSettings },
			error: undefined,
		}));
	},
}));

let persistenceInitialized = false;
let suppressPersistenceOnce = false;
let saveTimeoutId: number | null = null;

export function initSettingsPersistence(): void {
	if (persistenceInitialized) {
		return;
	}

	persistenceInitialized = true;

	useSettingsStore.subscribe((state, previousState) => {
		if (suppressPersistenceOnce) {
			suppressPersistenceOnce = false;
			return;
		}

		if (!state.isHydrated) {
			return;
		}

		if (
			state.settings.theme === previousState.settings.theme &&
			state.settings.defaultNoteColor === previousState.settings.defaultNoteColor
		) {
			return;
		}

		if (saveTimeoutId !== null) {
			window.clearTimeout(saveTimeoutId);
		}

		saveTimeoutId = window.setTimeout(async () => {
			const snapshot = useSettingsStore.getState().settings;
			try {
				window.localStorage.setItem("notes-settings", JSON.stringify(snapshot));
				suppressPersistenceOnce = true;
				useSettingsStore.setState((currentState) => ({
					...currentState,
					settings: normalizeSettings(snapshot),
					lastSavedAt: Date.now(),
					error: undefined,
				}));
			} catch (error) {
				useSettingsStore.setState((currentState) => ({
					...currentState,
					error: toErrorMessage(error),
				}));
			}
		}, SAVE_DEBOUNCE_MS);
	});
}
