import { useCallback, useRef, useEffect } from "react";
import { useEventBus } from "@/events";
import { NoteDisplay } from "../../../types";
import type { GridMetrics } from "./useGridMetrics";

// Constants for resize interaction behavior
const RESIZE_THRESHOLD_PX = 4;
const RESIZE_MIN_CELL_WIDTH = 2;
const RESIZE_MIN_CELL_HEIGHT = 2;

const snapToMultiple = (num: number, multiple: number) =>
	Math.round(num / multiple) * multiple;

const clampMinDimension = (value: number, minVal: number) =>
	Math.max(minVal, value);

interface ResizeAnchor {
	horizontal: "left" | "right";
	vertical: "top" | "bottom";
}
type ResizeHeading = "left" | "right" | "top" | "bottom";

interface ResizeCandidatePixels {
	pixelX: number;
	pixelY: number;
	pixelWidth: number;
	pixelHeight: number;
}

const RESIZE_ANIMATION_IN_MS = 200;
const RESIZE_ANIMATION_OUT_MS = 160;

/**
 * Session state for resize interaction.
 * Tracks starting dimensions, accumulated deltas, and session lifecycle.
 */
interface ResizeSessionState {
	active: boolean;
	pointerId: number;
	startClientX: number;
	startClientY: number;
	startPixelX: number;
	startPixelY: number;
	startPixelWidth: number;
	startPixelHeight: number;
	deltaPixelWidth: number;
	deltaPixelHeight: number;
	anchor: ResizeAnchor;
	heading: ResizeHeading;
	didResize: boolean;
	lastValidPlacement: ResizePlacement;
}

interface ResizePlacement {
	x: number;
	y: number;
	width: number;
	height: number;
	pixelX: number;
	pixelY: number;
	pixelWidth: number;
	pixelHeight: number;
}

/**
 * Positioning callbacks for rendering during interaction.
 * (Shared interface with drag interaction)
 */
interface PositioningCallbacks {
	renderAtPixelPosition: (pixelX: number, pixelY: number) => void;
	renderFromStore: () => void;
	scheduleRenderFromSession: () => void;
	cancelPendingFrame: () => void;
}

/**
 * Resize interaction return type.
 * Provides the main event handler for pointer down (right-click).
 */
interface ResizeInteraction {
	handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * Input configuration for useResizeInteraction hook.
 * Mirrors the structure of UseDragInteractionInput for consistency.
 */
interface UseResizeInteractionInput {
	wrapperRef: React.RefObject<HTMLDivElement | null>;
	element: NoteDisplay;
	grid: GridMetrics;
	store: {
		getViewport: () => { isPanning: boolean; zoomLevel: number };
		updateElement: (id: string, newElement: NoteDisplay) => void;
		isAreaFree: (
			x: number,
			y: number,
			width: number,
			height: number,
			ignoreId?: string,
		) => boolean;
		findNearestFree: (
			x: number,
			y: number,
			width: number,
			height: number,
			ignoreId: string,
			radius: number,
		) => { x: number; y: number } | null;
	};
	positioning: PositioningCallbacks;
}

/**
 * Resize interaction hook: Manage pointer events, resize state machine, snap-to-grid,
 * and collision detection. Right-click (button === 2) drag to resize note dimensions.
 * Triggered by right-click instead of left-click to avoid interference with drag positioning.
 */
export function useResizeInteraction(
	input: UseResizeInteractionInput,
): ResizeInteraction {
	const { wrapperRef, element, grid, store, positioning } = input;
	const emit = useEventBus().emit;

	const elementRef = useRef(element);
	const rafRef = useRef<number | null>(null);
	const removeWindowListenersRef = useRef<(() => void) | null>(null);
	const resizeStateTimeoutRef = useRef<number | null>(null);

	const sessionRef = useRef<ResizeSessionState>({
		active: false,
		pointerId: -1,
		startClientX: 0,
		startClientY: 0,
		startPixelX: 0,
		startPixelY: 0,
		startPixelWidth: 0,
		startPixelHeight: 0,
		deltaPixelWidth: 0,
		deltaPixelHeight: 0,
		anchor: { horizontal: "right", vertical: "bottom" },
		heading: "right",
		didResize: false,
		lastValidPlacement: {
			x: element.x,
			y: element.y,
			width: element.width,
			height: element.height,
			pixelX: element.x * grid.cellWidth,
			pixelY: element.y * grid.cellHeight,
			pixelWidth: element.width * grid.cellWidth,
			pixelHeight: element.height * grid.cellHeight,
		},
	});

	const resolveResizeAnchor = useCallback(
		(e: React.PointerEvent<HTMLDivElement>): ResizeAnchor => {
			const rect = e.currentTarget.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) {
				return { horizontal: "right", vertical: "bottom" };
			}

			const localX = e.clientX - rect.left;
			const localY = e.clientY - rect.top;

			return {
				horizontal: localX <= rect.width / 2 ? "left" : "right",
				vertical: localY <= rect.height / 2 ? "top" : "bottom",
			};
		},
		[],
	);

