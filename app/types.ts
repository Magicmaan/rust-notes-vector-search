import { Vector2D, type Vector2DLike } from "@/lib/utils/math";

class Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;

	constructor({
		x,
		y,
		width,
		height,
	}: { x: number; y: number; width: number; height: number }) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}

export type Note = {
	id: string;
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
};

export type CanvasElementVariant = "note" | "title";

export type CanvasTitleContent = {
	text: string;
	sizePx?: number;
	weight?: number;
};

export type CanvasElementContentByVariant = {
	note: Note;
	title: CanvasTitleContent;
};

type CanvasElementConstructorInput<T extends CanvasElementVariant> = {
	id: string;
	variant: T;
	content: CanvasElementContentByVariant[T];
	x: number;
	y: number;
	width: number;
	height: number;
	stat?: boolean;
	backgroundColor?: string;
};

class CanvasElementDisplay<V extends CanvasElementVariant> extends Rectangle {
	id: string;
	variant: V;
	content: CanvasElementContentByVariant[V];
	stat: boolean;
	backgroundColor?: string;

	constructor(input: CanvasElementConstructorInput<V>) {
		super({ x: input.x, y: input.y, width: input.width, height: input.height });
		this.id = input.id;
		this.variant = input.variant;
		this.content = input.content;
		this.stat = input.stat ?? false;
		this.backgroundColor = input.backgroundColor;
	}

	center(): Vector2D {
		return new Vector2D(this.x + this.width / 2, this.y + this.height / 2);
	}

	cornerFromCenter(position: Vector2DLike): Vector2D {
		return Vector2D.from(position).subtract({
			x: this.width / 2,
			y: this.height / 2,
		});
	}

	position(): Vector2D {
		return new Vector2D(this.x, this.y);
	}

	size(): Vector2D {
		return new Vector2D(this.width, this.height);
	}

	updatePosition(newPosition: Vector2DLike) {
		const position = Vector2D.from(newPosition);
		this.x = position.x;
		this.y = position.y;
	}
}

export type AnyCanvasElementDisplay =
	| CanvasElementDisplay<"note">
	| CanvasElementDisplay<"title">;

class NoteDisplay extends CanvasElementDisplay<"note"> {
	constructor({
		x,
		y,
		width,
		height,
		note,
		stat = false,
		backgroundColor,
	}: {
		x: number;
		y: number;
		width: number;
		height: number;
		note: Note;
		stat?: boolean;
		backgroundColor?: string;
	}) {
		super({
			id: note.id,
			variant: "note",
			content: note,
			x,
			y,
			width,
			height,
			stat,
			backgroundColor,
		});
	}

	get note(): Note {
		return this.content;
	}
}

class TitleDisplay extends CanvasElementDisplay<"title"> {
	constructor({
		id,
		x,
		y,
		width,
		height,
		content,
		stat = false,
		backgroundColor,
	}: {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		content: CanvasTitleContent;
		stat?: boolean;
		backgroundColor?: string;
	}) {
		super({
			id,
			variant: "title",
			content,
			x,
			y,
			width,
			height,
			stat,
			backgroundColor,
		});
	}
}

export function cloneElementWithGeometry(
	element: AnyCanvasElementDisplay,
	geometry: { x: number; y: number; width?: number; height?: number },
): AnyCanvasElementDisplay {
	if (element.variant === "title") {
		return new TitleDisplay({
			id: element.id,
			x: geometry.x,
			y: geometry.y,
			width: geometry.width ?? element.width,
			height: geometry.height ?? element.height,
			content: element.content,
			stat: element.stat,
			backgroundColor: element.backgroundColor,
		});
	}

	return new NoteDisplay({
		x: geometry.x,
		y: geometry.y,
		width: geometry.width ?? element.width,
		height: geometry.height ?? element.height,
		note: element.content,
		stat: element.stat,
		backgroundColor: element.backgroundColor,
	});
}

export { CanvasElementDisplay, NoteDisplay, TitleDisplay };
