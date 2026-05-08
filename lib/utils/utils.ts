import { err, Result } from "neverthrow";
import { type ClassValue, clsx } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Find children with a specific data attribute
 * @param children - The children to search through
 * @param attribute - The data attribute to look for (e.g., "data-slot")
 * @param slotName - The value of the data attribute to match (e.g., "header")
 * @returns [React.ReactNode, React.ReactNode[]] - An array where the first element is the matched child and the second element is an array of the remaining children. If no match is found, returns all children as the second element.
 */
export function getChildrenWithData(
	children: React.ReactNode,
	attribute: string,
	slotName: string,
): [React.ReactNode, React.ReactNode[]] {
	const childArray = React.Children.toArray(children);
	const childIndex = childArray.findIndex((child) => {
		if (React.isValidElement<{ [key: string]: unknown }>(child)) {
			return child.props[attribute] === slotName;
		}
		return false;
	});
	if (childIndex === -1) {
		return [null, childArray];
	}
	return [
		childArray[childIndex],
		childArray.filter((_, i) => i !== childIndex),
	];
}
