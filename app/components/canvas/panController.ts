import { useEditorGridStore } from "@/providers/editor/store";

type Delta = { x: number; y: number };

let containerEl: HTMLElement | null = null;
let rafId: number | null = null;
let originX = 0;
let originY = 0;
let pendingX = 0;
let pendingY = 0;

export function setContainerOffset(el: HTMLElement | null) {
	containerEl = el;
	if (containerEl) {
		const state = useEditorGridStore.getState();
		containerEl.style.setProperty("--grid-offset-x", `${state.offsetX}px`);
		containerEl.style.setProperty("--grid-offset-y", `${state.offsetY}px`);
	}
}

export function startPan() {
	const state = useEditorGridStore.getState();
	originX = state.offsetX;
	originY = state.offsetY;
	pendingX = originX;
	pendingY = originY;
	// mark pan active in store
	const store = useEditorGridStore.getState() as any;
	if (typeof store.startPan === "function") {
		store.startPan();
	}
}

export function updatePan(deltaX: number, deltaY: number) {
	pendingX = originX + deltaX;
	pendingY = originY + deltaY;
	scheduleFrame();
}

function scheduleFrame() {
	if (rafId !== null) return;
	rafId = requestAnimationFrame(() => {
		rafId = null;
		if (!containerEl) return;
		containerEl.style.setProperty("--grid-offset-x", `${pendingX}px`);
		containerEl.style.setProperty("--grid-offset-y", `${pendingY}px`);
	});
}

export function endPan(commit: boolean, finalDelta?: Delta) {
	if (rafId !== null) {
		cancelAnimationFrame(rafId);
		rafId = null;
	}

	if (!containerEl) {
		// still update store state
		const store = useEditorGridStore.getState() as any;
		if (typeof store.endPan === "function") {
			store.endPan(commit, finalDelta);
		}
		return;
	}

	if (!commit) {
		// restore to origin
		containerEl.style.setProperty("--grid-offset-x", `${originX}px`);
		containerEl.style.setProperty("--grid-offset-y", `${originY}px`);
		const store = useEditorGridStore.getState() as any;
		if (typeof store.endPan === "function") {
			store.endPan(false);
		}
		return;
	}

	const dx =
		typeof finalDelta?.x === "number" ? finalDelta.x : pendingX - originX;
	const dy =
		typeof finalDelta?.y === "number" ? finalDelta.y : pendingY - originY;

	// commit to store
	const storeCommit = useEditorGridStore.getState() as any;
	if (typeof storeCommit.endPan === "function") {
		storeCommit.endPan(true, { x: dx, y: dy });
	}

	// reflect committed offsets in CSS
	const st = useEditorGridStore.getState();
	containerEl.style.setProperty("--grid-offset-x", `${st.offsetX}px`);
	containerEl.style.setProperty("--grid-offset-y", `${st.offsetY}px`);
}

export default {
	setContainer: setContainerOffset,
	startPan,
	updatePan,
	endPan,
};
