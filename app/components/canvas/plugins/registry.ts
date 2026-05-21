import type { CanvasElementVariant } from "@/types";
import type {
	CanvasElementDefinition,
	CanvasPluginRegistry,
	CanvasUIPlugin,
} from "./types";

class CanvasPluginRegistryRuntime implements CanvasPluginRegistry {
	private definitions = new Map<
		CanvasElementVariant,
		CanvasElementDefinition
	>();
	private uiPlugins = new Map<CanvasElementVariant, CanvasUIPlugin>();

	registerElementDefinition(definition: CanvasElementDefinition) {
		this.definitions.set(definition.variant, definition);
		return () => this.definitions.delete(definition.variant);
	}

	registerUIPlugin(plugin: CanvasUIPlugin) {
		this.uiPlugins.set(plugin.variant, plugin);
		return () => this.uiPlugins.delete(plugin.variant);
	}

	getElementDefinition(
		variant: CanvasElementVariant,
	): CanvasElementDefinition | null {
		return this.definitions.get(variant) ?? null;
	}

	getUIPlugin(variant: CanvasElementVariant): CanvasUIPlugin | null {
		return this.uiPlugins.get(variant) ?? null;
	}
}

export const canvasPluginRegistry = new CanvasPluginRegistryRuntime();
