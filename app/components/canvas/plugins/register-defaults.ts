import { canvasPluginRegistry } from "./registry";
import { noteElementDefinition, noteUIPlugin } from "./note-plugin";
import { titleElementDefinition } from "./title-plugin";

let initialized = false;

export function ensureDefaultCanvasPluginsRegistered() {
	if (initialized) return;
	initialized = true;
	canvasPluginRegistry.registerElementDefinition(noteElementDefinition);
	canvasPluginRegistry.registerUIPlugin(noteUIPlugin);
	canvasPluginRegistry.registerElementDefinition(titleElementDefinition);
}
