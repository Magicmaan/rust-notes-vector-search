import React from "react";

export default function Section({ children }: { children: React.ReactNode }) {
	return (
		<section
			data-ui="section"
			className="w-full py-4 text-foreground flex flex-col"
		>
			{children}
		</section>
	);
}