	const getCandidatePixels = useCallback(
		(
			session: ResizeSessionState,
			minPixelWidth: number,
			minPixelHeight: number,
		): ResizeCandidatePixels => {
			const startRight = session.startPixelX + session.startPixelWidth;
			const startBottom = session.startPixelY + session.startPixelHeight;

			const candidatePixelWidth =
				session.anchor.horizontal === "left"
					? session.startPixelWidth - session.deltaPixelWidth
					: session.startPixelWidth + session.deltaPixelWidth;
			const candidatePixelHeight =
				session.anchor.vertical === "top"
					? session.startPixelHeight - session.deltaPixelHeight
					: session.startPixelHeight + session.deltaPixelHeight;

			const clampedPixelWidth = Math.max(minPixelWidth, candidatePixelWidth);
			const clampedPixelHeight = Math.max(minPixelHeight, candidatePixelHeight);

			const clampedPixelX =
				session.anchor.horizontal === "left"
					? startRight - clampedPixelWidth
					: session.startPixelX;
			const clampedPixelY =
				session.anchor.vertical === "top"
					? startBottom - clampedPixelHeight
					: session.startPixelY;

			return {
				pixelX: clampedPixelX,
				pixelY: clampedPixelY,
				pixelWidth: clampedPixelWidth,
				pixelHeight: clampedPixelHeight,
			};
		},
		[],
	);

	// Keep element snapshot in sync; used in finalizeSession to avoid stale closures
	useEffect(() => {
		elementRef.current = element;
	}, [element]);

	const clearPointerCapture = useCallback(() => {
		if (
			wrapperRef.current &&
			sessionRef.current.pointerId >= 0 &&
			wrapperRef.current.hasPointerCapture(sessionRef.current.pointerId)
		) {
			wrapperRef.current.releasePointerCapture(sessionRef.current.pointerId);
		}
	}, [wrapperRef]);

	const removeWindowListeners = useCallback(() => {
		removeWindowListenersRef.current?.();
		removeWindowListenersRef.current = null;
	}, []);

	const clearResizeStateTimeout = useCallback(() => {
		if (resizeStateTimeoutRef.current !== null) {
			window.clearTimeout(resizeStateTimeoutRef.current);
			resizeStateTimeoutRef.current = null;
		}
	}, []);

	const getResizeState = useCallback(
		(anchor: ResizeAnchor, phase: "start" | "active" | "stop") =>
			`${phase}-${anchor.horizontal}-${anchor.vertical}`,
		[],
	);

	const getResizeHeading = useCallback(
		(deltaX: number, deltaY: number): ResizeHeading => {
			if (Math.abs(deltaX) >= Math.abs(deltaY)) {
				return deltaX < 0 ? "left" : "right";
			}
			return deltaY < 0 ? "top" : "bottom";
		},
		[],
	);

	const setResizeState = useCallback(
		(value: string) => {
			if (!wrapperRef.current) return;
			wrapperRef.current.setAttribute("data-resizing", value);
		},
		[wrapperRef],
	);

	const setResizeHeading = useCallback(
		(value: ResizeHeading | "none") => {
			if (!wrapperRef.current) return;

			wrapperRef.current.setAttribute("data-resize-heading", value);
		},
		[wrapperRef],
	);

	useEffect(() => clearResizeStateTimeout, [clearResizeStateTimeout]);

