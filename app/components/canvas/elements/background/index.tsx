import clsx from "clsx";
import React from "react";

type CanvasGridBackgroundElementProps = {
	className?: string;
	disabled?: boolean;
};

export default function CanvasGridBackgroundElement({
	className,
	disabled = true,
}: CanvasGridBackgroundElementProps) {
	return (
		<div
			aria-hidden="true"
			className={clsx(
				"canvas-grid-background absolute inset-0",
				disabled ? "pointer-events-none" : "pointer-events-auto",
				className,
			)}
			data-disabled={disabled}
		>
			<div className="canvas-grid-background__dots absolute inset-0" />
			<div className="canvas-grid-background__vignette absolute inset-0" />
		</div>
	);
}
