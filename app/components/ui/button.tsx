import React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent  text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-foreground-normal focus-visible:ring-3 focus-visible:ring-foreground-normal/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-primary-500 aria-invalid:ring-3 aria-invalid:ring-primary-500/20 dark:aria-invalid:border-primary-500/50 dark:aria-invalid:ring-primary-500/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "bg-primary-300 text-foreground-bold hover:bg-primary-300/80",
				outline:
					"border-primary-400 bg-primary-300 shadow-xs hover:bg-primary-400 hover:text-foreground-normal aria-expanded:bg-primary-400 aria-expanded:text-foreground-normal dark:border-primary-400 dark:bg-primary-400/30 dark:hover:bg-primary-400/50",
				secondary:
					"bg-primary-400 text-foreground-normal hover:bg-primary-400/80 aria-expanded:bg-primary-400 aria-expanded:text-foreground-normal",
				ghost:
					"hover:bg-primary-400 hover:text-foreground-normal aria-expanded:bg-primary-400 aria-expanded:text-foreground-normal dark:hover:bg-primary-400/50",
				destructive:
					"bg-primary-500/10 text-foreground-bold hover:bg-primary-500/20 focus-visible:border-primary-500/40 focus-visible:ring-primary-500/20 dark:bg-primary-500/20 dark:hover:bg-primary-500/30 dark:focus-visible:ring-primary-500/40",
				link: "text-foreground-bold underline-offset-4 hover:underline",
			},
			size: {
				default:
					"h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
				lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				icon: "size-9",
				"icon-xs":
					"size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
				"icon-sm":
					"size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
