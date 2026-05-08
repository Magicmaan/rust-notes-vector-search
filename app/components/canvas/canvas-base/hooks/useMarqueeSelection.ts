import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
} from "react";
import { useEditorGridStore } from "@/providers/editor/store";
import type {
	GroupMoveSession,
	SelectionSession,
	WorldRect,
} from "./marquee/types";
import { pointInsideRect } from "./marquee/geometry";
import { buildGroupMoveSnapshots, toGroupMoveBounds } from "./marquee/snapshots";
import { startSelectionMode } from "./marquee/selection-session";
import { startGroupMoveMode } from "./marquee/group-move-session";
import { toPointerWorldPoint } from "./marquee/viewport";

type UseMarqueeSelectionInput = {
	containerRef: RefObject<HTMLDivElement | null>;
	transformRef: RefObject<HTMLDivElement | null>;
};

type UseMarqueeSelectionResult = {
	marqueeRect: WorldRect | null;
	handlePointerDownCapture: (e: ReactPointerEvent<HTMLDivElement>) => void;
};

export function useMarqueeSelection(
	input: UseMarqueeSelectionInput,
): UseMarqueeSelectionResult {
	const { containerRef, transformRef } = input;
	const [activeMarqueeRect, setActiveMarqueeRect] = useState<WorldRect | null>(
		null,
	);
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
	const clearSelectedNoteIds = useEditorGridStore(
		(s) => s.clearSelectedNoteIds,
	);
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
		return (
			selectionSessionRef.current.active || groupMoveSessionRef.current.active
		);
	}, []);

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
	}, [
		clearSelectedNoteIds,
		committedMarqueeRect,
		containerRef,
		isAnySessionActive,
		transformRef,
	]);

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
					groupMoveSessionRef,
					clearDragSession,
					dragSessionCleanupRef,
					updateElementsBulk,
					setActiveMarqueeRect,
					setCommittedMarqueeRect,
					resetGroupMoveSession,
				});
				return;
			}

			const transform = transformRef.current;
			const target = e.target as HTMLElement | null;
			if (
				!transform ||
				!target ||
				!transform.contains(target) ||
				target.closest(".note")
			) {
				return;
			}

			startSelectionMode({
				e,
				container,
				transform: transformRef.current,
				state,
				selectionSessionRef,
				clearDragSession,
				dragSessionCleanupRef,
				setActiveMarqueeRect,
				setCommittedMarqueeRect,
				resetSelectionSession,
				setSelectedNoteIds,
			});
		},
		[
			clearDragSession,
			committedMarqueeRect,
			containerRef,
			isAnySessionActive,
			resetGroupMoveSession,
			resetSelectionSession,
			setSelectedNoteIds,
			transformRef,
			updateElementsBulk,
		],
	);

	return {
		marqueeRect: activeMarqueeRect ?? committedMarqueeRect,
		handlePointerDownCapture,
	};
}
