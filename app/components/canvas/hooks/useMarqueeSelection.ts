import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
} from "react";
import { useEditorGridStore } from "@/providers/editor/store";
import { NoteDisplay } from "@/types";
import { resolveMovementCommit } from "@/lib/movement-commit";
import { DRAG_THRESHOLD_PX } from "@/lib/drag-config";
import { startManagedPointerDragSession } from "@/lib/managed-pointer-drag-session";
import {
	getEffectiveViewportTransform,
	worldPointFromClient,
	type ViewportTransform,
} from "@/components/canvas/lib/viewport-transform";

const GROUP_SNAP_SEARCH_RADIUS = 20;

type WorldRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type SelectionSession = {
	active: boolean;
	pointerId: number;
	startedWithShift: boolean;
	startWorldX: number;
	startWorldY: number;
	currentWorldX: number;
	currentWorldY: number;
	selectedIdsAtStart: string[];
};

type GroupMoveSnapshotItem = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	note: NoteDisplay["note"];
	stat: boolean;
	backgroundColor?: string;
};

type GroupMoveBounds = {
	gridX: number;
	gridY: number;
	gridWidth: number;
	gridHeight: number;
	pixelX: number;
	pixelY: number;
	pixelWidth: number;
	pixelHeight: number;
};

type GroupMoveSession = {
	active: boolean;
	pointerId: number;
};

interface GroupMovableTarget {
	bounds: GroupMoveBounds;
	selectedIds: string[];
	buildPreview: (deltaPixelX: number, deltaPixelY: number) => NoteDisplay[];
	commit: (resolvedGridX: number, resolvedGridY: number) => NoteDisplay[];
	rollback: () => NoteDisplay[];
}

type UseMarqueeSelectionInput = {
	containerRef: RefObject<HTMLDivElement | null>;
	transformRef: RefObject<HTMLDivElement | null>;
};

type UseMarqueeSelectionResult = {
	marqueeRect: WorldRect | null;
	handlePointerDownCapture: (e: ReactPointerEvent<HTMLDivElement>) => void;
};

function normalizeRect(aX: number, aY: number, bX: number, bY: number): WorldRect {
	const left = Math.min(aX, bX);
	const top = Math.min(aY, bY);
	const right = Math.max(aX, bX);
	const bottom = Math.max(aY, bY);

	return {
		x: left,
		y: top,
		width: right - left,
		height: bottom - top,
	};
}

