#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = [
	"app/components/canvas/canvas-base/runtime/plugins",
	"app/components/canvas/canvas-base/runtime/interaction",
];
const FORBIDDEN = ["useEditorGridStore", "@/providers/editor/store"];

function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) out.push(...walk(full));
		else if (/\.(ts|tsx)$/.test(full)) out.push(full);
	}
	return out;
}

const files = ROOTS.flatMap((d) => walk(d));
const violations = [];
for (const file of files) {
	const content = readFileSync(file, "utf8");
	for (const token of FORBIDDEN) {
		if (content.includes(token)) violations.push({ file, token });
	}
}

if (violations.length > 0) {
	console.error("Canvas runtime boundary violations found:");
	for (const v of violations) {
		console.error(`- ${v.file}: contains ${v.token}`);
	}
	process.exit(1);
}

console.log("Canvas runtime boundary check passed.");
