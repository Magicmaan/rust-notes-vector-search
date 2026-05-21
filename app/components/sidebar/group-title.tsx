import React from "react";
import { type ReactNode } from "react";

type GroupTitleProps = {
	children: ReactNode;
	right?: ReactNode;
};

export function GroupTitle({ children, right }: GroupTitleProps) {
	return (
		<div className="pl-2 flex items-center h-6 grow-0 justify-between">
			<span className="text-[11px] font-semibold tracking-[0.11em] text-foreground-muted uppercase">
				{children}
			</span>
			{right}
		</div>
	);
}