function rectanglesOverlap(a: WorldRect, b: WorldRect) {
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

function pointInsideRect(point: { x: number; y: number }, rect: WorldRect) {
	return (
		point.x >= rect.x &&
		point.x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect.height
	);
}

function getIntersectingNoteIds({
	rect,
	elements,
	gridSize,
}: {
	rect: WorldRect;
	elements: Record<string, NoteDisplay>;
	gridSize: [number, number];
}) {
	const [cellWidth, cellHeight] = gridSize;
	const nextIds: string[] = [];

	for (const element of Object.values(elements)) {
		const noteRect: WorldRect = {
			x: element.x * cellWidth,
			y: element.y * cellHeight,
			width: element.width * cellWidth,
			height: element.height * cellHeight,
		};

		if (rectanglesOverlap(rect, noteRect)) {
			nextIds.push(element.id);
		}
	}

	return nextIds;
}

function toGroupMoveBounds(
	snapshots: GroupMoveSnapshotItem[],
	gridSize: [number, number],
): GroupMoveBounds | null {
	if (snapshots.length === 0) {
		return null;
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const item of snapshots) {
		minX = Math.min(minX, item.x);
		minY = Math.min(minY, item.y);
		maxX = Math.max(maxX, item.x + item.width);
		maxY = Math.max(maxY, item.y + item.height);
	}

	const [cellWidth, cellHeight] = gridSize;
	const gridWidth = maxX - minX;
	const gridHeight = maxY - minY;

	return {
		gridX: minX,
		gridY: minY,
		gridWidth,
		gridHeight,
		pixelX: minX * cellWidth,
		pixelY: minY * cellHeight,
		pixelWidth: gridWidth * cellWidth,
		pixelHeight: gridHeight * cellHeight,
	};
}

function buildDisplay(snapshot: GroupMoveSnapshotItem, x: number, y: number) {
	return new NoteDisplay({
		x,
		y,
		width: snapshot.width,
		height: snapshot.height,
		note: snapshot.note,
		stat: snapshot.stat,
		backgroundColor: snapshot.backgroundColor,
	});
}

function toViewportTransform(state: ReturnType<typeof useEditorGridStore.getState>): ViewportTransform {
	return {
		offsetX: state.offsetX,
		offsetY: state.offsetY,
		zoomLevel: state.zoomLevel,
	};
}

function toPointerWorldPoint({
	clientX,
	clientY,
	container,
	transform,
	state,
}: {
	clientX: number;
	clientY: number;
	container: HTMLDivElement;
	transform: HTMLDivElement | null;
	state: ReturnType<typeof useEditorGridStore.getState>;
}) {
	const viewport = getEffectiveViewportTransform(transform, toViewportTransform(state));
	return worldPointFromClient(clientX, clientY, container, viewport);
}

function buildGroupMoveSnapshots(
	state: ReturnType<typeof useEditorGridStore.getState>,
): GroupMoveSnapshotItem[] {
	return state.selectedNoteIds
		.map((id) => state.elements[id])
		.filter((element): element is NoteDisplay => Boolean(element))
		.map((element) => ({
			id: element.id,
			x: element.x,
			y: element.y,
			width: element.width,
			height: element.height,
			note: element.note,
			stat: element.stat,
			backgroundColor: element.backgroundColor,
		}));
}

function createGroupMovableTarget({
	snapshots,
	bounds,
	gridSize,
}: {
	snapshots: GroupMoveSnapshotItem[];
	bounds: GroupMoveBounds;
	gridSize: [number, number];
}): GroupMovableTarget {
	const [cellWidth, cellHeight] = gridSize;
	const selectedIds = snapshots.map((item) => item.id);

	return {
		bounds,
		selectedIds,
		buildPreview: (deltaPixelX: number, deltaPixelY: number) => {
			return snapshots.map((snapshot) =>
				buildDisplay(
					snapshot,
					snapshot.x + deltaPixelX / cellWidth,
					snapshot.y + deltaPixelY / cellHeight,
				),
			);
		},
		commit: (resolvedGridX: number, resolvedGridY: number) => {
			const deltaGridX = resolvedGridX - bounds.gridX;
			const deltaGridY = resolvedGridY - bounds.gridY;
			return snapshots.map((snapshot) =>
				buildDisplay(snapshot, snapshot.x + deltaGridX, snapshot.y + deltaGridY),
			);
		},
		rollback: () => {
			return snapshots.map((snapshot) =>
				buildDisplay(snapshot, snapshot.x, snapshot.y),
			);
		},
	};
}

export function useMarqueeSelection(
	input: UseMarqueeSelectionInput,
): UseMarqueeSelectionResult {
	const { containerRef, transformRef } = input;
	const [activeMarqueeRect, setActiveMarqueeRect] = useState<WorldRect | null>(null);
	const [committedMarqueeRect, setCommittedMarqueeRect] =
		useState<WorldRect | null>(null);

	const dragSessionCleanupRef = useRef<(() => void) | null>(null);
	const spaceHeldRef = useRef(false);
	const selectionSessionRef = useRef<SelectionSession>({
		active: false,
		pointerId: -1,
		startedWithShift: false,
		startWorldX: 0,
		startWorldY: 0,
		currentWorldX: 0,
		currentWorldY: 0,
		selectedIdsAtStart: [],
	});
	const groupMoveSessionRef = useRef<GroupMoveSession>({
		active: false,
		pointerId: -1,
	});

	const setSelectedNoteIds = useEditorGridStore((s) => s.setSelectedNoteIds);
	const clearSelectedNoteIds = useEditorGridStore((s) => s.clearSelectedNoteIds);
	const updateElementsBulk = useEditorGridStore((s) => s.updateElementsBulk);

	const clearDragSession = useCallback(() => {
		dragSessionCleanupRef.current?.();
		dragSessionCleanupRef.current = null;
	}, []);

	const resetSelectionSession = useCallback(() => {
		selectionSessionRef.current.active = false;
		selectionSessionRef.current.pointerId = -1;
	}, []);

	const resetGroupMoveSession = useCallback(() => {
		groupMoveSessionRef.current.active = false;
		groupMoveSessionRef.current.pointerId = -1;
	}, []);

	const isAnySessionActive = useCallback(() => {
		return selectionSessionRef.current.active || groupMoveSessionRef.current.active;
	}, []);

	const applySelectionFromRect = useCallback(
		(
			rect: WorldRect,
			startedWithShift: boolean,
			selectedIdsAtStart: string[],
		) => {
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
		},
		[setSelectedNoteIds],
	);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.code === "Space" || event.key === " ") {
				spaceHeldRef.current = true;
			}
		};

		const onKeyUp = (event: KeyboardEvent) => {
			if (event.code === "Space" || event.key === " ") {
				spaceHeldRef.current = false;
			}
		};

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, []);

	useEffect(() => {
		return () => {
			clearDragSession();
		};
	}, [clearDragSession]);

	useEffect(() => {
		if (!committedMarqueeRect) {
			return;
		}

		const onWindowPointerDown = (event: PointerEvent) => {
			if (event.button !== 0 || isAnySessionActive()) {
				return;
			}

			const container = containerRef.current;
			const target = event.target as Node | null;

			if (!container || !target || !container.contains(target)) {
				setCommittedMarqueeRect(null);
				clearSelectedNoteIds();
				return;
			}

			const state = useEditorGridStore.getState();
			const pointerWorld = toPointerWorldPoint({
				clientX: event.clientX,
				clientY: event.clientY,
				container,
				transform: transformRef.current,
				state,
			});

			if (!pointInsideRect(pointerWorld, committedMarqueeRect)) {
				setCommittedMarqueeRect(null);
				clearSelectedNoteIds();
			}
		};

		window.addEventListener("pointerdown", onWindowPointerDown, true);
		return () => {
			window.removeEventListener("pointerdown", onWindowPointerDown, true);
		};
	}, [clearSelectedNoteIds, committedMarqueeRect, containerRef, isAnySessionActive, transformRef]);

	const startSelectionMode = useCallback(
		({
			e,
			container,
			state,
		}: {
			e: ReactPointerEvent<HTMLDivElement>;
			container: HTMLDivElement;
			state: ReturnType<typeof useEditorGridStore.getState>;
		}) => {
			const startPoint = toPointerWorldPoint({
				clientX: e.clientX,
				clientY: e.clientY,
				container,
				transform: transformRef.current,
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
					applySelectionFromRect(
						rect,
						session.startedWithShift,
						session.selectedIdsAtStart,
					);
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
						applySelectionFromRect(
							rect,
							session.startedWithShift,
							session.selectedIdsAtStart,
						);
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
		},
		[
			applySelectionFromRect,
			clearDragSession,
			resetSelectionSession,
			setSelectedNoteIds,
			transformRef,
		],
	);

	const startGroupMoveMode = useCallback(
		({
			e,
			container,
			state,
			snapshots,
			bounds,
		}: {
			e: ReactPointerEvent<HTMLDivElement>;
			container: HTMLDivElement;
			state: ReturnType<typeof useEditorGridStore.getState>;
			snapshots: GroupMoveSnapshotItem[];
			bounds: GroupMoveBounds;
		}) => {
			groupMoveSessionRef.current.active = true;
			groupMoveSessionRef.current.pointerId = e.pointerId;

			const groupTarget = createGroupMovableTarget({
				snapshots,
				bounds,
				gridSize: state.gridSize,
			});

			clearDragSession();
			dragSessionCleanupRef.current = startManagedPointerDragSession({
				target: container,
				pointerId: e.pointerId,
				startClientX: e.clientX,
				startClientY: e.clientY,
				thresholdPx: DRAG_THRESHOLD_PX,
				getZoomLevel: () => useEditorGridStore.getState().zoomLevel,
				onMove: ({ deltaPixelX, deltaPixelY }) => {
					updateElementsBulk(groupTarget.buildPreview(deltaPixelX, deltaPixelY));
					setActiveMarqueeRect({
						x: groupTarget.bounds.pixelX + deltaPixelX,
						y: groupTarget.bounds.pixelY + deltaPixelY,
						width: groupTarget.bounds.pixelWidth,
						height: groupTarget.bounds.pixelHeight,
					});
				},
				onComplete: ({ didDrag, deltaPixelX, deltaPixelY }) => {
					if (!didDrag) {
						resetGroupMoveSession();
						setActiveMarqueeRect(null);
						return;
					}

					const [cellWidth, cellHeight] = state.gridSize;
					const result = resolveMovementCommit({
						bounds: {
							gridX: groupTarget.bounds.gridX,
							gridY: groupTarget.bounds.gridY,
							gridWidth: groupTarget.bounds.gridWidth,
							gridHeight: groupTarget.bounds.gridHeight,
							pixelX: groupTarget.bounds.pixelX,
							pixelY: groupTarget.bounds.pixelY,
						},
						deltaPixelX,
						deltaPixelY,
						cellWidth,
						cellHeight,
						excludeIds: groupTarget.selectedIds,
						searchRadius: GROUP_SNAP_SEARCH_RADIUS,
						isAreaFree: state.isAreaFree,
						findNearestFree: state.findNearestFree,
					});

					if (result.committed) {
						updateElementsBulk(
							groupTarget.commit(result.resolvedGridX, result.resolvedGridY),
						);
					} else {
						updateElementsBulk(groupTarget.rollback());
					}
					setCommittedMarqueeRect({
						x: result.resolvedPixelX,
						y: result.resolvedPixelY,
						width: groupTarget.bounds.pixelWidth,
						height: groupTarget.bounds.pixelHeight,
					});

					resetGroupMoveSession();
					setActiveMarqueeRect(null);
				},
				onCancel: ({ didDrag }) => {
					if (didDrag) {
						updateElementsBulk(groupTarget.rollback());
					}
					resetGroupMoveSession();
					setActiveMarqueeRect(null);
				},
			});
		},
		[clearDragSession, resetGroupMoveSession, updateElementsBulk],
	);

	const handlePointerDownCapture = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			const container = containerRef.current;
			if (!container) {
				return;
			}
			if (spaceHeldRef.current) {
				return;
			}
			if (e.button !== 0 || isAnySessionActive()) {
				return;
			}

			const state = useEditorGridStore.getState();
			if (state.isPanning) {
				return;
			}

			const pointerWorld = toPointerWorldPoint({
				clientX: e.clientX,
				clientY: e.clientY,
				container,
				transform: transformRef.current,
				state,
			});

			if (
				committedMarqueeRect &&
				state.selectedNoteIds.length > 0 &&
				pointInsideRect(pointerWorld, committedMarqueeRect)
			) {
				const snapshots = buildGroupMoveSnapshots(state);
				const bounds = toGroupMoveBounds(snapshots, state.gridSize);
				if (!bounds) {
					return;
				}

				e.stopPropagation();
				e.preventDefault();
				startGroupMoveMode({
					e,
					container,
					state,
					snapshots,
					bounds,
				});
				return;
			}

			const transform = transformRef.current;
			const target = e.target as HTMLElement | null;
			if (!transform || !target || !transform.contains(target) || target.closest(".note")) {
				return;
			}

			startSelectionMode({ e, container, state });
		},
		[
			committedMarqueeRect,
			containerRef,
			isAnySessionActive,
			startGroupMoveMode,
			startSelectionMode,
			transformRef,
		],
	);

	return {
		marqueeRect: activeMarqueeRect ?? committedMarqueeRect,
		handlePointerDownCapture,
	};
}
