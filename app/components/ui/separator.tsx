import React from "react";

import { cn } from "@/lib/utils/utils";

function Separator({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<"hr"> & {
	orientation?: "horizontal" | "vertical";
}) {
	return (
		<hr
			data-slot="separator"
			className={cn(
				"shrink-0 bg-primary-400 border-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
				orientation === "vertical" && "h-full w-px",
				className,
			)}
			{...props}
		/>
	);
}

export { Separator };
