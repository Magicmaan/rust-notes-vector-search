import { z } from "zod";

export const settingsThemeSchema = z.literal("dark");

export const settingsSchema = z.object({
	theme: settingsThemeSchema,
	defaultNoteColor: z.string().min(1),
});

export type Settings = z.infer<typeof settingsSchema>;

export const defaultSettings: Settings = {
	theme: "dark",
	defaultNoteColor: "#6f95ea",
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeSettings(value: unknown): Settings {
	if (!isPlainRecord(value)) {
		return { ...defaultSettings };
	}

	const next: Settings = { ...defaultSettings };

	// Migrate legacy persisted values ("system" | "light") to the dark-only mode.
	next.theme = "dark";

	const parsedDefaultNoteColor = z.string().min(1).safeParse(value.defaultNoteColor);
	if (parsedDefaultNoteColor.success) {
		next.defaultNoteColor = parsedDefaultNoteColor.data;
	}

	return next;
}

export function parseSettings(value: unknown): Settings {
	return settingsSchema.parse(value);
}
