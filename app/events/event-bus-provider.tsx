import React from "react";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import type { AppEventName, AppEventPayload, EventBus } from "./schema";

export const EventBusContext = createContext<EventBus | null>(null);

export default function EventBusProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	// if an event is fired before the provider is mounted, queue it and dispatch once mounted
	const isMounted = useRef(false);
	const queue = useRef<Array<() => void>>([]);

	// this gets called once on mount, so any events emitted before the provider is mounted will be queued and dispatched immediately after mounting
	useEffect(() => {
		isMounted.current = true;
		queue.current.forEach((callback) => {
			callback();
		});
		queue.current = [];
	}, []);

	const dispatch = useCallback((callback: () => void) => {
		if (isMounted.current) {
			callback();
		} else {
			queue.current.push(callback);
		}
	}, []);

	const emit = useCallback(
		<T extends AppEventName>(eventName: T, payload: AppEventPayload<T>) => {
			dispatch(() => {
				window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
			});
		},
		[dispatch],
	);

	const subscribe = useCallback(
		<T extends AppEventName>(
			eventName: T,
			callback: (payload: AppEventPayload<T>) => void,
		) => {
			const handler = (event: CustomEvent) =>
				callback(event.detail as AppEventPayload<T>);
			window.addEventListener(eventName, handler as EventListener);
			return () => {
				window.removeEventListener(eventName, handler as EventListener);
			};
		},
		[],
	);

	const bus = useMemo<EventBus>(() => ({ emit, subscribe }), [emit, subscribe]);

	return (
		<EventBusContext.Provider value={bus}>{children}</EventBusContext.Provider>
	);
}

export function useEventBus(): EventBus {
	const bus = use(EventBusContext);
	if (!bus) {
		throw new Error("useEventBus must be used within an EventBusProvider");
	}
	return bus;
}

export function useEventListener<T extends AppEventName>(
	eventName: T,
	handler: (payload: AppEventPayload<T>) => void,
) {
	const { subscribe } = useEventBus();
	const callbackRef = useRef(handler);

	useEffect(() => {
		callbackRef.current = handler;
	}, [handler]);

	useEffect(() => {
		return subscribe(eventName, (payload) => callbackRef.current(payload));
	}, [eventName, subscribe]);
}
