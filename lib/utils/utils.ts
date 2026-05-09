import { err, Result } from "neverthrow";
import { type ClassValue, clsx } from "clsx";
import React, { JSXElementConstructor } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Find children with a specific data attribute
 * @param children - The children to search through
 * @param attributeName - The data attribute to look for (e.g., "data-slot")
 * @param value - The value of the data attribute to match (e.g., "header")
 * @returns [React.ReactNode, React.ReactNode[]] - An array where the first element is the matched child and the second element is an array of the remaining children. If no match is found, returns all children as the second element.
 */
export function getChildrenWithData(
	children: React.ReactNode,
	attributeName: string,
	value: string,
): [React.ReactNode[], React.ReactNode[]] {
	const childArray = React.Children.toArray(children);
	const matchingChildren = childArray.filter((child) => {
		if (React.isValidElement<{ [key: string]: unknown }>(child)) {
			return child.props[attributeName] === value;
		}
		return false;
	});
	return [
		matchingChildren,
		childArray.filter((child) => !matchingChildren.includes(child)),
	];
}

export function getChildrenWithType(
	children: React.ReactNode,
	type: JSXElementConstructor<any>,
) {
	const childArray = React.Children.toArray(children);
	const childIndex = childArray.findIndex((child) => {
		if (React.isValidElement(child)) {
			return child.type === type;
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
