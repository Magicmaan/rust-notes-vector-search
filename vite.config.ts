import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

const aliases = [
	{ find: /^@\/lib\//, replacement: `${resolve(__dirname, "lib")}/` },
	{ find: /^@\/resources\//, replacement: `${resolve(__dirname, "resources")}/` },
	{ find: /^@\//, replacement: `${resolve(__dirname, "app")}/` },
];

export default defineConfig({
	root: "./app",
	server: {
		host: "127.0.0.1",
		port: 5173,
		strictPort: true,
		fs: {
			allow: [
				resolve(__dirname, "app"),
				resolve(__dirname, "lib"),
				resolve(__dirname, "resources"),
			],
		},
		watch: {
			usePolling: true,
			interval: 100,
		},
		hmr: {
			protocol: "ws",
			host: "127.0.0.1",
			port: 5173,
		},
	},
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				index: resolve(__dirname, "app/index.html"),
			},
		},
	},
	resolve: {
		alias: aliases,
	},
	plugins: [tailwindcss(), react(), wasm(), topLevelAwait()],
});
