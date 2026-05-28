import { CanvasRuntime } from "../canvas-runtime";
import MarqueePlugin from "./marquee-plugin";
import { NotePlugin } from "./note-plugin";
import { PanPlugin } from "./pan-plugin";
import { PluginBase } from "./types";
import { ZoomPlugin } from "./zoom-plugin";

/**
 * The PluginHandler is responsible managing the lifecycle of plugins, i.e. mount and unmount
 */
export class PluginHandler {
	plugins: PluginBase[];

	constructor(plugins: PluginBase[] = []) {
		this.plugins = plugins.length > 0 ? plugins : [
			new PanPlugin(),
			new NotePlugin(),
			new MarqueePlugin(),
			new ZoomPlugin(),
		];
	}

	addPlugin(plugin: PluginBase) {
		this.plugins.push(plugin);
	}

	mount(runtime: CanvasRuntime) {
		for (const plugin of this.plugins) {
			plugin.mount(runtime);
		}
	}

	unmount() {
		for (const plugin of this.plugins) {
			plugin.unmount();
		}
	}
}
