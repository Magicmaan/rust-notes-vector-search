import React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/utils";
import clsx from "clsx";

const buttonVariants = cva(
	clsx(
		"group/button inline-flex shrink-0 items-center",
		"rounded-md border border-transparent outline-none select-none",
		"font-medium whitespace-nowrap transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50",
	),
	{
		variants: {
			variant: {
				default: "bg-primary-300 text-foreground-bold hover:bg-primary-300/80",
				transparent: "bg-transparent",
			},
			size: {
				default: "h-9 gap-1.5 px-2.5",
			},
			effect: {
				default:
					"hover:[--scale-bounce-intensity:0.5] hover:bg-primary-200/15 hover:duration-500",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			effect: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	effect = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(
				buttonVariants({ variant, size, effect, className }),
				" origin-center",
			)}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
