import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { net, protocol } from "electron";

export function registerResourcesProtocol() {
	protocol.handle("res", async (request) => {
		try {
			const url = new URL(request.url);
			// Combine hostname and pathname to get the full path
			const fullPath = join(url.hostname, url.pathname.slice(1));
			const filePath = join(__dirname, "../../resources", fullPath);
			return net.fetch(pathToFileURL(filePath).toString());
		} catch (error) {
			console.error("Protocol error:", error);
			return new Response("Resource not found", { status: 404 });
		}
	});
}
