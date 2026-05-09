import type { ElementPlugin } from "../types";

export const selectionPlugin: ElementPlugin = {
	name: "selection",
	onEvent: (context) => {
		if (context.viewport.lockout) {
			return [
				{
					type: "setDataAttr",
					name: "data-lockout",
					value: "true",
				},
				{
					type: "setDataAttr",
					name: "data-element-state",
					value: "lockout",
				},
			];
		}

		if (context.event.kind === "pointerDown") {
			return {
				type: "setDataAttr",
				name: "data-element-state",
				value: "active",
			};
		}

		if (
			context.event.kind === "pointerUp" ||
			context.event.kind === "pointerCancel" ||
			context.event.kind === "blur"
		) {
			return [
				{
					type: "removeDataAttr",
					name: "data-lockout",
				},
				{
					type: "setDataAttr",
					name: "data-element-state",
					value: "default",
				},
			];
		}

		return [
			{
				type: "removeDataAttr",
				name: "data-lockout",
			},
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
