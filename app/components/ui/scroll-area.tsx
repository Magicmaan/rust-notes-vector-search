import React from "react";
("use client");

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/lib/utils/utils";

function ScrollArea({
	className,
	contentClassName,
	children,
	...props
}: {
	contentClassName?: string;
} & ScrollAreaPrimitive.Root.Props) {
	return (
		<ScrollAreaPrimitive.Root
			data-slot="scroll-area"
			className={cn("relative box-border h-full rounded-lg!", className)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				data-slot="scroll-area-viewport"
				className="size-full rounded-lg"
			>
				<ScrollAreaPrimitive.Content
					className={cn(
						"flex rounded-lg flex-col gap-1 px-4",
						contentClassName,
					)}
				>
					{children}
				</ScrollAreaPrimitive.Content>
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
}

function ScrollBar({
	className,
	orientation = "vertical",
	...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
	return (
		<ScrollAreaPrimitive.Scrollbar
			data-slot="scroll-area-scrollbar"
			data-orientation={orientation}
			orientation={orientation}
			className={cn(
				"flex justify-center bg-debug-3 w-3 rounded-xs m-2 opacity-0 pointer-events-none",
				"data-hovering:opacity-100 data-scrolling:opacity-100",
				className,
			)}
			{...props}
		>
			<ScrollAreaPrimitive.Thumb
				data-slot="scroll-area-thumb"
				className="w-full rounded-[inherit] bg-foreground"
			/>
		</ScrollAreaPrimitive.Scrollbar>
	);
}

export { ScrollArea, ScrollBar };
