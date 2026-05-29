import test from "node:test";
import assert from "node:assert/strict";
import { resolveMoveCommit } from "./move";

test("falls back to nearest free when area occupied", () => {
	const result = resolveMoveCommit({
		bounds: {
			gridX: 1,
			gridY: 1,
			gridWidth: 2,
			gridHeight: 2,
			pixelX: 10,
			pixelY: 10,
		},
		deltaPixelX: 30,
		deltaPixelY: 0,
		cellWidth: 10,
		cellHeight: 10,
		excludeIds: "a",
		searchRadius: 20,
		isAreaFree: () => false,
		findNearestFree: () => ({ x: 5, y: 1 }),
	});
	assert.equal(result.resolvedGridX, 5);
	assert.equal(result.resolvedGridY, 1);
});
