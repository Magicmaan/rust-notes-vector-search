import React from "react";
import type { AnyCanvasElementDisplay } from "@/types";
import { canvasPluginRegistry } from "../plugins/registry";
import { ensureDefaultCanvasPluginsRegistered } from "../plugins/register-defaults";

type CanvasElementRendererProps = {
	element: AnyCanvasElementDisplay;
};

export default function CanvasElementRenderer({ element }: CanvasElementRendererProps) {
	ensureDefaultCanvasPluginsRegistered();
	const definition = canvasPluginRegistry.getElementDefinition(element.variant);
	if (!definition) {
		throw new Error(`No canvas element definition registered for variant \"${element.variant}\"`);
	}
	const tools = canvasPluginRegistry.getUIPlugin(element.variant)?.renderTools?.({
		element: element as never,
	});
	return <>{definition.render({ element: element as never, tools: tools ?? null })}</>;
}
