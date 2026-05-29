import React from "react";
import type { AnyCanvasElementDisplay } from "@/types";
import { canvasPluginRegistry } from "../plugins/registry";
import { ensureDefaultCanvasPluginsRegistered } from "../plugins/register-defaults";

type CanvasElementRendererProps = {
	element: AnyCanvasElementDisplay;
	runtimeUi?: {
		resizeState?: string;
		resizeHeading?: "none" | "left" | "right" | "top" | "bottom";
	};
};

export default function CanvasElementRenderer({
	element,
	runtimeUi,
}: CanvasElementRendererProps) {
	ensureDefaultCanvasPluginsRegistered();
	const definition = canvasPluginRegistry.getElementDefinition(element.variant);
	if (!definition) {
		throw new Error(`No canvas element definition registered for variant \"${element.variant}\"`);
	}
	const tools = canvasPluginRegistry.getUIPlugin(element.variant)?.renderTools?.({
		element: element as never,
	});
	return (
		<>
			{definition.render({
				element: element as never,
				tools: tools ?? null,
				runtimeUi,
			})}
		</>
	);
}
