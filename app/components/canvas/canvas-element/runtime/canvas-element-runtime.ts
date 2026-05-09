import type { AnyCanvasElementDisplay } from "@/types";
import type {
	ElementFrameContext,
	ElementOperation,
	ElementPlugin,
	ElementRuntimeEvent,
} from "./types";

type RuntimeInput = {
	element: AnyCanvasElementDisplay;
	grid: {
		cellWidth: number;
		cellHeight: number;
	};
	viewport: {
		zoomLevel: number;
		isPanning: boolean;
		lockout: boolean;
	};
	selection: {
		isSelected: boolean;
		isMultiSelected: boolean;
	};
};

export class CanvasElementRuntime {
	private elementNode: HTMLDivElement | null = null;
	private plugins = new Set<ElementPlugin>();
	private input: RuntimeInput | null = null;

	mount(elementNode: HTMLDivElement) {
		this.elementNode = elementNode;
	}

	unmount() {
		this.elementNode = null;
	}

	updateInput(input: RuntimeInput) {
		this.input = input;
	}

	registerPlugin(plugin: ElementPlugin) {
		this.plugins.add(plugin);
		return () => this.plugins.delete(plugin);
	}

	dispatch(event: ElementRuntimeEvent) {
		if (!this.input || !this.elementNode) {
			return;
		}
		const context: ElementFrameContext = {
			event,
			element: this.input.element,
			grid: this.input.grid,
			viewport: this.input.viewport,
			selection: this.input.selection,
		};
		const operations: ElementOperation[] = [];
		for (const plugin of this.plugins) {
			const result = plugin.onEvent?.(context);
			if (Array.isArray(result)) {
				operations.push(...result);
			} else if (result) {
				operations.push(result);
			}
		}
		this.commit(operations);
	}

	private commit(operations: ElementOperation[]) {
		if (!this.elementNode) return;
		for (const operation of operations) {
			switch (operation.type) {
				case "setDataAttr":
					this.elementNode.setAttribute(operation.name, operation.value);
					break;
				case "removeDataAttr":
					this.elementNode.removeAttribute(operation.name);
					break;
			}
		}
	}
}