	const resolvePlacementFromSession = useCallback(
		(session: ResizeSessionState): ResizePlacement | null => {
			const minPixelWidth = RESIZE_MIN_CELL_WIDTH * grid.cellWidth;
			const minPixelHeight = RESIZE_MIN_CELL_HEIGHT * grid.cellHeight;
			const candidate = getCandidatePixels(
				session,
				minPixelWidth,
				minPixelHeight,
			);

			// Snap to grid: round candidate dimensions to nearest multiple of cell dimensions
			const snappedPixelWidth = snapToMultiple(
				candidate.pixelWidth,
				grid.cellWidth,
			);
			const snappedPixelHeight = snapToMultiple(
				candidate.pixelHeight,
				grid.cellHeight,
			);

			if (snappedPixelWidth <= 0 || snappedPixelHeight <= 0) {
				return null;
			}

			// Convert pixels back to grid units and enforce minimum span
			const snappedWidth = snappedPixelWidth / grid.cellWidth;
			const snappedHeight = snappedPixelHeight / grid.cellHeight;
			const clampedWidth = clampMinDimension(
				snappedWidth,
				RESIZE_MIN_CELL_WIDTH,
			);
			const clampedHeight = clampMinDimension(
				snappedHeight,
				RESIZE_MIN_CELL_HEIGHT,
			);
			const clampedPixelWidth = clampedWidth * grid.cellWidth;
			const clampedPixelHeight = clampedHeight * grid.cellHeight;

			const startRight = session.startPixelX + session.startPixelWidth;
			const startBottom = session.startPixelY + session.startPixelHeight;
			const clampedPixelX =
				session.anchor.horizontal === "left"
					? startRight - clampedPixelWidth
					: session.startPixelX;
			const clampedPixelY =
				session.anchor.vertical === "top"
					? startBottom - clampedPixelHeight
					: session.startPixelY;

			return {
				x: clampedPixelX / grid.cellWidth,
				y: clampedPixelY / grid.cellHeight,
				width: clampedWidth,
				height: clampedHeight,
				pixelX: clampedPixelX,
				pixelY: clampedPixelY,
				pixelWidth: clampedPixelWidth,
				pixelHeight: clampedPixelHeight,
			};
		},
		[getCandidatePixels, grid.cellHeight, grid.cellWidth],
	);

