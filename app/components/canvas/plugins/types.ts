import type { AnyCanvasElementDisplay, CanvasElementVariant } from "@/types";
import type { ReactNode } from "react";

type DefinitionRenderArgs<T extends AnyCanvasElementDisplay> = {
	element: T;
	tools: ReactNode;
	runtimeUi?: {
		resizeState?: string;
		resizeHeading?: "none" | "left" | "right" | "top" | "bottom";
	};
};

export type CanvasElementDefinition<T extends AnyCanvasElementDisplay = AnyCanvasElementDisplay> = {
	variant: CanvasElementVariant;
	canResize?: (element: T, options?: { enableResize?: boolean }) => boolean;
	render: (args: DefinitionRenderArgs<T>) => ReactNode;
};

export type CanvasUIPlugin<T extends AnyCanvasElementDisplay = AnyCanvasElementDisplay> = {
	variant: CanvasElementVariant;
	renderTools?: (args: { element: T }) => ReactNode;
};

export type CanvasPluginRegistry = {
	registerElementDefinition: (definition: CanvasElementDefinition) => () => boolean;
	registerUIPlugin: (plugin: CanvasUIPlugin) => () => boolean;
	getElementDefinition: (variant: CanvasElementVariant) => CanvasElementDefinition | null;
	getUIPlugin: (variant: CanvasElementVariant) => CanvasUIPlugin | null;
};
