import React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"h-9 w-full min-w-0 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary-300 selection:text-foreground-bold file:inline-flex file:h-7 file:border-0 file:bg-primary-300/0 file:text-sm file:font-medium file:text-foreground-normal placeholder:text-foreground-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-foreground-normal focus-visible:ring-[3px] focus-visible:ring-foreground-normal/50",
				"aria-invalid:border-primary-500 aria-invalid:ring-primary-500/20 dark:aria-invalid:ring-primary-500/40",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
