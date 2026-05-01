import React from "react";
import { type ReactNode } from "react";

type GroupTitleProps = {
	children: ReactNode;
	right?: ReactNode;
};

export function GroupTitle({ children, right }: GroupTitleProps) {
	return (
		<div className="mb-2 flex items-center justify-between px-2">
			<span className="text-[11px] font-semibold tracking-[0.11em] text-foreground-muted uppercase">
				{children}
			</span>
			{right}
		</div>
	);
}