	const finalizeSession = useCallback(
		(shouldCommit: boolean) => {
			if (!sessionRef.current.active) return;

			const current = elementRef.current;
			const didResize = sessionRef.current.didResize;
			const finalizeAnchor = sessionRef.current.anchor;
			const finalizedPointerId = sessionRef.current.pointerId;
			let didCommit = false;

			if (shouldCommit && sessionRef.current.didResize) {
				const resolved = resolvePlacementFromSession(sessionRef.current);
				const placement =
					resolved &&
					store.isAreaFree(
						resolved.x,
						resolved.y,
						resolved.width,
						resolved.height,
						current.id,
					)
						? resolved
						: sessionRef.current.lastValidPlacement;

				// Update width/height CSS variables directly on wrapper
				// Note: Don't call positioning.renderAtPixelPosition() as it would overwrite size vars.
				if (wrapperRef.current) {
					wrapperRef.current.style.setProperty(
						"--offset-x",
						`${placement.pixelX}px`,
					);
					wrapperRef.current.style.setProperty(
						"--offset-y",
						`${placement.pixelY}px`,
					);
					wrapperRef.current.style.setProperty(
						"--width",
						`${placement.pixelWidth}px`,
					);
					wrapperRef.current.style.setProperty(
						"--height",
						`${placement.pixelHeight}px`,
					);
				}

				setResizeHeading("none");

				if (
					placement.x !== current.x ||
					placement.y !== current.y ||
					placement.width !== current.width ||
					placement.height !== current.height
				) {
					store.updateElement(
						current.id,
						new NoteDisplay({
							x: placement.x,
							y: placement.y,
							width: placement.width,
							height: placement.height,
							note: current.note,
							stat: current.stat,
							backgroundColor: current.backgroundColor,
						}),
					);
					didCommit = true;
				}
			}

			// Cleanup: reset session state, remove listeners, restore visual indicator
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			removeWindowListeners();
			clearPointerCapture();

			sessionRef.current.active = false;
			sessionRef.current.pointerId = -1;
			sessionRef.current.deltaPixelWidth = 0;
			sessionRef.current.deltaPixelHeight = 0;
			sessionRef.current.anchor = { horizontal: "right", vertical: "bottom" };
			sessionRef.current.heading = "right";
			sessionRef.current.didResize = false;
			sessionRef.current.lastValidPlacement = {
				x: current.x,
				y: current.y,
				width: current.width,
				height: current.height,
				pixelX: current.x * grid.cellWidth,
				pixelY: current.y * grid.cellHeight,
				pixelWidth: current.width * grid.cellWidth,
				pixelHeight: current.height * grid.cellHeight,
			};

			if (didResize) {
				clearResizeStateTimeout();
				setResizeState(getResizeState(finalizeAnchor, "stop"));
				resizeStateTimeoutRef.current = window.setTimeout(() => {
					setResizeState("none");
					setResizeHeading("none");
					resizeStateTimeoutRef.current = null;
				}, RESIZE_ANIMATION_OUT_MS);
			} else {
				setResizeState("none");
				setResizeHeading("none");
			}

			// If no commit occurred, revert visual render to store dimensions
			if (!didCommit) positioning.renderFromStore();

			emit("note:resize:end", {
				noteId: current.id,
				pointerId: finalizedPointerId,
				didResize,
				commitRequested: shouldCommit,
				commitApplied: didCommit,
			});
		},
		[
			emit,
			store,
			positioning,
			grid,
			clearPointerCapture,
			removeWindowListeners,
			resolvePlacementFromSession,
			clearResizeStateTimeout,
			getResizeState,
			setResizeHeading,
			setResizeState,
			wrapperRef,
		],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			// Ignore if canvas is being panned (prefer external pan action over element resize)
			if (store.getViewport().isPanning) return;

			// Only handle secondary (right) mouse button for resize
			// Allows drag hook to handle primary button without interference
			if (e.button !== 2 || sessionRef.current.active) {
				return;
			}

			// Suppress browser context menu on right-click
			e.preventDefault();
			e.stopPropagation();

			const current = elementRef.current;

			// Initialize resize session state
			sessionRef.current.active = true;
			sessionRef.current.pointerId = e.pointerId;
			sessionRef.current.startClientX = e.clientX;
			sessionRef.current.startClientY = e.clientY;
			sessionRef.current.startPixelX = current.x * grid.cellWidth;
			sessionRef.current.startPixelY = current.y * grid.cellHeight;
			sessionRef.current.startPixelWidth = current.width * grid.cellWidth;
			sessionRef.current.startPixelHeight = current.height * grid.cellHeight;
			sessionRef.current.deltaPixelWidth = 0;
			sessionRef.current.deltaPixelHeight = 0;
			sessionRef.current.anchor = resolveResizeAnchor(e);
			sessionRef.current.heading = "right";
			sessionRef.current.didResize = false;
			sessionRef.current.lastValidPlacement = {
				x: current.x,
				y: current.y,
				width: current.width,
				height: current.height,
				pixelX: current.x * grid.cellWidth,
				pixelY: current.y * grid.cellHeight,
				pixelWidth: current.width * grid.cellWidth,
				pixelHeight: current.height * grid.cellHeight,
			};
			emit("note:resize:start", {
				noteId: current.id,
				pointerId: e.pointerId,
				anchor: sessionRef.current.anchor,
			});

			e.currentTarget.setPointerCapture(e.pointerId);

			// State machine: idle → active → resizing
			// Transitions: pointermove (accumulate delta) → dist threshold → Visual state "resizing"
			const onWindowPointerMove = (evt: PointerEvent) => {
				if (
					!sessionRef.current.active ||
					evt.pointerId !== sessionRef.current.pointerId
				) {
					return;
				}

				// User released buttons during move (browser won't fire pointerup for some reason)
				if (evt.buttons === 0) {
					finalizeSession(true);
					return;
				}

				const deltaClientX = evt.clientX - sessionRef.current.startClientX;
				const deltaClientY = evt.clientY - sessionRef.current.startClientY;
				const distance = Math.hypot(deltaClientX, deltaClientY);

				// Distance threshold prevents accidental resize-on-click:
				// If user moved <RESIZE_THRESHOLD_PX (4px), don't enter resize mode yet.
				if (!sessionRef.current.didResize && distance < RESIZE_THRESHOLD_PX) {
					return;
				}

				// Transition to resizing state: apply visual feedback, update delta
				if (!sessionRef.current.didResize) {
					sessionRef.current.didResize = true;
					sessionRef.current.heading = getResizeHeading(
						deltaClientX,
						deltaClientY,
					);
					clearResizeStateTimeout();
					setResizeHeading(sessionRef.current.heading);
					setResizeState(getResizeState(sessionRef.current.anchor, "start"));
					resizeStateTimeoutRef.current = window.setTimeout(() => {
						setResizeState(getResizeState(sessionRef.current.anchor, "active"));
						resizeStateTimeoutRef.current = null;
					}, RESIZE_ANIMATION_IN_MS);
				}

				// Zoom adjustment: delta in client coords scaled by canvas zoom
				// Divide by safeZoom to get pixel amount in grid space.
				// Resize from SE corner: right/down movement increases size
				const safeZoom = Math.max(store.getViewport().zoomLevel, 0.001);
				sessionRef.current.deltaPixelWidth = deltaClientX / safeZoom;
				sessionRef.current.deltaPixelHeight = deltaClientY / safeZoom;

				// RAF double-check: if frame already scheduled, skip enqueueing another
				if (rafRef.current !== null) {
					return;
				}

				// Schedule RAF to batch CSS updates and prevent jank during rapid events
				rafRef.current = requestAnimationFrame(() => {
					rafRef.current = null;
					const currentElement = elementRef.current;
					const resolved = resolvePlacementFromSession(sessionRef.current);
					const placement =
						resolved &&
						store.isAreaFree(
							resolved.x,
							resolved.y,
							resolved.width,
							resolved.height,
							currentElement.id,
						)
							? resolved
							: sessionRef.current.lastValidPlacement;

					if (resolved) {
						const didResolveDifferFromLast =
							resolved.x !== sessionRef.current.lastValidPlacement.x ||
							resolved.y !== sessionRef.current.lastValidPlacement.y ||
							resolved.width !== sessionRef.current.lastValidPlacement.width ||
							resolved.height !== sessionRef.current.lastValidPlacement.height;
						if (didResolveDifferFromLast && placement === resolved) {
							sessionRef.current.lastValidPlacement = resolved;
						}
					}

					// Update CSS variables during drag for immediate visual feedback
					if (wrapperRef.current) {
						wrapperRef.current.style.setProperty(
							"--offset-x",
							`${placement.pixelX}px`,
						);
						wrapperRef.current.style.setProperty(
							"--offset-y",
							`${placement.pixelY}px`,
						);
						wrapperRef.current.style.setProperty(
							"--width",
							`${placement.pixelWidth}px`,
						);
						wrapperRef.current.style.setProperty(
							"--height",
							`${placement.pixelHeight}px`,
						);
					}

					emit("note:resize:update", {
						noteId: currentElement.id,
						pointerId: sessionRef.current.pointerId,
						deltaPixelWidth: sessionRef.current.deltaPixelWidth,
						deltaPixelHeight: sessionRef.current.deltaPixelHeight,
					});
				});
			};

			const onWindowPointerUp = (evt: PointerEvent) => {
				if (
					!sessionRef.current.active ||
					evt.pointerId !== sessionRef.current.pointerId
				) {
					return;
				}

				removeWindowListeners();
				finalizeSession(true);
			};

			const onWindowPointerCancel = (evt: PointerEvent) => {
				if (
					!sessionRef.current.active ||
					evt.pointerId !== sessionRef.current.pointerId
				) {
					return;
				}

				finalizeSession(sessionRef.current.didResize);
			};

			const onWindowBlur = () => {
				if (!sessionRef.current.active) {
					return;
				}

				finalizeSession(sessionRef.current.didResize);
			};

			// Attach window-level listeners for move and up events
			// Ensures resize tracking works even when pointer leaves wrapper
			window.addEventListener("pointermove", onWindowPointerMove, true);
			window.addEventListener("pointerup", onWindowPointerUp, true);
			window.addEventListener("pointercancel", onWindowPointerCancel, true);
			window.addEventListener("blur", onWindowBlur, true);

			removeWindowListenersRef.current = () => {
				window.removeEventListener("pointermove", onWindowPointerMove, true);
				window.removeEventListener("pointerup", onWindowPointerUp, true);
				window.removeEventListener(
					"pointercancel",
					onWindowPointerCancel,
					true,
				);
				window.removeEventListener("blur", onWindowBlur, true);
			};
		},
		[
			emit,
			store,
			grid,
			finalizeSession,
			removeWindowListeners,
			resolveResizeAnchor,
			resolvePlacementFromSession,
			clearResizeStateTimeout,
			getResizeHeading,
			getResizeState,
			setResizeHeading,
			setResizeState,
			wrapperRef,
		],
	);

	useEffect(() => {
		return () => {
			finalizeSession(false);
			clearResizeStateTimeout();
			removeWindowListeners();
			clearPointerCapture();
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
		};
	}, [
		clearPointerCapture,
		clearResizeStateTimeout,
		finalizeSession,
		removeWindowListeners,
	]);

	return { handlePointerDown };
}
