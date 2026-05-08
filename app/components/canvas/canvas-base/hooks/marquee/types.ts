import type { NoteDisplay } from "@/types";

export type WorldRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type SelectionSession = {
	active: boolean;
	pointerId: number;
	startedWithShift: boolean;
	startWorldX: number;
	startWorldY: number;
	currentWorldX: number;
	currentWorldY: number;
	selectedIdsAtStart: string[];
};

export type GroupMoveSnapshotItem = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	note: NoteDisplay["note"];
	stat: boolean;
	backgroundColor?: string;
};

export type GroupMoveBounds = {
	gridX: number;
	gridY: number;
	gridWidth: number;
	gridHeight: number;
	pixelX: number;
	pixelY: number;
	pixelWidth: number;
	pixelHeight: number;
};

export type GroupMoveSession = {
	active: boolean;
	pointerId: number;
};

export interface GroupMovableTarget {
	bounds: GroupMoveBounds;
	selectedIds: string[];
	buildPreview: (deltaPixelX: number, deltaPixelY: number) => NoteDisplay[];
	commit: (resolvedGridX: number, resolvedGridY: number) => NoteDisplay[];
	rollback: () => NoteDisplay[];
}
