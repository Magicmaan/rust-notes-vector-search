import { strict as assert } from "node:assert";
import test from "node:test";
import { defaultSettings, normalizeSettings } from "./schema";

test("normalizeSettings coerces legacy theme values to dark", () => {
	const fromSystem = normalizeSettings({
		theme: "system",
		defaultNoteColor: "#abc123",
	});
	const fromLight = normalizeSettings({
		theme: "light",
		defaultNoteColor: "#def456",
	});

	assert.equal(fromSystem.theme, "dark");
	assert.equal(fromLight.theme, "dark");
	assert.equal(fromSystem.defaultNoteColor, "#abc123");
	assert.equal(fromLight.defaultNoteColor, "#def456");
});

test("normalizeSettings falls back to defaults for invalid payloads", () => {
	const normalized = normalizeSettings(null);
	assert.deepEqual(normalized, defaultSettings);
});
