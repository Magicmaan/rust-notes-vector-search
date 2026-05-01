import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type Vector2DLike =
	| {
			x: number;
			y: number;
	  }
	| [number, number]
	| Vector2D;

export class Vector2D {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	static from(vec: Vector2DLike): Vector2D {
		if (Array.isArray(vec)) {
			return new Vector2D(vec[0], vec[1]);
		}
		if (vec instanceof Vector2D) {
			return vec;
		} else {
			return new Vector2D(vec.x, vec.y);
		}
	}

	toArray(): [number, number] {
		return [this.x, this.y];
	}

	toObject(): { x: number; y: number } {
		return { x: this.x, y: this.y };
	}

	distanceTo(other: Vector2DLike): number {
		const o = Vector2D.from(other);
		return (this.x - o.x) ** 2 + (this.y - o.y) ** 2;
	}

	add(other: Vector2DLike): Vector2D {
		const o = Vector2D.from(other);
		return new Vector2D(this.x + o.x, this.y + o.y);
	}

	addScalar(scalar: number): Vector2D {
		return new Vector2D(this.x + scalar, this.y + scalar);
	}

	subtract(other: Vector2DLike): Vector2D {
		const o = Vector2D.from(other);
		return new Vector2D(this.x - o.x, this.y - o.y);
	}

	subtractScalar(scalar: number): Vector2D {
		return new Vector2D(this.x - scalar, this.y - scalar);
	}

	scale(scalar: number): Vector2D {
		return new Vector2D(this.x * scalar, this.y * scalar);
	}

	normalize(): Vector2D {
		const length = Math.sqrt(this.x ** 2 + this.y ** 2);
		if (length === 0) return new Vector2D(0, 0);
		return new Vector2D(this.x / length, this.y / length);
	}
}

export const toVector2D = (vec: Vector2DLike): Vector2D => {
	return Vector2D.from(vec);
};
