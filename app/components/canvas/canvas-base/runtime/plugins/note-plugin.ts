import type { CanvasOperation, FrameContext } from "../types";
import { PluginBase } from "./types";
import { DRAG_THRESHOLD_PX } from "@/lib/drag-config";
import { buildDragCommit, buildDragPreview } from "./note/drag";
import { resolveSelectionOnPointerDown } from "./note/selection";
import { createSessionId, transitionSession } from "./note/session";
import { computeResizePreview } from "./note/resize";
import { resolveNoteElement, resolveResizeAnchor } from "./note/target";
import type { NotePluginState, NoteSession } from "./note/types";

function createResizeAttrsOperation(
	elementId: string,
	state: "none" | string,
	heading: "none" | "left" | "right" | "top" | "bottom",
): CanvasOperation {
	return { type: "ui.setResizeAttrs", elementId, state, heading };
}

export class NotePlugin extends PluginBase<NotePluginState> {
	name = "Note Plugin";
	description = "Handles note selection, movement, and resize interactions.";
	version = "0.4.0";

	state: NotePluginState = {
		session: null,
	};

	private sessionCounter = 0;

	private nextSessionId() {
		this.sessionCounter += 1;
		return createSessionId(this.sessionCounter);
	}

	private clearSession() {
		this.state.session = null;
	}

	private requireTransition(
		session: NoteSession,
		next: NoteSession["state"],
	): boolean {
		const ok = transitionSession(session, next);
		if (!ok) {
			this.clearSession();
		}
		return ok;
	}

	private endSession(session: NoteSession): CanvasOperation {
		return { type: "interaction.endSession", sessionId: session.id };
	}

	protected override onPointerDown(
		context: FrameContext,
	): CanvasOperation | CanvasOperation[] | null {
		if (context.flags.isPanning || context.flags.spaceHeld) return null;
		if (this.state.session) return null;

		const resolved = resolveNoteElement(context.event.target);
		if (!resolved) return null;
		const element = context.ports.query.getElement(resolved.elementId);
		if (!element || element.variant !== "note") return null;
		if (context.event.button !== 0 && context.event.button !== 2) return null;

		const selected = context.ports.read.getState().selectedNoteIds;
		const nextSelection = resolveSelectionOnPointerDown(
			selected,
			element.id,
			Boolean(context.event.shiftKey),
		);

		const session: NoteSession = {
			id: this.nextSessionId(),
			pointerId: context.event.pointerId,
			elementId: element.id,
			state: "idle",
			baseline: element,
			startScreenX: context.pointer.screenX,
			startScreenY: context.pointer.screenY,
			resizeAnchor:
				context.event.button === 2
					? resolveResizeAnchor(
							resolved.node,
							context.pointer.screenX,
							context.pointer.screenY,
						)
					: { horizontal: "right", vertical: "bottom" },
			resizeHeading: "right",
			resizeLastPlacement:
				context.event.button === 2
					? {
							x: element.x,
							y: element.y,
							width: element.width,
							height: element.height,
						}
					: null,
			resizeMoved: false,
		};
		this.state.session = session;
		if (
			!this.requireTransition(
				session,
				context.event.button === 2 ? "resizing" : "pressed",
			)
		) {
			return null;
		}

		const ops: CanvasOperation[] = [
			{
				type: "interaction.beginSession",
				sessionId: session.id,
				kind: context.event.button === 2 ? "note.resize" : "note.drag",
			},
		];
		if (nextSelection !== selected) {
			ops.push({ type: "selection.set", ids: nextSelection });
		}
		if (context.event.button === 2) {
			ops.push(createResizeAttrsOperation(element.id, "start", "none"));
		}
		return ops;
	}

	protected override onPointerMove(
		context: FrameContext,
	): CanvasOperation | CanvasOperation[] | null {
		const session = this.state.session;
		if (!session || context.event.pointerId !== session.pointerId) return null;

		if (session.state === "pressed") {
			const dx = context.pointer.screenX - session.startScreenX;
			const dy = context.pointer.screenY - session.startScreenY;
			if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
				if (!this.requireTransition(session, "dragging")) return null;
			}
		}

		if (session.state === "dragging") {
			return [
				{ type: "interaction.updateSession", sessionId: session.id },
				{ type: "element.previewBulk", elements: [buildDragPreview(session, context)] },
			];
		}

		if (session.state === "resizing") {
			const result = computeResizePreview(session, context);
			if (!result) return null;
			session.resizeMoved = result.moved;
			session.resizeHeading = result.heading;
			session.resizeLastPlacement = result.placement;
			return [
				{ type: "interaction.updateSession", sessionId: session.id },
				createResizeAttrsOperation(
					session.elementId,
					"active",
					session.resizeHeading,
				),
				{ type: "element.previewBulk", elements: [result.preview] },
			];
		}

		return null;
	}

	protected override onPointerUp(
		context: FrameContext,
	): CanvasOperation | CanvasOperation[] | null {
		const session = this.state.session;
		if (!session || context.event.pointerId !== session.pointerId) return null;

		if (session.state === "pressed") {
			if (!this.requireTransition(session, "idle")) return null;
			this.clearSession();
			return this.endSession(session);
		}

		if (session.state === "dragging") {
			const committed = buildDragCommit(session, context);
			if (!this.requireTransition(session, "idle")) return null;
			this.clearSession();
			return [
				this.endSession(session),
				{ type: "element.commitBulk", elements: [committed] },
			];
		}

		if (session.state === "resizing") {
			if (!this.requireTransition(session, "idle")) return null;
			const placement = session.resizeLastPlacement;
			const baseline = session.baseline;
			this.clearSession();
			if (!placement || !session.resizeMoved) {
				return [
					this.endSession(session),
					createResizeAttrsOperation(session.elementId, "none", "none"),
				];
			}
			return [
				this.endSession(session),
				createResizeAttrsOperation(session.elementId, "stop", "none"),
				{
					type: "element.commitBulk",
					elements: [
						{
							...baseline,
							x: placement.x,
							y: placement.y,
							width: placement.width,
							height: placement.height,
						},
					],
				},
			];
		}

		return null;
	}

	protected override onPointerCancel():
		| CanvasOperation
		| CanvasOperation[]
		| null {
		const session = this.state.session;
		if (!session) return null;
		if (!this.requireTransition(session, "cancelling")) return null;
		const ops: CanvasOperation[] = [
			this.endSession(session),
			{ type: "element.rollbackSession", elements: [session.baseline] },
			createResizeAttrsOperation(session.elementId, "none", "none"),
		];
		this.requireTransition(session, "idle");
		this.clearSession();
		return ops;
	}

	protected override onBlur(): CanvasOperation | CanvasOperation[] | null {
		return this.onPointerCancel();
	}
}
