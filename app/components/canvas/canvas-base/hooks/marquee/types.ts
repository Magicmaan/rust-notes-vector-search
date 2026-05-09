import type {
	AnyCanvasElementDisplay,
	CanvasElementContentByVariant,
	CanvasElementVariant,
} from "@/types";

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
	variant: CanvasElementVariant;
	content: CanvasElementContentByVariant[CanvasElementVariant];
	x: number;
	y: number;
	width: number;
	height: number;
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
	buildPreview: (deltaPixelX: number, deltaPixelY: number) => AnyCanvasElementDisplay[];
	commit: (resolvedGridX: number, resolvedGridY: number) => AnyCanvasElementDisplay[];
	rollback: () => AnyCanvasElementDisplay[];
}
