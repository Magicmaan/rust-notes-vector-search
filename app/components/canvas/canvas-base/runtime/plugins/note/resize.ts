import { cloneElementWithGeometry } from "@/types";
import type { FrameContext } from "../../types";
import { RESIZE_THRESHOLD_PX } from "./constants";
import { getResizeHeading } from "./target";
import type { NoteSession, ResizePlacement } from "./types";
import { resolveResizePlacement } from "../../interaction/resize";

export function computeResizePreview(
	session: NoteSession,
	context: FrameContext,
): { moved: boolean; placement: ResizePlacement; preview: ReturnType<typeof cloneElementWithGeometry>; heading: "left" | "right" | "top" | "bottom" } | null {
	const [cellWidth, cellHeight] = context.gridSize;
	const safeZoom = Math.max(context.viewport.zoomLevel, 0.001);
	const deltaX = (context.pointer.screenX - session.startScreenX) / safeZoom;
	const deltaY = (context.pointer.screenY - session.startScreenY) / safeZoom;
	if (Math.hypot(deltaX, deltaY) < RESIZE_THRESHOLD_PX) {
		return null;
	}
	const heading = getResizeHeading(deltaX, deltaY);
	const fallbackPlacement = session.resizeLastPlacement ?? {
		x: session.baseline.x,
		y: session.baseline.y,
		width: session.baseline.width,
		height: session.baseline.height,
	};
	const placement = resolveResizePlacement({
		anchor: session.resizeAnchor,
		baseline: session.baseline,
		deltaX,
		deltaY,
		cellWidth,
		cellHeight,
		findOccupyingIds: context.ports.query.findOccupyingIds,
		getElement: context.ports.query.getElement,
		fallbackPlacement,
	});
	const preview = cloneElementWithGeometry(session.baseline, placement);
	return { moved: true, placement, preview, heading };
}
