import { z } from "zod";
import { settingsSchema } from "@/lib/settings/schema";

export const settingsIpcSchema = {
	"settings-load": {
		args: z.tuple([]),
		return: settingsSchema,
	},
	"settings-save": {
		args: z.tuple([settingsSchema]),
		return: settingsSchema,
	},
	"settings-path": {
		args: z.tuple([]),
		return: z.string(),
	},
};
