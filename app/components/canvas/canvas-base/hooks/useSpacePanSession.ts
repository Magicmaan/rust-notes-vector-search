import { useEffect, useRef } from "react";
import type { EventBus } from "@/events/schema";
import { setContainerOffset as setPanContainer } from "../pan-controller";

type UseSpacePanSessionInput = {
	containerRef: React.RefObject<HTMLDivElement | null>;
	emit: EventBus["emit"];
};

export function useSpacePanSession({
	containerRef,
	emit,
}: UseSpacePanSessionInput) {
	const panCleanupRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		setPanContainer(
			document.getElementById("editor-grid-transform") as HTMLElement | null,
		);

		const container = containerRef.current;
		if (!container) return;

		const spaceHeldState = { value: false };
		const panSession = {
			active: false,
			pointerId: -1,
			startX: 0,
			startY: 0,
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.code === "Space" || event.key === " ") {
				const target = event.target as HTMLElement | null;
				if (
					target &&
					(target.tagName === "INPUT" ||
						target.tagName === "TEXTAREA" ||
						target.isContentEditable)
				) {
					return;
				}
				spaceHeldState.value = true;
			}
		};

		const onKeyUp = (event: KeyboardEvent) => {
			if (event.code === "Space" || event.key === " ") {
				spaceHeldState.value = false;
			}
		};

		const endPanSession = (
			commit: boolean,
			delta: { x: number; y: number } = { x: 0, y: 0 },
		) => {
			if (!panSession.active) {
				return;
			}
			try {
				container.releasePointerCapture(panSession.pointerId);
			} catch {
				// ignore
			}
			emit("canvas:pan:end", {
				pointerId: panSession.pointerId,
				commit,
				deltaX: delta.x,
				deltaY: delta.y,
			});
			panSession.active = false;
			panSession.pointerId = -1;
			document.body.classList.remove("panning-inert");
		};

		const startPanFromPointerDown = (event: PointerEvent) => {
			if (!spaceHeldState.value || event.button !== 0) return;
			panCleanupRef.current?.();

			panSession.active = true;
			panSession.pointerId = event.pointerId;
			panSession.startX = event.clientX;
			panSession.startY = event.clientY;

			try {
				container.setPointerCapture(event.pointerId);
			} catch {
				// ignore
			}

			document.body.classList.add("panning-inert");
			emit("canvas:pan:start", {
				pointerId: event.pointerId,
				startX: event.clientX,
				startY: event.clientY,
			});

			const onWindowMove = (windowEvent: PointerEvent) => {
				if (!panSession.active || windowEvent.pointerId !== panSession.pointerId)
					return;
				const deltaX = windowEvent.clientX - panSession.startX;
				const deltaY = windowEvent.clientY - panSession.startY;
				emit("canvas:pan:update", {
					pointerId: windowEvent.pointerId,
					deltaX,
					deltaY,
				});
			};

			const cleanupWindowListeners = () => {
				window.removeEventListener("pointermove", onWindowMove, true);
				window.removeEventListener("pointerup", onWindowUp, true);
				window.removeEventListener("pointercancel", onWindowCancel, true);
				window.removeEventListener("blur", onWindowBlur, true);
				panCleanupRef.current = null;
			};

			const onWindowUp = (windowEvent: PointerEvent) => {
				if (!panSession.active || windowEvent.pointerId !== panSession.pointerId)
					return;
				const deltaX = windowEvent.clientX - panSession.startX;
				const deltaY = windowEvent.clientY - panSession.startY;
				endPanSession(true, { x: deltaX, y: deltaY });
				cleanupWindowListeners();
			};

			const onWindowCancel = (windowEvent: PointerEvent) => {
				if (!panSession.active || windowEvent.pointerId !== panSession.pointerId)
					return;
				try {
					container.releasePointerCapture(windowEvent.pointerId);
				} catch {
					console.warn(
						"Failed to release pointer capture on cancel",
						windowEvent.pointerId,
					);
				}
				endPanSession(false);
				cleanupWindowListeners();
			};

			const onWindowBlur = () => {
				if (!panSession.active) return;
				endPanSession(false);
				cleanupWindowListeners();
			};

			window.addEventListener("pointermove", onWindowMove, true);
			window.addEventListener("pointerup", onWindowUp, true);
			window.addEventListener("pointercancel", onWindowCancel, true);
			window.addEventListener("blur", onWindowBlur, true);

			panCleanupRef.current = () => {
				endPanSession(false);
				cleanupWindowListeners();
			};
		};

		const onWindowPointerDownCapture = (event: PointerEvent) => {
			const target = event.target as Node | null;
			if (!target || !container.contains(target)) {
				return;
			}
			startPanFromPointerDown(event);
		};

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("pointerdown", onWindowPointerDownCapture, true);

		return () => {
			panCleanupRef.current?.();
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener(
				"pointerdown",
				onWindowPointerDownCapture,
				true,
			);
			document.body.classList.remove("panning-inert");
		};
	}, [containerRef, emit]);
}
