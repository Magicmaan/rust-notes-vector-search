import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

type DragValueControlProps = {
	value: number;
	onChange: (nextValue: number) => void;
	min?: number;
	max?: number;
	sensitivity?: number;
	decimalPrecision?: number;
	numberFormat?: "percentage" | "decimal";
	enableShiftStep?: boolean;
	enableCtrlStep?: boolean;
	asChild?: boolean;
	children?: ReactNode;
};

export default function DragValueControl({
	value,
	onChange,
	min = 0.25,
	max = 3,
	sensitivity = 0.003,
	decimalPrecision = 1,
	numberFormat = "percentage",
	enableShiftStep = true,
	enableCtrlStep = true,
	asChild = false,
	children,
}: DragValueControlProps) {
	const [isDragging, setIsDragging] = useState(false);
	const dragStateRef = useRef<{
		pointerId: number;
		startX: number;
		startY: number;
		startValue: number;
		didDrag: boolean;
		accumulatedMovement: number;
	} | null>(null);

	const clampValue = (nextValue: number) =>
		Math.max(min, Math.min(max, nextValue));
	const snapToStep = (nextValue: number, step: number) =>
		Math.round(nextValue / step) * step;

	const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		const target = event.currentTarget;
		dragStateRef.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			startValue: value,
			didDrag: false,
			accumulatedMovement: 0,
		};
		setIsDragging(true);
		target.setPointerCapture(event.pointerId);

		if (typeof target.requestPointerLock === "function") {
			try {
				target.requestPointerLock();
			} catch {
				// ignore
			}
		}
	};

	const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		const dragState = dragStateRef.current;
		if (!dragState || dragState.pointerId !== event.pointerId) {
			return;
		}

		const hasPointerLock = document.pointerLockElement === event.currentTarget;
		if (hasPointerLock) {
			dragState.accumulatedMovement += event.movementX - event.movementY;
		}

		const movement = hasPointerLock
			? dragState.accumulatedMovement
			: event.clientX - dragState.startX + (dragState.startY - event.clientY);
		if (Math.abs(movement) < 4) {
			return;
		}

		dragState.didDrag = true;
		const rawNextValue = clampValue(
			dragState.startValue + movement * sensitivity,
		);
		const stepSize =
			enableShiftStep && event.shiftKey
				? 0.25
				: enableCtrlStep && event.ctrlKey
					? 0.1
					: null;
		const nextValue =
			stepSize === null
				? rawNextValue
				: clampValue(snapToStep(rawNextValue, stepSize));

		onChange(nextValue);
	};

	const finishPointerInteraction = (
		event: ReactPointerEvent<HTMLElement>,
		resetOnClick: boolean,
	) => {
		const dragState = dragStateRef.current;
		if (!dragState || dragState.pointerId !== event.pointerId) {
			return;
		}

		if (resetOnClick && !dragState.didDrag) {
			onChange(1);
		}

		dragStateRef.current = null;
		setIsDragging(false);

		if (document.pointerLockElement === event.currentTarget) {
			try {
				document.exitPointerLock();
			} catch {
				// ignore
			}
		}

		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	};

	const formattedValue =
		numberFormat === "percentage"
			? `${(clampValue(value) * 100).toFixed(decimalPrecision)}%`
			: clampValue(value).toFixed(decimalPrecision);

	const sharedProps = {
		"data-drag-value-control": true,
		"data-dragging": isDragging,
		className:
			"touch-none select-none text-center cursor-grab data-[dragging=true]:cursor-grabbing",
		"aria-label":
			"Value control. Click to reset. Drag right or up to increase, left or down to decrease.",
		title: "Click to reset. Drag right/up to increase, left/down to decrease.",
		onPointerDown: handlePointerDown,
		onPointerMove: handlePointerMove,
		onPointerUp: (event: ReactPointerEvent<HTMLElement>) =>
			finishPointerInteraction(event, true),
		onPointerCancel: (event: ReactPointerEvent<HTMLElement>) =>
			finishPointerInteraction(event, false),
	};

	const Comp = asChild ? Slot : "button";

	return <Comp {...sharedProps}>{asChild ? children : formattedValue}</Comp>;
}
