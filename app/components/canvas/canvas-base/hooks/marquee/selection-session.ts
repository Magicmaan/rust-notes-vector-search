import type { PointerEvent as ReactPointerEvent } from "react";
import { startManagedPointerDragSession } from "@/lib/managed-pointer-drag-session";
import { DRAG_THRESHOLD_PX } from "@/lib/drag-config";
import { useEditorGridStore } from "@/providers/editor/store";
import { getIntersectingNoteIds, normalizeRect } from "./geometry";
import type { SelectionSession, WorldRect } from "./types";
import { toPointerWorldPoint } from "./viewport";

export function applySelectionFromRect({
	rect,
	startedWithShift,
	selectedIdsAtStart,
	setSelectedNoteIds,
}: {
	rect: WorldRect;
	startedWithShift: boolean;
	selectedIdsAtStart: string[];
	setSelectedNoteIds: (ids: string[]) => void;
}) {
	const state = useEditorGridStore.getState();
	const intersectingIds = getIntersectingNoteIds({
		rect,
		elements: state.elements,
		gridSize: state.gridSize,
	});

	if (startedWithShift) {
		const toggled = new Set(selectedIdsAtStart);
		for (const id of intersectingIds) {
			if (toggled.has(id)) {
				toggled.delete(id);
			} else {
				toggled.add(id);
			}
		}
		setSelectedNoteIds(Array.from(toggled));
		return;
	}

	setSelectedNoteIds(intersectingIds);
}

export function startSelectionMode({
	e,
	container,
	transform,
	state,
	selectionSessionRef,
	clearDragSession,
	dragSessionCleanupRef,
	setActiveMarqueeRect,
	setCommittedMarqueeRect,
	resetSelectionSession,
	setSelectedNoteIds,
}: {
	e: ReactPointerEvent<HTMLDivElement>;
	container: HTMLDivElement;
	transform: HTMLDivElement | null;
	state: ReturnType<typeof useEditorGridStore.getState>;
	selectionSessionRef: React.MutableRefObject<SelectionSession>;
	clearDragSession: () => void;
	dragSessionCleanupRef: React.MutableRefObject<(() => void) | null>;
	setActiveMarqueeRect: (rect: WorldRect | null) => void;
	setCommittedMarqueeRect: (rect: WorldRect | null) => void;
	resetSelectionSession: () => void;
	setSelectedNoteIds: (ids: string[]) => void;
}) {
	const startPoint = toPointerWorldPoint({
		clientX: e.clientX,
		clientY: e.clientY,
		container,
		transform,
		state,
	});

	selectionSessionRef.current.active = true;
	selectionSessionRef.current.pointerId = e.pointerId;
	selectionSessionRef.current.startedWithShift = e.shiftKey;
	selectionSessionRef.current.startWorldX = startPoint.x;
	selectionSessionRef.current.startWorldY = startPoint.y;
	selectionSessionRef.current.currentWorldX = startPoint.x;
	selectionSessionRef.current.currentWorldY = startPoint.y;
	selectionSessionRef.current.selectedIdsAtStart = [...state.selectedNoteIds];

	clearDragSession();
	dragSessionCleanupRef.current = startManagedPointerDragSession({
		target: container,
		pointerId: e.pointerId,
		startClientX: e.clientX,
		startClientY: e.clientY,
		thresholdPx: DRAG_THRESHOLD_PX,
		getZoomLevel: () => useEditorGridStore.getState().zoomLevel,
		onMove: ({ deltaPixelX, deltaPixelY }) => {
			const session = selectionSessionRef.current;
			session.currentWorldX = session.startWorldX + deltaPixelX;
			session.currentWorldY = session.startWorldY + deltaPixelY;

			const rect = normalizeRect(
				session.startWorldX,
				session.startWorldY,
				session.currentWorldX,
				session.currentWorldY,
			);
			setActiveMarqueeRect(rect);
			applySelectionFromRect({
				rect,
				startedWithShift: session.startedWithShift,
				selectedIdsAtStart: session.selectedIdsAtStart,
				setSelectedNoteIds,
			});
		},
		onComplete: ({ didDrag, deltaPixelX, deltaPixelY }) => {
			const session = selectionSessionRef.current;
			if (didDrag) {
				session.currentWorldX = session.startWorldX + deltaPixelX;
				session.currentWorldY = session.startWorldY + deltaPixelY;
				const rect = normalizeRect(
					session.startWorldX,
					session.startWorldY,
					session.currentWorldX,
					session.currentWorldY,
				);
				applySelectionFromRect({
					rect,
					startedWithShift: session.startedWithShift,
					selectedIdsAtStart: session.selectedIdsAtStart,
					setSelectedNoteIds,
				});
				setCommittedMarqueeRect(rect);
			}
			resetSelectionSession();
			setActiveMarqueeRect(null);
		},
		onCancel: ({ didDrag }) => {
			const session = selectionSessionRef.current;
			if (didDrag) {
				setSelectedNoteIds(session.selectedIdsAtStart);
			}
			resetSelectionSession();
			setActiveMarqueeRect(null);
		},
	});
}
