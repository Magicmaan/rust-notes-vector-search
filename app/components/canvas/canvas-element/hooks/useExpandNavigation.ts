import { useCallback, useRef } from "react";
import { useNavigate } from "react-router";

const EXPAND_DELAY_MS = 500;

interface ExpandNavigation {
	onDoubleClick: () => void;
	cancel: () => void;
}

/**
 * Handle double-click to expand note into dedicated view.
 * Used during development but can be extended with animations/transitions.
 */
export function useExpandNavigation(elementId: string): ExpandNavigation {
	const nav = useNavigate();
	const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const onDoubleClick = useCallback(() => {
		if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);

		expandTimeoutRef.current = setTimeout(() => {
			nav(`/note/${elementId}`);
			expandTimeoutRef.current = null;
		}, EXPAND_DELAY_MS);
	}, [elementId, nav]);

	const cancel = useCallback(() => {
		if (expandTimeoutRef.current) {
			clearTimeout(expandTimeoutRef.current);
			expandTimeoutRef.current = null;
		}
	}, []);

	return { onDoubleClick, cancel };
}
