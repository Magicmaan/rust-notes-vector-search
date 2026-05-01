import { Vector2D, type Vector2DLike } from "@/lib/utils";

/**
 * Simple Rectangle class for geometry calculations
 */
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

class NoteDisplay extends Rectangle {
	id: string;
	note: Note;
	stat: boolean = false;
	backgroundColor?: string;
	// Geometry values are grid units and spans, not absolute pixels.
	// x/y represent the top-left grid coordinate.
	// width/height represent cell spans.
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
		super({ x, y, width, height });
		this.id = note.id;
		this.note = note;
		this.stat = stat;
		this.backgroundColor = backgroundColor;
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

export { NoteDisplay };
