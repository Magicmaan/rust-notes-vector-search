import type { NoteInteractionState, NoteSession } from "./types";

const ALLOWED_TRANSITIONS: Record<NoteInteractionState, NoteInteractionState[]> = {
	idle: ["pressed", "resizing"],
	pressed: ["dragging", "idle", "cancelling"],
	dragging: ["idle", "cancelling"],
	resizing: ["idle", "cancelling"],
	cancelling: ["idle"],
};

export function transitionSession(
	session: NoteSession,
	next: NoteInteractionState,
): boolean {
	if (session.state === next) return true;
	if (!ALLOWED_TRANSITIONS[session.state].includes(next)) {
		console.warn(
			`[NotePlugin] illegal transition ${session.state} -> ${next}`,
		);
		return false;
	}
	session.state = next;
	return true;
}

export function createSessionId(counter: number): string {
	return `note-${counter}`;
}
