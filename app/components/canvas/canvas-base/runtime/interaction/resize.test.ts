import test from "node:test";
import assert from "node:assert/strict";
import { resolveResizePlacement } from "./resize";

const cellWidth = 10;
const cellHeight = 10;

function run(input: Partial<Parameters<typeof resolveResizePlacement>[0]>) {
	return resolveResizePlacement({
		anchor: { horizontal: "right", vertical: "bottom" },
		baseline: { id: "a", x: 0, y: 0, width: 4, height: 4 },
		deltaX: 0,
		deltaY: 0,
		cellWidth,
		cellHeight,
		findOccupyingIds: () => [],
		getElement: () => undefined,
		fallbackPlacement: { x: 0, y: 0, width: 4, height: 4 },
		...input,
	});
}

test("horizontal blocked preserves vertical movement", () => {
	const placement = run({
		deltaX: 40,
		deltaY: 40,
		findOccupyingIds: () => ["b"],
		getElement: () => ({ x: 3, y: 1, width: 2, height: 2 }),
	});
	assert.equal(placement.y > 0, true);
	assert.equal(placement.height > 4, true);
	assert.equal(placement.width >= 2, true);
});

test("vertical blocked preserves horizontal movement", () => {
	const placement = run({
		deltaX: 40,
		deltaY: 40,
		findOccupyingIds: () => ["b"],
		getElement: () => ({ x: 1, y: 3, width: 2, height: 2 }),
	});
	assert.equal(placement.x >= 0, true);
	assert.equal(placement.width > 4, true);
	assert.equal(placement.height >= 2, true);
});

test("never returns non-positive dimensions", () => {
	const placement = run({
		deltaX: -1000,
		deltaY: -1000,
		findOccupyingIds: () => ["b"],
		getElement: () => ({ x: 0, y: 0, width: 100, height: 100 }),
	});
	assert.equal(placement.width > 0, true);
	assert.equal(placement.height > 0, true);
});
