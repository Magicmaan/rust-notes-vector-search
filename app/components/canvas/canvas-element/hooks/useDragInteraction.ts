import { useCallback, useRef, useEffect } from "react";
import { useEventBus } from "@/events";
import { cloneElementWithGeometry, type AnyCanvasElementDisplay } from "@/types";
import type { GridMetrics } from "./useGridMetrics";
import { resolveMovementCommit } from "@/lib/movement-commit";
import { startManagedPointerDragSession } from "@/lib/managed-pointer-drag-session";

const NOTE_DRAG_THRESHOLD_PX = 2;
const SNAP_SEARCH_RADIUS = 20;

interface DragSessionState {
	active: boolean;
	pointerId: number;
	startClientX: number;
	startClientY: number;
	startPixelX: number;
	startPixelY: number;
	deltaPixelX: number;
	deltaPixelY: number;
	didDrag: boolean;
}

interface PositioningCallbacks {
	renderAtPixelPosition: (pixelX: number, pixelY: number) => void;
	renderFromStore: () => void;
	scheduleRenderFromSession: () => void;
	cancelPendingFrame: () => void;
}

interface DragInteraction {
	handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

interface UseDragInteractionInput {
	wrapperRef: React.RefObject<HTMLDivElement | null>;
	element: AnyCanvasElementDisplay;
	grid: GridMetrics;
	store: {
		getViewport: () => { isPanning: boolean; zoomLevel: number };
		updateElement: (id: string, newElement: AnyCanvasElementDisplay) => void;
		isAreaFree: (
			x: number,
			y: number,
			width: number,
			height: number,
			ignoreId?: string | string[],
		) => boolean;
		findNearestFree: (
			x: number,
			y: number,
			width: number,
			height: number,
			ignoreId?: string | string[],
			radius?: number,
		) => { x: number; y: number } | null;
	};
	positioning: PositioningCallbacks;
}

/**
 * Drag interaction hook: Manage pointer events, drag state machine, snap-to-grid,
 * and collision detection. Includes all window event listeners and finalization logic.
 */
export function useDragInteraction(
	input: UseDragInteractionInput,
): DragInteraction {
	const { wrapperRef, element, grid, store, positioning } = input;
	const emit = useEventBus().emit;

	const elementRef = useRef(element);
	const rafRef = useRef<number | null>(null);
	const dragSessionCleanupRef = useRef<(() => void) | null>(null);

	const sessionRef = useRef<DragSessionState>({
		active: false,
		pointerId: -1,
		startClientX: 0,
		startClientY: 0,
		startPixelX: 0,
		startPixelY: 0,
		deltaPixelX: 0,
		deltaPixelY: 0,
		didDrag: false,
	});

	// Keep element snapshot in sync; used in finalizeSession to avoid stale closures
	useEffect(() => {
		elementRef.current = element;
	}, [element]);

	const clearDragSession = useCallback(() => {
		dragSessionCleanupRef.current?.();
		dragSessionCleanupRef.current = null;
	}, []);

	const finalizeSession = useCallback(
		(shouldCommit: boolean) => {
			if (!sessionRef.current.active) return;

			const current = elementRef.current;
			const finalizedPointerId = sessionRef.current.pointerId;
			const didDrag = sessionRef.current.didDrag;
			let didCommit = false;

			if (shouldCommit && sessionRef.current.didDrag) {
				const result = resolveMovementCommit({
					bounds: {
						gridX: current.x,
						gridY: current.y,
						gridWidth: current.width,
						gridHeight: current.height,
						pixelX: sessionRef.current.startPixelX,
						pixelY: sessionRef.current.startPixelY,
					},
					deltaPixelX: sessionRef.current.deltaPixelX,
					deltaPixelY: sessionRef.current.deltaPixelY,
					cellWidth: grid.cellWidth,
					cellHeight: grid.cellHeight,
					excludeIds: current.id,
					searchRadius: SNAP_SEARCH_RADIUS,
					isAreaFree: store.isAreaFree,
					findNearestFree: store.findNearestFree,
				});

				if (result.committed) {
					positioning.renderAtPixelPosition(
						result.resolvedPixelX,
						result.resolvedPixelY,
					);
					store.updateElement(
						current.id,
						cloneElementWithGeometry(current, { x: result.resolvedGridX, y: result.resolvedGridY }),
					);
					didCommit = true;
				}
			}

			// Cleanup: reset session state, remove listeners, restore visual indicator
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			clearDragSession();

			sessionRef.current.active = false;
			sessionRef.current.pointerId = -1;
			sessionRef.current.deltaPixelX = 0;
			sessionRef.current.deltaPixelY = 0;
			sessionRef.current.didDrag = false;

			wrapperRef.current?.setAttribute("data-dragging", "false");

			// If no commit occurred, revert visual render to store position
			if (!didCommit) positioning.renderFromStore();

			emit("note:drag:end", {
				noteId: current.id,
				pointerId: finalizedPointerId,
				didDrag,
				commitRequested: shouldCommit,
				commitApplied: didCommit,
			});
		},
		[emit, store, positioning, grid, clearDragSession, wrapperRef],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			// Guard by explicit gesture intent: while Space is held, canvas pan owns drag.
			// This avoids false negatives when store-level isPanning gets temporarily stale.
			if (e.nativeEvent instanceof PointerEvent && e.nativeEvent.getModifierState("Space")) {
				return;
			}
			e.stopPropagation();

			// Only handle primary (left) mouse button or first touch
			if (e.button !== 0 || sessionRef.current.active) {
				return;
			}

			const current = elementRef.current;

			// Initialize drag session state
			sessionRef.current.active = true;
			sessionRef.current.pointerId = e.pointerId;
			sessionRef.current.startClientX = e.clientX;
			sessionRef.current.startClientY = e.clientY;
			sessionRef.current.startPixelX = current.x * grid.cellWidth;
			sessionRef.current.startPixelY = current.y * grid.cellHeight;
			sessionRef.current.deltaPixelX = 0;
			sessionRef.current.deltaPixelY = 0;
			sessionRef.current.didDrag = false;

			positioning.renderAtPixelPosition(
				sessionRef.current.startPixelX,
				sessionRef.current.startPixelY,
			);
			emit("note:drag:start", {
				noteId: current.id,
				pointerId: e.pointerId,
				startClientX: e.clientX,
				startClientY: e.clientY,
			});

			clearDragSession();
			dragSessionCleanupRef.current = startManagedPointerDragSession({
				target: e.currentTarget,
				pointerId: e.pointerId,
				startClientX: e.clientX,
				startClientY: e.clientY,
				thresholdPx: NOTE_DRAG_THRESHOLD_PX,
				getZoomLevel: () => store.getViewport().zoomLevel,
				onDragStateChange: () => {
					sessionRef.current.didDrag = true;
					wrapperRef.current?.setAttribute("data-dragging", "true");
				},
				onMove: ({ deltaPixelX, deltaPixelY }) => {
					sessionRef.current.deltaPixelX = deltaPixelX;
					sessionRef.current.deltaPixelY = deltaPixelY;

					// RAF double-check: if frame already scheduled, skip enqueueing another
					if (rafRef.current !== null) {
						return;
					}

					// Schedule RAF to batch CSS updates and prevent jank during rapid events
					rafRef.current = requestAnimationFrame(() => {
						rafRef.current = null;
						const candidatePixelX =
							sessionRef.current.startPixelX + sessionRef.current.deltaPixelX;
						const candidatePixelY =
							sessionRef.current.startPixelY + sessionRef.current.deltaPixelY;
						positioning.renderAtPixelPosition(candidatePixelX, candidatePixelY);
						emit("note:drag:update", {
							noteId: current.id,
							pointerId: sessionRef.current.pointerId,
							deltaPixelX: sessionRef.current.deltaPixelX,
							deltaPixelY: sessionRef.current.deltaPixelY,
						});
					});
				},
				onComplete: ({ didDrag, deltaPixelX, deltaPixelY }) => {
					sessionRef.current.didDrag = didDrag;
					sessionRef.current.deltaPixelX = deltaPixelX;
					sessionRef.current.deltaPixelY = deltaPixelY;
					finalizeSession(true);
				},
				onCancel: ({ didDrag, deltaPixelX, deltaPixelY }) => {
					sessionRef.current.didDrag = didDrag;
					sessionRef.current.deltaPixelX = deltaPixelX;
					sessionRef.current.deltaPixelY = deltaPixelY;
					finalizeSession(sessionRef.current.didDrag);
				},
			});
		},
		[
			emit,
			store,
			grid,
			positioning,
			clearDragSession,
			finalizeSession,
			wrapperRef,
		],
	);

	// Cleanup on unmount: abort any pending drag session
	useEffect(() => {
		return () => {
			finalizeSession(false);
		};
	}, [finalizeSession]);

	return { handlePointerDown };
}
