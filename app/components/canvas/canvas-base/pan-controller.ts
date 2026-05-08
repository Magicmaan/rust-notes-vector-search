import { useEditorGridStore } from "@/providers/editor/store";
import {
	VIEWPORT_CSS_VAR_OFFSET_X,
	VIEWPORT_CSS_VAR_OFFSET_Y,
} from "./constants/viewport-css-vars";

type Delta = { x: number; y: number };

type PanControllerState = {
	containerEl: HTMLElement | null;
	animationFrameId: number | null;
	originX: number;
	originY: number;
	pendingX: number;
	pendingY: number;
};

const panControllerState: PanControllerState = {
	containerEl: null,
	animationFrameId: null,
	originX: 0,
	originY: 0,
	pendingX: 0,
	pendingY: 0,
};

export function setContainerOffset(el: HTMLElement | null) {
	panControllerState.containerEl = el;
	if (panControllerState.containerEl) {
		const storeState = useEditorGridStore.getState();
		panControllerState.containerEl.style.setProperty(
			VIEWPORT_CSS_VAR_OFFSET_X,
			`${storeState.offsetX}px`,
		);
		panControllerState.containerEl.style.setProperty(
			VIEWPORT_CSS_VAR_OFFSET_Y,
			`${storeState.offsetY}px`,
		);
	}
}

export function startPan() {
	const storeState = useEditorGridStore.getState();
	panControllerState.originX = storeState.offsetX;
	panControllerState.originY = storeState.offsetY;
	panControllerState.pendingX = panControllerState.originX;
	panControllerState.pendingY = panControllerState.originY;
	storeState.startPan();
}

export function updatePan(deltaX: number, deltaY: number) {
	panControllerState.pendingX = panControllerState.originX + deltaX;
	panControllerState.pendingY = panControllerState.originY + deltaY;
	scheduleFrame();
}

function scheduleFrame() {
	if (panControllerState.animationFrameId !== null) return;
	panControllerState.animationFrameId = requestAnimationFrame(() => {
		panControllerState.animationFrameId = null;
		if (!panControllerState.containerEl) return;
		panControllerState.containerEl.style.setProperty(
			VIEWPORT_CSS_VAR_OFFSET_X,
			`${panControllerState.pendingX}px`,
		);
		panControllerState.containerEl.style.setProperty(
			VIEWPORT_CSS_VAR_OFFSET_Y,
			`${panControllerState.pendingY}px`,
		);
	});
}

export function endPan(commit: boolean, finalDelta?: Delta) {
	if (panControllerState.animationFrameId !== null) {
		cancelAnimationFrame(panControllerState.animationFrameId);
		panControllerState.animationFrameId = null;
	}

	if (!panControllerState.containerEl) {
		const storeState = useEditorGridStore.getState();
		storeState.endPan(commit, finalDelta);

		return;
	}

	if (!commit) {
		panControllerState.containerEl.style.setProperty(
			VIEWPORT_CSS_VAR_OFFSET_X,
			`${panControllerState.originX}px`,
		);
		panControllerState.containerEl.style.setProperty(
			VIEWPORT_CSS_VAR_OFFSET_Y,
			`${panControllerState.originY}px`,
		);
		const storeState = useEditorGridStore.getState();
		storeState.endPan(false);
		return;
	}

	const dx =
		typeof finalDelta?.x === "number"
			? finalDelta.x
			: panControllerState.pendingX - panControllerState.originX;
	const dy =
		typeof finalDelta?.y === "number"
			? finalDelta.y
			: panControllerState.pendingY - panControllerState.originY;

	const storeState = useEditorGridStore.getState();
	storeState.endPan(true, { x: dx, y: dy });

	const committedState = useEditorGridStore.getState();
	panControllerState.containerEl.style.setProperty(
		VIEWPORT_CSS_VAR_OFFSET_X,
		`${committedState.offsetX}px`,
	);
	panControllerState.containerEl.style.setProperty(
		VIEWPORT_CSS_VAR_OFFSET_Y,
		`${committedState.offsetY}px`,
	);
}

export default {
	setContainer: setContainerOffset,
	startPan,
	updatePan,
	endPan,
};
