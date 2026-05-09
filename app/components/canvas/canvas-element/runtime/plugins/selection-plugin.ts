import type { ElementPlugin } from "../types";

export const selectionPlugin: ElementPlugin = {
	name: "selection",
	onEvent: (context) => {
		if (context.event.kind !== "tick") {
			return null;
		}
		return [
			{
				type: "setDataAttr",
				name: "data-selected",
				value: String(context.selection.isSelected),
			},
			{
				type: "setDataAttr",
				name: "data-multi-selected",
				value: String(context.selection.isMultiSelected),
			},
		];
	},
};
