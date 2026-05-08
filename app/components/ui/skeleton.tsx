import React from "react";
import { cn } from "@/lib/utils/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-primary-400", className)}
			{...props}
		/>
	);
}

export { Skeleton };
